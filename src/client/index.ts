import Client from "./client.js";
import Prover, { ProverRequestCallback } from "../prover.js";
import VerifyingProvider from "./verifyingProvider.js";
import Store from "#store.js";
import { BaseClientOptions } from "#baseClient.js";
import { OptimisticUpdateCallback } from "#types.js";

function createDefaultClient(
  proverHandler: ProverRequestCallback,
  rpcHandler: Function,
  optimisticUpdateHandler: OptimisticUpdateCallback,
): Client {
  return new Client({
    prover: new Prover(proverHandler),
    store: new Store(60 * 60),
    provider: VerifyingProvider,
    rpcHandler,
    optimisticUpdateCallback: optimisticUpdateHandler,
  });
}

export { RPCRequest, RPCRequestRaw, RPCResponse } from "./rpc.js";
export { Client, Prover, VerifyingProvider, createDefaultClient };
export { ProverRequestCallback };
export * from "#interfaces.js";
