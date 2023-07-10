import { BeaconConfig } from "@lodestar/config";
import { GenesisData, LightClientUpdate } from "#types.js";

import Provider from "#client/verifyingProvider.js";

export interface IProver {
  getSyncUpdate(
    period: number,
    currentPeriod: number,
    cacheCount: number,
  ): Promise<LightClientUpdate>;
}

export interface IStore {
  addUpdate(period: number, update: LightClientUpdate): Promise<void>;
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

export interface ConsensusCommitteeHashesRequest {
  start: number;
  count: number;
}

export interface ConsensusCommitteePeriodRequest {
  period: number | "latest";
}

export interface ConsensusBlockRequest {
  block: number;
}
