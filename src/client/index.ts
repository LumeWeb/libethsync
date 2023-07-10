import Client from "./client.js";
import Prover, { IClientProver, ProverRequestCallback } from "./prover.js";
import VerifyingProvider from "./verifyingProvider.js";

function createDefaultClient(
  beaconUrl: string,
  proverHandler: ProverRequestCallback,
  rpcHandler: Function,
): Client {
  return new Client({
    prover: new Prover(proverHandler),
    beaconUrl,
    provider: VerifyingProvider,
    rpcHandler,
  });
}

export { Client, Prover, VerifyingProvider, createDefaultClient };
export { IClientProver, ProverRequestCallback };
