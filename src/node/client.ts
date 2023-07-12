import BaseClient, { BaseClientOptions } from "#baseClient.js";
import { ExecutionInfo, IStore } from "#interfaces.js";
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { Bytes32, capella, LightClientUpdate } from "#types.js";
import {
  consensusClient,
  deserializePubkeys,
  getConsensusOptimisticUpdate,
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
  private http: AxiosInstance = consensusClient;

  constructor(config: Config) {
    super(config);

    if (!config.beaconUrl) {
      throw new Error("beaconUrl required");
    }

    this.beaconUrl = config.beaconUrl;
    this.http.defaults.baseURL = this.beaconUrl;
  }

  async sync(): Promise<void> {
    await super.sync();

    this.subscribe();
  }
}
