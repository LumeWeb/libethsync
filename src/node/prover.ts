import { IProver } from "#interfaces.js";
import { LightClientUpdate } from "#types.js";
import { consensusClient } from "#util.js";
import { AxiosInstance } from "axios";
import * as capella from "@lodestar/types/capella";

export default class Prover implements IProver {
  cachedSyncUpdate: Map<number, LightClientUpdate> = new Map();
  private http: AxiosInstance = consensusClient;

  async _getSyncUpdates(
    startPeriod: number,
    maxCount: number,
  ): Promise<LightClientUpdate[]> {
    const res = await this.http(
      `/eth/v1/beacon/light_client/updates?start_period=${startPeriod}&count=${maxCount}`,
    );
    return res.data.map((u: any) =>
      capella.ssz.LightClientUpdate.fromJson(u.data),
    );
  }

  async getSyncUpdate(
    period: number,
    currentPeriod: number,
    cacheCount: number,
  ): Promise<LightClientUpdate> {
    const _cacheCount = Math.min(currentPeriod - period + 1, cacheCount);
    if (!this.cachedSyncUpdate.has(period)) {
      const vals = await this._getSyncUpdates(period, _cacheCount);
      for (let i = 0; i < _cacheCount; i++) {
        this.cachedSyncUpdate.set(period + i, vals[i]);
      }
    }
    return this.cachedSyncUpdate.get(period)!;
  }
}
