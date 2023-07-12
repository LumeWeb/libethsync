import { BeaconConfig } from "@lodestar/config";
import { GenesisData, LightClientUpdate } from "#types.js";
import { ProverRequestCallback } from "#client/index.js";
import BaseClient from "#baseClient.js";

export interface IProver {
  get callback(): ProverRequestCallback;
  set client(value: BaseClient);
  getSyncUpdate(
    startPeriod: number,
    period: number,
  ): Promise<LightClientUpdate[]>;
}

export interface IStore {
  addUpdate(period: number, update: LightClientUpdate): void;
  getUpdate(period: number): Uint8Array;
  hasUpdate(period: number): boolean;
}

export interface IVerifyingProvider {
  update(blockNumber: number, blockHash: string): void;
}

export type IVerifyingProviderConstructor<
  U extends IVerifyingProvider = IVerifyingProvider,
> = new (requestHandler: Function, blockNumber: number, blockHash: string) => U;

export interface ClientConfig {
  genesis: GenesisData;
  chainConfig: BeaconConfig;
  // treeDegree in case of Superlight and batchSize in case of Light and Optimistic
  n?: number;
}

export interface ExecutionInfo {
  blockHash: string;
  blockNumber: number;
}

export interface ConsensusCommitteeUpdateRequest {
  start: number;
  count: number;
}
