import {
  createBeaconConfig,
  BeaconConfig,
  ChainForkConfig,
} from "@lodestar/config";
import { allForks } from "@lodestar/types";
import { BEACON_SYNC_SUPER_MAJORITY, mainnetConfig } from "./constants.js";
import { networksChainConfig } from "@lodestar/config/networks";
import { fromHexString } from "@chainsafe/ssz";
import { capella, OptimisticUpdate, phase0, VerifyWithReason } from "#types.js";
import { assertValidSignedHeader } from "@lodestar/light-client/validation";
import bls from "@chainsafe/bls/switchable";
import axiosRetry from "axios-retry";
import axios from "axios";
import { digest } from "@chainsafe/as-sha256";
import { concatBytes } from "@noble/hashes/utils";
import {
  deserializeSyncCommittee,
  isValidMerkleBranch,
} from "@lodestar/light-client/utils";
import {
  BLOCK_BODY_EXECUTION_PAYLOAD_DEPTH as EXECUTION_PAYLOAD_DEPTH,
  BLOCK_BODY_EXECUTION_PAYLOAD_INDEX as EXECUTION_PAYLOAD_INDEX,
} from "@lodestar/params";

export function getDefaultClientConfig() {
  const chainConfig = createBeaconConfig(
    networksChainConfig.mainnet,
    fromHexString(mainnetConfig.genesis_validator_root),
  );
  return {
    genesis: {
      committee: mainnetConfig.committee_pk,
      slot: parseInt(mainnetConfig.slot),
      time: parseInt(mainnetConfig.genesis_time),
    },
    chainConfig,
    n: 1,
  };
}

export function optimisticUpdateFromJSON(update: any): OptimisticUpdate {
  return capella.ssz.LightClientOptimisticUpdate.fromJson(update);
}

export async function optimisticUpdateVerify(
  committee: Uint8Array[],
  update: OptimisticUpdate,
): Promise<VerifyWithReason> {
  try {
    const { attestedHeader: header, syncAggregate } = update;
    const headerBlockRoot = phase0.ssz.BeaconBlockHeader.hashTreeRoot(
      header.beacon,
    );

    const chainConfig = getDefaultClientConfig().chainConfig;

    const committeeFast = deserializeSyncCommittee({
      pubkeys: committee,
      aggregatePubkey: bls.PublicKey.aggregate(
        deserializePubkeys(committee),
      ).toBytes(),
    });

    try {
      assertValidSignedHeader(
        chainConfig,
        committeeFast,
        syncAggregate,
        headerBlockRoot,
        header.beacon.slot,
      );
    } catch (e) {
      return { correct: false, reason: "invalid signatures" };
    }

    const participation =
      syncAggregate.syncCommitteeBits.getTrueBitIndexes().length;
    if (participation < BEACON_SYNC_SUPER_MAJORITY) {
      return { correct: false, reason: "insufficient signatures" };
    }

    if (!this.isValidLightClientHeader(chainConfig, header)) {
      return { correct: false, reason: "invalid header" };
    }

    return { correct: true };
  } catch (e) {
    console.error(e);
    return { correct: false, reason: (e as Error).message };
  }
}

export function deserializePubkeys(pubkeys) {
  return pubkeys.map((pk) => bls.PublicKey.fromBytes(pk));
}

export function getCommitteeHash(committee: Uint8Array[]): Uint8Array {
  return digest(concatBytes(...committee));
}

export const consensusClient = axios.create();
axiosRetry(consensusClient, { retries: 3 });

export async function getConsensusOptimisticUpdate() {
  const resp = await consensusClient.get(
    `/eth/v1/beacon/light_client/optimistic_update`,
  );

  const update = resp.data;

  if (!update) {
    throw Error(`fetching optimistic update failed`);
  }

  return update.data;
}
function isValidLightClientHeader(
  config: ChainForkConfig,
  header: allForks.LightClientHeader,
): boolean {
  return isValidMerkleBranch(
    config
      .getExecutionForkTypes(header.beacon.slot)
      .ExecutionPayloadHeader.hashTreeRoot(
        (header as capella.LightClientHeader).execution,
      ),
    (header as capella.LightClientHeader).executionBranch,
    EXECUTION_PAYLOAD_DEPTH,
    EXECUTION_PAYLOAD_INDEX,
    header.beacon.bodyRoot,
  );
}
