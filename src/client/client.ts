import BaseClient, { BaseClientOptions } from "#baseClient.js";
import { ExecutionInfo, IVerifyingProviderConstructor } from "#interfaces.js";
import { DEFAULT_BATCH_SIZE } from "#constants.js";
import { IClientProver } from "#client/prover.js";
import {
  getCommitteeHash,
  optimisticUpdateFromJSON,
  optimisticUpdateVerify,
} from "#util.js";
import { equalBytes } from "@noble/curves/abstract/utils";
import { IClientVerifyingProvider } from "#client/verifyingProvider.js";

interface Config extends BaseClientOptions {
  prover: IClientProver;
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

    if (!this.provider) {
      const { blockHash, blockNumber } = await this.getNextValidExecutionInfo();
      const factory = this.options.provider;
      const provider = new factory(
        this.options.rpcHandler,
        blockNumber,
        blockHash,
      );
      this.subscribe((ei) => {
        console.log(
          `Received a new blockheader: ${ei.blockNumber} ${ei.blockHash}`,
        );
        provider.update(ei.blockNumber, ei.blockHash);
      });

      this.provider = provider;
      this.booted = true;
    }
  }

  protected async getLatestExecution(): Promise<ExecutionInfo | null> {
    const updateJSON = await this.options.prover.callback(
      "consensus_optimistic_update",
    );
    const update = optimisticUpdateFromJSON(updateJSON);
    const verify = await optimisticUpdateVerify(
      this.latestCommittee as Uint8Array[],
      update,
    );
    if (!verify.correct) {
      console.error(`Invalid Optimistic Update: ${verify.reason}`);
      return null;
    }
    console.log(
      `Optimistic update verified for slot ${updateJSON.attested_header.beacon.slot}`,
    );
    return {
      blockHash: updateJSON.attested_header.execution.block_hash,
      blockNumber: updateJSON.attested_header.execution.block_number,
    };
  }

  protected syncFromGenesis(): Promise<Uint8Array[]> {
    return Promise.resolve([]);
  }

  protected async syncFromLastUpdate(
    startPeriod = this.latestPeriod,
  ): Promise<Uint8Array[]> {
    const currentPeriod = this.getCurrentPeriod();

    let lastCommitteeHash: Uint8Array = getCommitteeHash(this.genesisCommittee);

    for (let period = startPeriod + 1; period <= currentPeriod; period++) {
      try {
        lastCommitteeHash = await this.options.prover.getCommitteeHash(
          period,
          currentPeriod,
          DEFAULT_BATCH_SIZE,
        );
      } catch (e: any) {
        throw new Error(
          `failed to fetch committee hash for prover at period(${period}): ${e.meessage}`,
        );
      }
    }
    return this.getCommittee(currentPeriod, lastCommitteeHash);
  }

  private async getCommittee(
    period: number,
    expectedCommitteeHash: Uint8Array | null,
  ): Promise<Uint8Array[]> {
    if (period === this.genesisPeriod) {
      return this.genesisCommittee;
    }
    if (!expectedCommitteeHash) {
      throw new Error("expectedCommitteeHash required");
    }
    const committee = await this.options.prover.getCommittee(period);
    const committeeHash = getCommitteeHash(committee);
    if (!equalBytes(committeeHash, expectedCommitteeHash as Uint8Array)) {
      throw new Error("prover responded with an incorrect committee");
    }

    return committee;
  }

  public async rpcCall(method: string, params: any) {
    return this.provider?.rpcMethod(method, params);
  }
}
