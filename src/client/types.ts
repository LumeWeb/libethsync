import { Bytes32 } from "#types.js";

export type AddressHex = string;
export type HexString = string;
export type Bytes = string;
export type AccountResponse = GetProof;
export type CodeResponse = string;
export type AccessList = { address: AddressHex; storageKeys: Bytes32[] }[];

export interface RPCTx {
  from?: string;
  to?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  accessList?: AccessList;
  value?: string;
  data?: string;
}

export type JSONRPCReceipt = {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  gasUsed: string;
  contractAddress: string | null;
  logs: JSONRPCLog[];
  logsBloom: string;

  root?: string;
  status?: string;
};

export type JSONRPCLog = {
  removed: boolean;
  logIndex: string | null;
  transactionIndex: string | null;
  transactionHash: string | null;
  blockHash: string | null;
  blockNumber: string | null;
  address: string;
  data: string;
  topics: string[];
};
export interface GetProof {
  address: string;
  balance: string;
  codeHash: string;
  nonce: string;
  storageHash: string;
  accountProof: string[];
  storageProof: StorageProof[];
}

export interface StorageProof {
  key: string;
  value: string;
  proof: string[];
}
