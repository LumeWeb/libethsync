import { digest } from "@chainsafe/as-sha256";
import { CommitteeSSZ, HashesSSZ } from "#ssz.js";
import { IStore } from "#interfaces.js";
import { concatBytes } from "@noble/hashes/utils";
import { LightClientUpdate } from "#types.js";
import * as capella from "@lodestar/types/capella";

export default class Store implements IStore {
  store: {
    [period: number]: {
      update: Uint8Array;
      nextCommittee: Uint8Array;
      nextCommitteeHash: Uint8Array;
    };
  } = {};

  async addUpdate(period: number, update: LightClientUpdate) {
    try {
      this.store[period] = {
        update: capella.ssz.LightClientUpdate.serialize(update),
        nextCommittee: CommitteeSSZ.serialize(update.nextSyncCommittee.pubkeys),
        nextCommitteeHash: digest(
          concatBytes(...update.nextSyncCommittee.pubkeys),
        ),
      };
    } catch (e) {
      console.log(e);
    }
  }

  getUpdate(period: number): Uint8Array {
    if (period in this.store) return this.store[period].update;
    throw new Error(`update unavailable for period ${period}`);
  }

  getCommittee(period: number): Uint8Array {
    if (period < 1)
      throw new Error("committee not unavailable for period less than 1");
    const predPeriod = period - 1;
    if (predPeriod in this.store) return this.store[predPeriod].nextCommittee;
    throw new Error(`committee unavailable for period ${predPeriod}`);
  }

  getCommitteeHashes(period: number, count: number): Uint8Array {
    if (period < 1)
      throw new Error("committee not unavailable for period less than 1");
    const predPeriod = period - 1;

    const hashes = new Array(count).fill(0).map((_, i) => {
      const p = predPeriod + i;
      if (p in this.store) return this.store[p].nextCommitteeHash;
      throw new Error(`committee unavailable for period ${p}`);
    });

    return HashesSSZ.serialize(hashes);
  }
}
