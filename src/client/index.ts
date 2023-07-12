import Client from "./client.js";
import Prover, { ProverRequestCallback } from "../prover.js";
import VerifyingProvider from "./verifyingProvider.js";
import Store from "#store.js";

function createDefaultClient(
  proverHandler: ProverRequestCallback,
  rpcHandler: Function,
): Client {
  return new Client({
    prover: new Prover(proverHandler),
    store: new Store(60 * 60),
    provider: VerifyingProvider,
    rpcHandler,
  });
}

export { RPCRequest, RPCRequestRaw, RPCResponse } from "./rpc.js";
export { Client, Prover, VerifyingProvider, createDefaultClient };
export { ProverRequestCallback };
export * from "#interfaces.js";
