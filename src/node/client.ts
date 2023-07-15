import BaseClient, { BaseClientOptions } from "#baseClient.js";
import { IStore } from "#interfaces.js";
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { consensusClient } from "#util.js";

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

    if (!this.booted) {
      this.subscribe();

      this.booted = true;
    }
  }
}
