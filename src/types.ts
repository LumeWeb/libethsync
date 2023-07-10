import * as capella from "@lodestar/types/capella";
import * as phase0 from "@lodestar/types/phase0";

export type PubKeyString = string;
export type Slot = number;
export type Bytes32 = string;

export type LightClientUpdate = capella.LightClientUpdate;
export type OptimisticUpdate = capella.LightClientOptimisticUpdate;

export type GenesisData = {
  committee: PubKeyString[];
  slot: Slot;
  time: number;
};
export type VerifyWithReason =
  | { correct: true }
  | { correct: false; reason: string };

export { capella, phase0 };
