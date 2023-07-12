import Client from "./client.js";
import Store from "../store.js";
import Prover from "#prover.js";
import * as capella from "@lodestar/types/capella";
import { consensusClient } from "#util.js";

function createDefaultClient(beaconUrl: string): Client {
  return new Client({
    store: new Store(),
    prover: new Prover(async (args) => {
      const res = await consensusClient.get(
        `/eth/v1/beacon/light_client/updates?start_period=${args.start}&count=${args.count}`,
      );
      return res.data.map((u: any) =>
        capella.ssz.LightClientUpdate.fromJson(u.data),
      );
    }),
    beaconUrl,
  });
}

export { Client, Prover, Store, createDefaultClient };
export * from "#interfaces.js";
export { getConsensusOptimisticUpdate, getCommitteeHash } from "#util.js";
