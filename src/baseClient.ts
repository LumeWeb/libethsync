import { ClientConfig, ExecutionInfo, IProver, IStore } from "#interfaces.js";
import { POLLING_DELAY } from "#constants.js";
import {
  computeSyncPeriodAtSlot,
  getCurrentSlot,
} from "@lodestar/light-client/utils";
import { init } from "@chainsafe/bls/switchable";
import { Mutex } from "async-mutex";
import { fromHexString, toHexString } from "@chainsafe/ssz";
import { deserializePubkeys, getDefaultClientConfig } from "#util.js";
import { capella, LightClientUpdate } from "#types.js";
import { deserializeSyncCommittee } from "@lodestar/light-client/utils/index.js";
import bls from "@chainsafe/bls/switchable.js";
import { assertValidLightClientUpdate } from "@lodestar/light-client/validation.js";

export interface BaseClientOptions {
  prover: IProver;
  store: IStore;
}

export default abstract class BaseClient {
  protected latestCommittee?: Uint8Array[];
  protected latestBlockHash?: string;
  protected config: ClientConfig = getDefaultClientConfig();
  protected genesisCommittee: Uint8Array[] = this.config.genesis.committee.map(
    (pk) => fromHexString(pk),
  );
  protected genesisPeriod = computeSyncPeriodAtSlot(this.config.genesis.slot);
  protected booted = false;
  protected options: BaseClientOptions;
  private genesisTime = this.config.genesis.time;
  private syncMutex = new Mutex();

  constructor(options: BaseClientOptions) {
    this.options = options;
  }

  private _latestPeriod: number = -1;

  get latestPeriod(): number {
    return this._latestPeriod;
  }

  public get isSynced() {
    return this._latestPeriod === this.getCurrentPeriod();
  }

  public get store(): IStore {
    return this.options.store as IStore;
  }

  public async sync(): Promise<void> {
    await init("herumi");

    await this._sync();
  }

  public getCurrentPeriod(): number {
    return computeSyncPeriodAtSlot(
      getCurrentSlot(this.config.chainConfig, this.genesisTime),
    );
  }

  public async getNextValidExecutionInfo(
    retry: number = 10,
  ): Promise<ExecutionInfo> {
    if (retry === 0)
      throw new Error(
        "no valid execution payload found in the given retry limit",
      );
    const ei = await this.getLatestExecution();
    if (ei) return ei;
    // delay for the next slot
    await new Promise((resolve) => setTimeout(resolve, POLLING_DELAY));
    return this.getNextValidExecutionInfo(retry - 1);
  }

  protected async _sync() {
    await this.syncMutex.acquire();

    const currentPeriod = this.getCurrentPeriod();
    if (currentPeriod > this._latestPeriod) {
      if (!this.booted) {
        this.latestCommittee = await this.syncFromGenesis();
      } else {
        this.latestCommittee = await this.syncFromLastUpdate();
      }
      this._latestPeriod = currentPeriod;
    }

    this.syncMutex.release();
  }

  protected async subscribe(callback?: (ei: ExecutionInfo) => void) {
    setInterval(async () => {
      try {
        const ei = await this.getLatestExecution();
        if (ei && ei.blockHash !== this.latestBlockHash) {
          this.latestBlockHash = ei.blockHash;
          return await callback?.(ei);
        }
      } catch (e) {
        console.error(e);
      }
    }, POLLING_DELAY);
  }

  protected async getLatestExecution(): Promise<ExecutionInfo | null> {
    await this._sync();
    const update = capella.ssz.LightClientUpdate.deserialize(
      this.store.getUpdate(this.latestPeriod),
    );

    return {
      blockHash: toHexString(update.attestedHeader.execution.blockHash),
      blockNumber: update.attestedHeader.execution.blockNumber,
    };
  }
  async syncProver(
    startPeriod: number,
    currentPeriod: number,
    startCommittee: Uint8Array[],
  ): Promise<{ syncCommittee: Uint8Array[]; period: number }> {
    for (let period = startPeriod; period < currentPeriod; period += 1) {
      try {
        const updates = await this.options.prover.getSyncUpdate(
          period,
          currentPeriod,
        );

        for (let i = 0; i < updates.length; i++) {
          const curPeriod = period + i;
          const update = updates[i];

          const validOrCommittee = await this.syncUpdateVerifyGetCommittee(
            startCommittee,
            curPeriod,
            update,
          );

          if (!(validOrCommittee as boolean)) {
            console.log(`Found invalid update at period(${curPeriod})`);
            return {
              syncCommittee: startCommittee,
              period: curPeriod,
            };
          }

          await this.options.store.addUpdate(period, update);

          startCommittee = validOrCommittee as Uint8Array[];
          period = curPeriod;
        }
      } catch (e) {
        console.error(`failed to fetch sync update for period(${period})`);
        return {
          syncCommittee: startCommittee,
          period,
        };
      }
    }
    return {
      syncCommittee: startCommittee,
      period: currentPeriod,
    };
  }

  protected async syncUpdateVerifyGetCommittee(
    prevCommittee: Uint8Array[],
    period: number,
    update: LightClientUpdate,
  ): Promise<false | Uint8Array[]> {
    const updatePeriod = computeSyncPeriodAtSlot(
      update.attestedHeader.beacon.slot,
    );
    if (period !== updatePeriod) {
      console.error(
        `Expected update with period ${period}, but received ${updatePeriod}`,
      );
      return false;
    }

    const prevCommitteeFast = deserializeSyncCommittee({
      pubkeys: prevCommittee,
      aggregatePubkey: bls.PublicKey.aggregate(
        deserializePubkeys(prevCommittee),
      ).toBytes(),
    });

    try {
      // check if the update has valid signatures
      await assertValidLightClientUpdate(
        this.config.chainConfig,
        prevCommitteeFast,
        update,
      );
      return update.nextSyncCommittee.pubkeys;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  protected async syncFromGenesis(): Promise<Uint8Array[]> {
    return this.syncFromLastUpdate(this.genesisPeriod);
  }

  protected async syncFromLastUpdate(
    startPeriod = this.latestPeriod,
  ): Promise<Uint8Array[]> {
    const currentPeriod = this.getCurrentPeriod();
    let startCommittee = this.genesisCommittee;
    console.debug(
      `Sync started from period(${startPeriod}) to period(${currentPeriod})`,
    );

    const { syncCommittee, period } = await this.syncProver(
      startPeriod,
      currentPeriod,
      startCommittee,
    );
    if (period === currentPeriod) {
      console.debug(
        `Sync completed from period(${startPeriod}) to period(${currentPeriod})`,
      );

      return syncCommittee;
    }

    throw new Error("no honest prover found");
  }
}
