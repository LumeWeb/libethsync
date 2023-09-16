import { digest } from "@chainsafe/as-sha256";
import { CommitteeSSZ, HashesSSZ } from "#ssz.js";
import { IStore } from "#interfaces.js";
import { concatBytes } from "@noble/hashes/utils";
import { LightClientUpdate } from "#types.js";
import * as capella from "@lodestar/types/capella";
import NodeCache from "node-cache";
import { EventEmitter } from "events";

export interface StoreItem {
  update: Uint8Array;
  nextCommittee: Uint8Array;
  nextCommitteeHash: Uint8Array;
}

export default class Store extends EventEmitter implements IStore {
  private store = new NodeCache({ useClones: false });

  constructor(expire: number = 0) {
    super();
    this.store.options.stdTTL = 0;
  }

  clear(): void {
    this.store.flushAll();
  }

  addUpdate(period: number, update: LightClientUpdate) {
    try {
      const serialized = capella.ssz.LightClientUpdate.serialize(update);
      this.store.set(period, {
        update: serialized,
        nextCommittee: CommitteeSSZ.serialize(update.nextSyncCommittee.pubkeys),
        nextCommitteeHash: digest(
          concatBytes(...update.nextSyncCommittee.pubkeys),
        ),
      });
      this.emit("set", period, serialized);
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
