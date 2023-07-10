import { ClientConfig, ExecutionInfo, IProver, IStore } from "#interfaces.js";
import { POLLING_DELAY } from "#constants.js";
import {
  computeSyncPeriodAtSlot,
  getCurrentSlot,
} from "@lodestar/light-client/utils";
import { init } from "@chainsafe/bls/switchable";
import { Mutex } from "async-mutex";
import { fromHexString } from "@chainsafe/ssz";
import { getDefaultClientConfig } from "#util.js";

import isNode from "detect-node";

export interface BaseClientOptions {
  prover: IProver;
  store?: IStore;
}

export default abstract class BaseClient {
  protected latestCommittee?: Uint8Array[];
  protected latestBlockHash?: string;
  protected config: ClientConfig = getDefaultClientConfig();
  protected genesisCommittee: Uint8Array[] = this.config.genesis.committee.map(
    (pk) => fromHexString(pk),
  );
  protected genesisPeriod = computeSyncPeriodAtSlot(this.config.genesis.slot);
  private genesisTime = this.config.genesis.time;
  protected booted = false;
  private syncMutex = new Mutex();
  protected options: BaseClientOptions;
  protected;

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

  public async sync(): Promise<void> {
    await init(isNode ? "blst-native" : "herumi");

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

  // committee and prover index of the first honest prover
  protected abstract syncFromGenesis(): Promise<Uint8Array[]>;

  protected abstract syncFromLastUpdate(
    startPeriod?: number,
  ): Promise<Uint8Array[]>;

  protected abstract getLatestExecution(): Promise<ExecutionInfo | null>;
}
