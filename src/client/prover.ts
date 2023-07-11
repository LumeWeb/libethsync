import {
  ConsensusCommitteeHashesRequest,
  ConsensusCommitteePeriodRequest,
  IProver,
} from "#interfaces.js";
import { CommitteeSSZ, HashesSSZ } from "#ssz.js";
import { LightClientUpdate } from "#types.js";
import * as capella from "@lodestar/types/capella";

export type ProverRequestCallback = (
  action: string,
  args?: ConsensusCommitteeHashesRequest | ConsensusCommitteePeriodRequest,
) => Promise<any>;

export interface IClientProver extends IProver {
  get callback(): ProverRequestCallback;
  getCommittee(period: number | "latest"): Promise<Uint8Array[]>;
  getSyncUpdate(period: number): Promise<LightClientUpdate>;
  getCommitteeHash(
    period: number,
    currentPeriod: number,
    cacheCount: number,
  ): Promise<Uint8Array>;
}

export default class Prover implements IClientProver {
  cachedHashes: Map<number, Uint8Array> = new Map();

  constructor(callback: ProverRequestCallback) {
    this._callback = callback;
  }

  private _callback: ProverRequestCallback;

  get callback(): ProverRequestCallback {
    return this._callback;
  }

  async getCommittee(period: number | "latest"): Promise<Uint8Array[]> {
    const res = await this.callback("consensus_committee_period", { period });
    return CommitteeSSZ.deserialize(Uint8Array.from(Object.values(res)));
  }

  async getSyncUpdate(period: number): Promise<LightClientUpdate> {
    const res = await this.callback("consensus_committee_period", { period });
    return capella.ssz.LightClientUpdate.deserialize(
      Uint8Array.from(Object.values(res)),
    );
  }

  async _getHashes(startPeriod: number, count: number): Promise<Uint8Array[]> {
    const res = await this.callback("consensus_committee_hashes", {
      start: startPeriod,
      count,
    });
    return HashesSSZ.deserialize(Uint8Array.from(Object.values(res)));
  }

  async getCommitteeHash(
    period: number,
    currentPeriod: number,
    cacheCount: number,
  ): Promise<Uint8Array> {
    const _count = Math.min(currentPeriod - period + 1, cacheCount);
    if (!this.cachedHashes.has(period)) {
      const vals = await this._getHashes(period, _count);
      for (let i = 0; i < _count; i++) {
        this.cachedHashes.set(period + i, vals[i]);
      }
    }
    return this.cachedHashes.get(period)!;
  }
}
