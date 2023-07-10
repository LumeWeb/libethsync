import BaseClient, { BaseClientOptions } from "#baseClient.js";
import { ExecutionInfo, IStore } from "#interfaces.js";
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { Bytes32, capella, LightClientUpdate } from "#types.js";
import {
  consensusClient,
  deserializePubkeys,
  optimisticUpdateFromJSON,
  optimisticUpdateVerify,
} from "#util.js";
import { toHexString } from "@chainsafe/ssz";
import NodeCache from "node-cache";
import { DEFAULT_BATCH_SIZE } from "#constants.js";
import {
  computeSyncPeriodAtSlot,
  deserializeSyncCommittee,
} from "@lodestar/light-client/utils";
import { assertValidLightClientUpdate } from "@lodestar/light-client/validation";
import bls from "@chainsafe/bls/switchable";

axiosRetry(axios, { retries: 3 });

interface Config extends BaseClientOptions {
  store: IStore;
  beaconUrl: string;
}

export default class Client extends BaseClient {
  private beaconUrl: string;
  private blockCache = new NodeCache({ stdTTL: 60 * 60 * 12 });
  private blockHashCache = new NodeCache({ stdTTL: 60 * 60 * 12 });

  constructor(config: Config) {
    super(config);

    if (!config.beaconUrl) {
      throw new Error("beaconUrl required");
    }

    this.beaconUrl = config.beaconUrl;
    this.http.defaults.baseURL = this.beaconUrl;
  }

  private http: AxiosInstance = consensusClient;

  async syncProver(
    startPeriod: number,
    currentPeriod: number,
    startCommittee: Uint8Array[],
  ): Promise<{ syncCommittee: Uint8Array[]; period: number }> {
    for (let period = startPeriod; period < currentPeriod; period += 1) {
      try {
        const update = await this.options.prover.getSyncUpdate(
          period,
          currentPeriod,
          DEFAULT_BATCH_SIZE,
        );
        const validOrCommittee = await this.syncUpdateVerifyGetCommittee(
          startCommittee,
          period,
          update,
        );

        if (!(validOrCommittee as boolean)) {
          console.log(`Found invalid update at period(${period})`);
          return {
            syncCommittee: startCommittee,
            period,
          };
        }

        await this.options.store?.addUpdate(period, update);
        startCommittee = validOrCommittee as Uint8Array[];
      } catch (e) {
        console.error(`failed to fetch sync update for period(${period})`);
        return {
          syncCommittee: startCommittee,
          period,
        };
      }
    }
    return {
      syncCommittee: startCommittee,
      period: currentPeriod,
    };
  }

  protected async getLatestExecution(): Promise<ExecutionInfo | null> {
    const resp = await axios.get(
      `/eth/v1/beacon/light_client/optimistic_update`,
    );

    const updateJSON = resp.data;

    if (!updateJSON) {
      throw Error(`fetching optimistic update failed`);
    }
    const update = optimisticUpdateFromJSON(updateJSON.data);
    const verify = await optimisticUpdateVerify(
      this.latestCommittee as Uint8Array[],
      update,
    );

    if (!verify.correct) {
      // @ts-ignore
      console.error(`Invalid Optimistic Update: ${verify?.reason}`);
      return null;
    }
    return this.getExecutionFromBlockRoot(
      updateJSON.data.attested_header.beacon.slot,
      updateJSON.data.attested_header.beacon.body_root,
    );
  }

  protected async syncFromGenesis(): Promise<Uint8Array[]> {
    return this.syncFromLastUpdate(this.genesisPeriod);
  }

  protected async syncFromLastUpdate(
    startPeriod = this.latestPeriod,
  ): Promise<Uint8Array[]> {
    const currentPeriod = this.getCurrentPeriod();
    let startCommittee = this.genesisCommittee;
    console.debug(
      `Sync started from period(${startPeriod}) to period(${currentPeriod})`,
    );

    const { syncCommittee, period } = await this.syncProver(
      startPeriod,
      currentPeriod,
      startCommittee,
    );
    if (period === currentPeriod) {
      console.debug(
        `Sync completed from period(${startPeriod}) to period(${currentPeriod})`,
      );

      return syncCommittee;
    }

    throw new Error("no honest prover found");
  }

  protected async syncUpdateVerifyGetCommittee(
    prevCommittee: Uint8Array[],
    period: number,
    update: LightClientUpdate,
  ): Promise<false | Uint8Array[]> {
    const updatePeriod = computeSyncPeriodAtSlot(
      update.attestedHeader.beacon.slot,
    );
    if (period !== updatePeriod) {
      console.error(
        `Expected update with period ${period}, but received ${updatePeriod}`,
      );
      return false;
    }

    const prevCommitteeFast = deserializeSyncCommittee({
      pubkeys: prevCommittee,
      aggregatePubkey: bls.PublicKey.aggregate(
        deserializePubkeys(prevCommittee),
      ).toBytes(),
    });

    try {
      // check if the update has valid signatures
      await assertValidLightClientUpdate(
        this.config.chainConfig,
        prevCommitteeFast,
        update,
      );
      return update.nextSyncCommittee.pubkeys;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  private async getExecutionFromBlockRoot(
    slot: bigint,
    expectedBlockRoot: Bytes32,
  ): Promise<ExecutionInfo> {
    const res = await axios.get(`/eth/v2/beacon/blocks/${slot}`);

    if (!res.data) {
      throw Error(`fetching block failed`);
    }

    const block = capella.ssz.BeaconBlock.fromJson(res.data.message);
    const blockRoot = toHexString(
      capella.ssz.BeaconBlockBody.hashTreeRoot(block.body),
    );
    if (blockRoot !== expectedBlockRoot) {
      throw Error(
        `block provided by the beacon chain api doesn't match the expected block root`,
      );
    }

    this.blockCache.set<any>(Number(slot), block);
    this.blockHashCache.set<Bytes32>(Number(slot), expectedBlockRoot);

    return {
      blockHash: toHexString(block.body.executionPayload.blockHash),
      blockNumber: block.body.executionPayload.blockNumber,
    };
  }
}
