import Client from "./client.js";
import Store from "../store.js";
import Prover from "#prover.js";
import * as capella from "@lodestar/types/capella";
import { consensusClient, getConsensusOptimisticUpdate } from "#util.js";

function createDefaultClient(beaconUrl: string): Client {
  const options = {
    store: new Store(),
    prover: new Prover(async (args) => {
      return (
        await consensusClient.get(
          `/eth/v1/beacon/light_client/updates?start_period=${args.start}&count=${args.count}`,
        )
      ).data.map((item) => item.data);
    }),
    beaconUrl,
    async optimisticUpdateCallback() {
      const update = await getConsensusOptimisticUpdate();

      return capella.ssz.LightClientOptimisticUpdate.fromJson(update);
    },
    loggerInfo: console.log,
    loggerErr: console.error,
  };

  const client = new Client(options);
  options.prover.client = client;

  return client;
}

export { Client, Prover, Store, createDefaultClient };
export * from "#interfaces.js";
export { getConsensusOptimisticUpdate, getCommitteeHash } from "#util.js";
