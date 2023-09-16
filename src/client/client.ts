import BaseClient, { BaseClientOptions } from "#baseClient.js";
import { IProver, IVerifyingProviderConstructor } from "#interfaces.js";
import { IClientVerifyingProvider } from "#client/verifyingProvider.js";
import { LightClientUpdate } from "#types.js";
import { computeSyncPeriodAtSlot } from "@lodestar/light-client/utils";
import { init } from "@chainsafe/bls/switchable";

interface Config extends BaseClientOptions {
  prover: IProver;
  provider: IVerifyingProviderConstructor<IClientVerifyingProvider>;
  rpcHandler: Function;
}

export default class Client extends BaseClient {
  protected declare options: Config;

  constructor(options: Config) {
    super(options);
  }

  private provider?: IClientVerifyingProvider;

  async sync(): Promise<void> {
    await super.sync();
    await this.boot();
  }

  private async boot() {
    if (!this.provider) {
      const { blockHash, blockNumber } = await this.getNextValidExecutionInfo();
      const factory = this.options.provider;
      const provider = new factory(
        this.options.rpcHandler,
        blockNumber,
        blockHash,
      );
      this.subscribe((ei) => {
        this.options.loggerInfo(
          `Received a new blockheader: ${ei.blockNumber} ${ei.blockHash}`,
        );
        provider.update(ei.blockNumber, ei.blockHash);
      });

      this.provider = provider;
      this.booted = true;
    }
  }

  public async syncFromCheckpoint(checkpoint: LightClientUpdate) {
    this._latestPeriod = computeSyncPeriodAtSlot(
      checkpoint.attestedHeader.beacon.slot,
    );
    this.latestCommittee = checkpoint.nextSyncCommittee.pubkeys;
    if (this._latestPeriod + 1 === this.getCurrentPeriod()) {
      this.booted = true;
      this.emit("synced");
      await init("herumi");

      await this.getLatestExecution(false);
    } else {
      await super.sync();
    }
  }

  public async rpcCall(method: string, params: any) {
    return this.provider?.rpcMethod(method, params);
  }
}
