import { digest } from "@chainsafe/as-sha256";
import { CommitteeSSZ, HashesSSZ } from "#ssz.js";
import { IStore } from "#interfaces.js";
import { concatBytes } from "@noble/hashes/utils";
import { LightClientUpdate } from "#types.js";
import * as capella from "@lodestar/types/capella";
import NodeCache from "node-cache";

export interface StoreItem {
  update: Uint8Array;
  nextCommittee: Uint8Array;
  nextCommitteeHash: Uint8Array;
}

export default class Store implements IStore {
  private store = new NodeCache();

  constructor(expire: number = 0) {
    this.store.options.stdTTL = 0;
  }

  addUpdate(period: number, update: LightClientUpdate) {
    try {
      this.store.set(period, {
        update: capella.ssz.LightClientUpdate.serialize(update),
        nextCommittee: CommitteeSSZ.serialize(update.nextSyncCommittee.pubkeys),
        nextCommitteeHash: digest(
          concatBytes(...update.nextSyncCommittee.pubkeys),
        ),
      });
    } catch (e) {
      console.log(e);
    }
  }

  getUpdate(period: number): Uint8Array {
    if (this.store.has(period)) {
      return this.store.get<StoreItem>(period)?.update as Uint8Array;
    }
    throw new Error(`update unavailable for period ${period}`);
  }
  hasUpdate(period: number): boolean {
    return this.store.has(period);
  }
}
