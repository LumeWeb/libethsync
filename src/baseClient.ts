import { ClientConfig, ExecutionInfo, IProver, IStore } from "#interfaces.js";
import { POLLING_DELAY } from "#constants.js";
import {
  computeSyncPeriodAtSlot,
  deserializeSyncCommittee,
  getCurrentSlot,
} from "@lodestar/light-client/utils";
import bls, { init } from "@chainsafe/bls/switchable";
import { Mutex } from "async-mutex";
import { fromHexString, toHexString } from "@chainsafe/ssz";
import {
  deserializePubkeys,
  getDefaultClientConfig,
  optimisticUpdateVerify,
} from "#util.js";
import {
  LightClientUpdate,
  OptimisticUpdate,
  OptimisticUpdateCallback,
} from "#types.js";
import { assertValidLightClientUpdate } from "@lodestar/light-client/validation";
import * as capella from "@lodestar/types/capella";

export interface BaseClientOptions {
  prover: IProver;
  store: IStore;
  optimisticUpdateCallback: OptimisticUpdateCallback;
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
  private optimisticMutex = new Mutex();

  constructor(options: BaseClientOptions) {
    this.options = options;
  }

  private _latestOptimisticUpdate?: Uint8Array;

  get latestOptimisticUpdate(): Uint8Array {
    return this._latestOptimisticUpdate as Uint8Array;
  }

  private _latestPeriod: number = -1;

  get latestPeriod(): number {
    return this._latestPeriod;
  }

  public get isSynced() {
    return (
      this._latestPeriod === this.getCurrentPeriod() &&
      this.getLastBlock() === this.getCurrentBlock()
    );
  }

  public get store(): IStore {
    return this.options.store as IStore;
  }

  public async sync(): Promise<void> {
    await init("herumi");

    await this._sync();
    await this.getLatestExecution(false);
  }

  public getCurrentPeriod(): number {
    return computeSyncPeriodAtSlot(
      getCurrentSlot(this.config.chainConfig, this.genesisTime),
    );
  }

  public getCurrentBlock(): number {
    return getCurrentSlot(this.config.chainConfig, this.genesisTime);
  }
  public getLastBlock(): number | null {
    if (this._latestOptimisticUpdate) {
      return capella.ssz.LightClientOptimisticUpdate.deserialize(
        this._latestOptimisticUpdate,
      ).attestedHeader.beacon.slot;
    }

    return null;
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

  async syncProver(
    startPeriod: number,
    currentPeriod: number,
    startCommittee: Uint8Array[],
  ): Promise<{ syncCommittee: Uint8Array[]; period: number }> {
    try {
      const updates = await this.options.prover.getSyncUpdate(
        startPeriod,
        currentPeriod - startPeriod,
      );

      for (let i = 0; i < updates.length; i++) {
        const curPeriod = startPeriod + i;
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

        await this.options.store.addUpdate(curPeriod, update);

        startCommittee = validOrCommittee as Uint8Array[];
      }
    } catch (e) {
      console.error(`failed to fetch sync update for period(${startPeriod})`);
      return {
        syncCommittee: startCommittee,
        period: startPeriod,
      };
    }
    return {
      syncCommittee: startCommittee,
      period: currentPeriod,
    };
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
      await this.syncToLatestBlock(callback);
    }, POLLING_DELAY);
  }

  public async syncToLatestBlock(callback?: (ei: ExecutionInfo) => void) {
    try {
      const ei = await this.getLatestExecution();
      if (ei && ei.blockHash !== this.latestBlockHash) {
        this.latestBlockHash = ei.blockHash;
        return await callback?.(ei);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async getLatestExecution(sync = true): Promise<ExecutionInfo | null> {
    if (sync) {
      await this._sync();
    }

    const getExecInfo = (u: OptimisticUpdate) => {
      return {
        blockHash: toHexString(u.attestedHeader.execution.blockHash),
        blockNumber: u.attestedHeader.execution.blockNumber,
      };
    };

    if (this._latestOptimisticUpdate) {
      const update = capella.ssz.LightClientOptimisticUpdate.deserialize(
        this._latestOptimisticUpdate,
      );
      const diffInSeconds = Date.now() / 1000 - this.genesisTime;
      const currentSlot = Math.floor(
        diffInSeconds / this.config.chainConfig.SECONDS_PER_SLOT,
      );
      if (currentSlot <= update.attestedHeader.beacon.slot) {
        this.optimisticMutex.release();
        return getExecInfo(update);
      }
    }

    await this.optimisticMutex.acquire();
    const update = await this.options.optimisticUpdateCallback();

    const verify = await optimisticUpdateVerify(
      this.latestCommittee as Uint8Array[],
      update,
    );

    // TODO: check the update against the latest sync committee
    if (!verify.correct) {
      this.optimisticMutex.release();
      console.error(`Invalid Optimistic Update: ${verify.reason}`);
      return null;
    }

    this._latestOptimisticUpdate =
      capella.ssz.LightClientOptimisticUpdate.serialize(update);

    console.log(
      `Optimistic update verified for slot ${update.attestedHeader.beacon.slot}`,
    );

    this.optimisticMutex.release();

    return getExecInfo(update);
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
