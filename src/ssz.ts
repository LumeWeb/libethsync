import {
  ByteVectorType,
  ListCompositeType,
  VectorCompositeType,
} from "@chainsafe/ssz";
import * as capella from "@lodestar/types/capella";
import { BEACON_SYNC_COMMITTEE_SIZE } from "./constants.js";

const MAX_BATCHSIZE = 10000;

//@ts-ignore
export const LightClientUpdatesSSZ = new ListCompositeType(
  capella.ssz.LightClientUpdate as any,
  MAX_BATCHSIZE,
);

export const CommitteeSSZ = new VectorCompositeType(
  new ByteVectorType(48),
  BEACON_SYNC_COMMITTEE_SIZE,
);

const HashSSZ = new ByteVectorType(32);
export const HashesSSZ = new ListCompositeType(HashSSZ, MAX_BATCHSIZE);
