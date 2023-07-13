import { ConsensusCommitteeUpdateRequest, IProver } from "#interfaces.js";
import { LightClientUpdate } from "#types.js";
import * as capella from "@lodestar/types/capella";
import BaseClient from "#baseClient.js";

export type ProverRequestCallback = (
  args: ConsensusCommitteeUpdateRequest,
) => Promise<any>;

export default class Prover implements IProver {
  constructor(callback: ProverRequestCallback) {
    this._callback = callback;
  }

  private _client?: BaseClient;

  set client(value: BaseClient) {
    this._client = value;
  }

  private _callback: ProverRequestCallback;

  get callback(): ProverRequestCallback {
    return this._callback;
  }

  async getSyncUpdate(
    startPeriod: number,
    count: number,
  ): Promise<LightClientUpdate[]> {
    let end = startPeriod + count;
    let hasStart = this._client?.store.hasUpdate(startPeriod);
    let hasEnd = this._client?.store.hasUpdate(startPeriod + count);

    let trueStart = startPeriod;
    let trueCount = count;

    if (hasStart && !hasEnd) {
      for (let i = startPeriod; i <= end; i++) {
        if (!this.client.store.hasUpdate(i)) {
          trueStart = i;
          trueCount = end - i;
        }
      }
    }

    const existingUpdates: LightClientUpdate[] = [];
    const results: Uint8Array[][] = [];

    let batchedStart = trueStart;
    let batchedCount = trueCount;

    while (true) {
      const res = await this.callback({
        start: batchedStart,
        count: batchedCount,
      });

      if (res.length <= batchedCount) {
        if (res.length > 0) {
          results.push(res);
          batchedStart += res.length;
          batchedCount -= res.length;
        }
      }

      if (batchedCount == 0) {
        break;
      }
    }

    if (trueStart != startPeriod) {
      for (let i = 0; i < trueStart - startPeriod; i++) {
        existingUpdates.push(
          capella.ssz.LightClientUpdate.deserialize(
            this.client.store.getUpdate(startPeriod + i),
          ),
        );
      }
    }

    return existingUpdates.concat(
      results
        .reduce((prev, cur) => {
          return prev.concat(cur);
        }, [])
        .map((u: any) => capella.ssz.LightClientUpdate.fromJson(u)),
    );
  }
}
