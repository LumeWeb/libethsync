import Client from "./client.js";
import Prover, { IClientProver, ProverRequestCallback } from "./prover.js";
import VerifyingProvider from "./verifyingProvider.js";

function createDefaultClient(
  proverHandler: ProverRequestCallback,
  rpcHandler: Function,
): Client {
  return new Client({
    prover: new Prover(proverHandler),
    provider: VerifyingProvider,
    rpcHandler,
  });
}

export { RPCRequest, RPCRequestRaw, RPCResponse } from "./rpc.js";
export { Client, Prover, VerifyingProvider, createDefaultClient };
export { IClientProver, ProverRequestCallback };
export * from "#interfaces.js";
