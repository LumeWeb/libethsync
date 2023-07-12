import BaseClient, { BaseClientOptions } from "#baseClient.js";
import { IProver, IVerifyingProviderConstructor } from "#interfaces.js";
import { IClientVerifyingProvider } from "#client/verifyingProvider.js";

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

  public async rpcCall(method: string, params: any) {
    return this.provider?.rpcMethod(method, params);
  }
}
