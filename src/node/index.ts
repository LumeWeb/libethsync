import Client from "./client.js";
import Prover from "./prover.js";
import Store from "./store.js";

function createDefaultClient(beaconUrl: string): Client {
  return new Client({
    store: new Store(),
    prover: new Prover(),
    beaconUrl,
  });
}

export { Client, Prover, Store, createDefaultClient };
