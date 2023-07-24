import { IVerifyingProvider } from "#interfaces.js";

import _ from "lodash";
import { Trie } from "@ethereumjs/trie";
import rlp from "rlp";
import { Common, Chain, Hardfork } from "@ethereumjs/common";
import {
  Account,
  Address,
  bufferToHex,
  KECCAK256_NULL_S,
  setLengthLeft,
  toBuffer,
  toType,
  TypeOutput,
} from "@ethereumjs/util";
import { VM } from "@ethereumjs/vm";
import { Blockchain } from "@ethereumjs/blockchain";
import { TransactionFactory } from "@ethereumjs/tx";
import { Block, BlockHeader } from "@ethereumjs/block";

import { Bytes32 } from "#types.js";
import type { BlockNumberOrTag } from "web3-types";
import {
  DEFAULT_BLOCK_PARAMETER,
  MAX_BLOCK_FUTURE,
  MAX_BLOCK_HISTORY,
  ZERO_ADDR,
} from "#constants.js";
import {
  bigIntToHex,
  blockDataFromWeb3Response,
  emptyAccountSerialize,
  headerDataFromWeb3Response,
} from "./utils.js";
import {
  AccessList,
  AccountResponse,
  AddressHex,
  Bytes,
  CodeResponse,
  GetProof,
  HexString,
  JSONRPCReceipt,
  RPCTx,
} from "./types.js";
import { keccak256 } from "ethereum-cryptography/keccak";
import { byteArrayEquals, fromHexString } from "@chainsafe/ssz";
import { RPC } from "#client/rpc.js";

export interface IClientVerifyingProvider extends IVerifyingProvider {
  rpcMethod(method: string, params: any);
}

export default class VerifyingProvider implements IClientVerifyingProvider {
  common: Common;
  vm: VM | null = null;
  private blockHashes: { [blockNumberHex: string]: Bytes32 } = {};
  private blockPromises: {
    [blockNumberHex: string]: { promise: Promise<void>; resolve: () => void };
  } = {};
  private blockHeaders: { [blockHash: string]: BlockHeader } = {};
  private latestBlockNumber: number;
  private _methods: Map<string, Function> = new Map<string, Function>(
    Object.entries({
      eth_getBalance: this.getBalance,
      eth_blockNumber: this.blockNumber,
      eth_chainId: this.chainId,
      eth_getCode: this.getCode,
      eth_getTransactionCount: this.getTransactionCount,
      eth_call: this.call,
      eth_estimateGas: this.estimateGas,
      eth_sendRawTransaction: this.sendRawTransaction,
      eth_getTransactionReceipt: this.getTransactionReceipt,
    }),
  );
  private rpc: RPC;

  constructor(
    rpcHandler: Function,
    blockNumber: number,
    blockHash: Bytes32,
    chain: bigint | Chain = Chain.Mainnet,
  ) {
    this.common = new Common({
      chain,
      hardfork: chain === Chain.Mainnet ? Hardfork.Shanghai : undefined,
    });
    const _blockNumber = BigInt(blockNumber);
    this.latestBlockNumber = blockNumber;
    this.blockHashes[bigIntToHex(_blockNumber)] = blockHash;
    this.rpc = new RPC(rpcHandler);
  }

  update(blockNumber: number, blockHash: Bytes32) {
    const blockNumberHex = bigIntToHex(BigInt(blockNumber));
    if (
      blockNumberHex in this.blockHashes &&
      this.blockHashes[blockNumberHex] !== blockHash
    ) {
      console.log(
        "Overriding an existing verified blockhash. Possibly the chain had a reorg",
      );
    }
    const latestBlockNumber = this.latestBlockNumber;
    this.latestBlockNumber = blockNumber;
    this.blockHashes[blockNumberHex] = blockHash;
    if (blockNumber > latestBlockNumber) {
      for (
        let b = BigInt(latestBlockNumber) + BigInt(1);
        b <= blockNumber;
        b++
      ) {
        const bHex = bigIntToHex(b);
        if (bHex in this.blockPromises) {
          this.blockPromises[bHex].resolve();
        }
      }
    }
  }

  public async rpcMethod(method: string, params: any) {
    if (this._methods.has(method)) {
      return this._methods.get(method)?.bind(this)(...params);
    }

    throw new Error("method not found");
  }

  private async getBalance(
    addressHex: AddressHex,
    blockOpt: BlockNumberOrTag = DEFAULT_BLOCK_PARAMETER,
  ) {
    const header = await this.getBlockHeader(blockOpt);
    const address = Address.fromString(addressHex);
    const { result: proof, success } = await this.rpc.request({
      method: "eth_getProof",
      params: [addressHex, [], bigIntToHex(header.number)],
    });
    if (!success) {
      throw new Error(`RPC request failed`);
    }
    const isAccountCorrect = await this.verifyProof(
      address,
      [],
      header.stateRoot,
      proof,
    );
    if (!isAccountCorrect) {
      throw new Error("Invalid account proof provided by the RPC");
    }

    return bigIntToHex(proof.balance);
  }

  private async blockNumber(): Promise<HexString> {
    return bigIntToHex(BigInt(this.latestBlockNumber));
  }

  private async chainId(): Promise<HexString> {
    return bigIntToHex(this.common.chainId());
  }

  private async getCode(
    addressHex: AddressHex,
    blockOpt: BlockNumberOrTag = DEFAULT_BLOCK_PARAMETER,
  ): Promise<HexString> {
    const header = await this.getBlockHeader(blockOpt);
    const res = await this.rpc.requestBatch([
      {
        method: "eth_getProof",
        params: [addressHex, [], bigIntToHex(header.number)],
      },
      {
        method: "eth_getCode",
        params: [addressHex, bigIntToHex(header.number)],
      },
    ]);

    if (res.some((r) => !r.success)) {
      throw new Error(`RPC request failed`);
    }
    const [accountProof, code] = [res[0].result, res[1].result];

    const address = Address.fromString(addressHex);
    const isAccountCorrect = await this.verifyProof(
      address,
      [],
      header.stateRoot,
      accountProof,
    );
    if (!isAccountCorrect) {
      throw new Error(`invalid account proof provided by the RPC`);
    }

    const isCodeCorrect = await this.verifyCodeHash(
      code,
      accountProof.codeHash,
    );
    if (!isCodeCorrect) {
      throw new Error(
        `code provided by the RPC doesn't match the account's codeHash`,
      );
    }

    return code;
  }

  private async getTransactionCount(
    addressHex: AddressHex,
    blockOpt: BlockNumberOrTag = DEFAULT_BLOCK_PARAMETER,
  ): Promise<HexString> {
    const header = await this.getBlockHeader(blockOpt);
    const address = Address.fromString(addressHex);
    const { result: proof, success } = await this.rpc.request({
      method: "eth_getProof",
      params: [addressHex, [], bigIntToHex(header.number)],
    });
    if (!success) {
      throw new Error(`RPC request failed`);
    }

    const isAccountCorrect = await this.verifyProof(
      address,
      [],
      header.stateRoot,
      proof,
    );
    if (!isAccountCorrect) {
      throw new Error(`invalid account proof provided by the RPC`);
    }

    return bigIntToHex(proof.nonce.toString());
  }

  private async call(
    transaction: RPCTx,
    blockOpt: BlockNumberOrTag = DEFAULT_BLOCK_PARAMETER,
  ) {
    try {
      this.validateTx(transaction);
    } catch (e: any) {
      throw new Error((e as Error).message);
    }

    const header = await this.getBlockHeader(blockOpt);
    const vm = await this.getVM(transaction, header);
    const {
      from,
      to,
      gas: gasLimit,
      gasPrice,
      maxPriorityFeePerGas,
      value,
      data,
    } = transaction;

    try {
      const runCallOpts = {
        caller: from ? Address.fromString(from) : undefined,
        to: to ? Address.fromString(to) : undefined,
        gasLimit: toType(gasLimit, TypeOutput.BigInt),
        gasPrice: toType(gasPrice || maxPriorityFeePerGas, TypeOutput.BigInt),
        value: toType(value, TypeOutput.BigInt),
        data: data ? toBuffer(data) : undefined,
        block: { header },
      };
      const { execResult } = await vm.evm.runCall(runCallOpts);

      return bufferToHex(execResult.returnValue);
    } catch (error: any) {
      throw new Error(error.message.toString());
    }
  }

  private async estimateGas(
    transaction: RPCTx,
    blockOpt: BlockNumberOrTag = DEFAULT_BLOCK_PARAMETER,
  ) {
    try {
      this.validateTx(transaction);
    } catch (e) {
      throw new Error((e as Error).message);
    }
    const header = await this.getBlockHeader(blockOpt);

    if (transaction.gas == undefined) {
      // If no gas limit is specified use the last block gas limit as an upper bound.
      transaction.gas = bigIntToHex(header.gasLimit);
    }

    const txType = BigInt(
      transaction.maxFeePerGas || transaction.maxPriorityFeePerGas
        ? 2
        : transaction.accessList
        ? 1
        : 0,
    );
    if (txType == BigInt(2)) {
      transaction.maxFeePerGas =
        transaction.maxFeePerGas || bigIntToHex(header.baseFeePerGas!);
    } else {
      if (
        transaction.gasPrice == undefined ||
        BigInt(transaction.gasPrice) === BigInt(0)
      ) {
        transaction.gasPrice = bigIntToHex(header.baseFeePerGas!);
      }
    }

    const txData = {
      ...transaction,
      type: bigIntToHex(txType),
      gasLimit: transaction.gas,
    };
    const tx = TransactionFactory.fromTxData(txData, {
      common: this.common,
      freeze: false,
    });

    const vm = await this.getVM(transaction, header);

    // set from address
    const from = transaction.from
      ? Address.fromString(transaction.from)
      : Address.zero();
    tx.getSenderAddress = () => {
      return from;
    };

    try {
      const { totalGasSpent } = await vm.runTx({
        tx,
        skipNonce: true,
        skipBalance: true,
        skipBlockGasLimitValidation: true,
        block: { header } as any,
      });
      return bigIntToHex(totalGasSpent);
    } catch (error: any) {
      throw new Error(error.message.toString());
    }
  }

  private async sendRawTransaction(signedTx: string): Promise<string> {
    // TODO: brodcast tx directly to the mem pool?
    const { success } = await this.rpc.request({
      method: "eth_sendRawTransaction",
      params: [signedTx],
    });

    if (!success) {
      throw new Error(`RPC request failed`);
    }

    const tx = TransactionFactory.fromSerializedData(toBuffer(signedTx), {
      common: this.common,
    });
    return bufferToHex(tx.hash());
  }

  private async getTransactionReceipt(
    txHash: Bytes32,
  ): Promise<JSONRPCReceipt | null> {
    const { result: receipt, success } = await this.rpc.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    });
    if (!(success && receipt)) {
      return null;
    }
    const header = await this.getBlockHeader(receipt.blockNumber);
    const block = await this.getBlock(header);
    const index = block.transactions.findIndex(
      (tx) => bufferToHex(tx.hash()) === txHash.toLowerCase(),
    );
    if (index === -1) {
      throw new Error("the recipt provided by the RPC is invalid");
    }
    const tx = block.transactions[index];

    return {
      transactionHash: txHash,
      transactionIndex: bigIntToHex(BigInt(index)),
      blockHash: bufferToHex(block.hash()),
      blockNumber: bigIntToHex(block.header.number),
      from: tx.getSenderAddress().toString(),
      to: tx.to?.toString() ?? null,
      cumulativeGasUsed: "0x0",
      effectiveGasPrice: "0x0",
      gasUsed: "0x0",
      contractAddress: null,
      logs: [],
      logsBloom: "0x0",
      status: BigInt(receipt.status) ? "0x1" : "0x0", // unverified!!
    };
  }

  private async getVMCopy(): Promise<VM> {
    if (this.vm === null) {
      const blockchain = await Blockchain.create({ common: this.common });
      // path the blockchain to return the correct blockhash
      (blockchain as any).getBlock = async (blockId: number) => {
        const _hash = toBuffer(await this.getBlockHash(BigInt(blockId)));
        return {
          hash: () => _hash,
        };
      };
      this.vm = await VM.create({ common: this.common, blockchain });
    }
    return await this.vm!.copy();
  }

  private async getVM(tx: RPCTx, header: BlockHeader): Promise<VM> {
    // forcefully set gasPrice to 0 to avoid not enough balance error
    const _tx = {
      to: tx.to,
      from: tx.from ? tx.from : ZERO_ADDR,
      data: tx.data,
      value: tx.value,
      gasPrice: "0x0",
      gas: tx.gas ? tx.gas : bigIntToHex(header.gasLimit!),
    };
    const { result, success } = await this.rpc.request({
      method: "eth_createAccessList",
      params: [_tx, bigIntToHex(header.number)],
    });

    if (!success) {
      throw new Error(`RPC request failed`);
    }

    const accessList = result.accessList as AccessList;
    accessList.push({ address: _tx.from, storageKeys: [] });
    if (_tx.to && !accessList.some((a) => a.address.toLowerCase() === _tx.to)) {
      accessList.push({ address: _tx.to, storageKeys: [] });
    }

    const vm = await this.getVMCopy();
    await vm.stateManager.checkpoint();

    const requests = accessList
      .map((access) => {
        return [
          {
            method: "eth_getProof",
            params: [
              access.address,
              access.storageKeys,
              bigIntToHex(header.number),
            ],
          },
          {
            method: "eth_getCode",
            params: [access.address, bigIntToHex(header.number)],
          },
        ];
      })
      .flat();
    const rawResponse = await this.rpc.requestBatch(requests);
    if (rawResponse.some((r: any) => !r.success)) {
      throw new Error(`RPC request failed`);
    }
    const responses = rawResponse
      .map((r: any) => r.result)
      .reduce(
        (acc, curr, idx, arr) =>
          idx % 2 === 0 ? acc.concat([[curr, arr[idx + 1]]]) : acc,
        [],
      ) as [AccountResponse, CodeResponse][];

    for (let i = 0; i < accessList.length; i++) {
      const { address: addressHex, storageKeys } = accessList[i];
      const [accountProof, code] = responses[i];
      const {
        nonce,
        balance,
        codeHash,
        storageProof: storageAccesses,
      } = accountProof;
      const address = Address.fromString(addressHex);

      const isAccountCorrect = await this.verifyProof(
        address,
        storageKeys,
        header.stateRoot,
        accountProof,
      );
      if (!isAccountCorrect) {
        throw new Error(`invalid account proof provided by the RPC`);
      }

      const isCodeCorrect = await this.verifyCodeHash(code, codeHash);
      if (!isCodeCorrect) {
        throw new Error(
          `code provided by the RPC doesn't match the account's codeHash`,
        );
      }

      const account = Account.fromAccountData({
        nonce: BigInt(nonce),
        balance: BigInt(balance),
        codeHash,
      });

      await vm.stateManager.putAccount(address, account);

      for (let storageAccess of storageAccesses) {
        await vm.stateManager.putContractStorage(
          address,
          setLengthLeft(toBuffer(storageAccess.key), 32),
          setLengthLeft(toBuffer(storageAccess.value), 32),
        );
      }

      if (code !== "0x")
        await vm.stateManager.putContractCode(address, toBuffer(code));
    }
    await vm.stateManager.commit();
    return vm;
  }
  private async getBlockHeader(
    blockOpt: BlockNumberOrTag,
  ): Promise<BlockHeader> {
    const blockNumber = this.getBlockNumberByBlockNumberOrTag(blockOpt);
    await this.waitForBlockNumber(blockNumber);
    const blockHash = await this.getBlockHash(blockNumber);
    return this.getBlockHeaderByHash(blockHash);
  }
  private getBlockNumberByBlockNumberOrTag(blockOpt: BlockNumberOrTag): bigint {
    // TODO: add support for blockOpts below
    if (
      typeof blockOpt === "string" &&
      ["pending", "earliest", "finalized", "safe"].includes(blockOpt)
    ) {
      throw new Error(`"pending" is not yet supported`);
    } else if (blockOpt === "latest") {
      return BigInt(this.latestBlockNumber);
    } else {
      const blockNumber = BigInt(blockOpt as any);
      if (blockNumber > BigInt(this.latestBlockNumber) + MAX_BLOCK_FUTURE) {
        throw new Error("specified block is too far in future");
      } else if (blockNumber + MAX_BLOCK_HISTORY < this.latestBlockNumber) {
        throw new Error(
          `specified block cannot older that ${MAX_BLOCK_HISTORY}`,
        );
      }
      return blockNumber;
    }
  }
  private async waitForBlockNumber(blockNumber: bigint) {
    if (blockNumber <= this.latestBlockNumber) return;
    console.log(`waiting for blockNumber ${blockNumber}`);
    const blockNumberHex = bigIntToHex(blockNumber);
    if (!(blockNumberHex in this.blockPromises)) {
      let r: () => void = () => {};
      const p = new Promise<void>((resolve) => {
        r = resolve;
      });
      this.blockPromises[blockNumberHex] = {
        promise: p,
        resolve: r,
      };
    }
    return this.blockPromises[blockNumberHex].promise;
  }

  private async getBlockHeaderByHash(blockHash: Bytes32) {
    if (!this.blockHeaders[blockHash]) {
      const { result: blockInfo, success } = await this.rpc.request({
        method: "eth_getBlockByHash",
        params: [blockHash, true],
      });

      if (!success) {
        throw new Error(`RPC request failed`);
      }

      const headerData = headerDataFromWeb3Response(blockInfo);
      const header = new BlockHeader(headerData, { common: this.common });

      if (!header.hash().equals(toBuffer(blockHash))) {
        throw new Error(
          `blockhash doesn't match the blockInfo provided by the RPC`,
        );
      }
      this.blockHeaders[blockHash] = header;
    }
    return this.blockHeaders[blockHash];
  }

  private async verifyProof(
    address: Address,
    storageKeys: Bytes32[],
    stateRoot: Buffer,
    proof: GetProof,
  ): Promise<boolean> {
    const trie = new Trie();
    const key = keccak256(address.toBuffer());
    const expectedAccountRLP = await trie.verifyProof(
      stateRoot,
      toBuffer(key),
      proof.accountProof.map((a) => toBuffer(a)),
    );
    const account = Account.fromAccountData({
      nonce: BigInt(proof.nonce),
      balance: BigInt(proof.balance),
      storageRoot: proof.storageHash,
      codeHash: proof.codeHash,
    });
    const isAccountValid = account
      .serialize()
      .equals(expectedAccountRLP ? expectedAccountRLP : emptyAccountSerialize);
    if (!isAccountValid) {
      return false;
    }
    if (storageKeys.length !== proof?.storageProof.length) {
      console.error("missing storageProof");
      throw new Error("missing storageProof");
    }

    for (let i = 0; i < storageKeys.length; i++) {
      const sp = proof.storageProof[i];
      const key = keccak256(setLengthLeft(toBuffer(storageKeys[i]), 32));
      const expectedStorageRLP = await trie.verifyProof(
        toBuffer(proof.storageHash),
        toBuffer(key),
        sp.proof.map((a) => toBuffer(a)),
      );
      const isStorageValid =
        (!expectedStorageRLP && sp.value === "0x0") ||
        (!!expectedStorageRLP &&
          expectedStorageRLP.equals(Buffer.from(rlp.encode(sp.value))));
      if (!isStorageValid) {
        return false;
      }
    }

    return true;
  }
  private verifyCodeHash(code: Bytes, codeHash: Bytes32): boolean {
    return (
      (code === "0x" && codeHash === "0x" + KECCAK256_NULL_S) ||
      byteArrayEquals(keccak256(fromHexString(code)), fromHexString(codeHash))
    );
  }

  private validateTx(tx: RPCTx) {
    if (tx.gasPrice !== undefined && tx.maxFeePerGas !== undefined) {
      throw new Error("Cannot send both gasPrice and maxFeePerGas params");
    }

    if (tx.gasPrice !== undefined && tx.maxPriorityFeePerGas !== undefined) {
      throw new Error("Cannot send both gasPrice and maxPriorityFeePerGas");
    }

    if (
      tx.maxFeePerGas !== undefined &&
      tx.maxPriorityFeePerGas !== undefined &&
      BigInt(tx.maxPriorityFeePerGas) > BigInt(tx.maxFeePerGas)
    ) {
      throw new Error(
        `maxPriorityFeePerGas (${tx.maxPriorityFeePerGas.toString()}) is bigger than maxFeePerGas (${tx.maxFeePerGas.toString()})`,
      );
    }
  }
  private async getBlock(header: BlockHeader) {
    const { result: blockInfo, success } = await this.rpc.request({
      method: "eth_getBlockByNumber",
      params: [bigIntToHex(header.number), true],
    });

    if (!success) {
      throw new Error(`RPC request failed`);
    }
    // TODO: add support for uncle headers; First fetch all the uncles
    // add it to the blockData, verify the uncles and use it
    const blockData = blockDataFromWeb3Response(blockInfo);
    const block = Block.fromBlockData(blockData, { common: this.common });

    if (!block.header.hash().equals(header.hash())) {
      throw new Error(
        `BN(${header.number}): blockhash doest match the blockData provided by the RPC`,
      );
    }

    if (!(await block.validateTransactionsTrie())) {
      throw new Error(
        `transactionTree doesn't match the transactions provided by the RPC`,
      );
    }

    return block;
  }

  private async getBlockHash(blockNumber: bigint) {
    if (blockNumber > this.latestBlockNumber)
      throw new Error("cannot return blockhash for a blocknumber in future");
    // TODO: fetch the blockHeader is batched request
    let lastVerifiedBlockNumber = this.latestBlockNumber;
    while (lastVerifiedBlockNumber > blockNumber) {
      const hash =
        this.blockHashes[bigIntToHex(BigInt(lastVerifiedBlockNumber))];
      const header = await this.getBlockHeaderByHash(hash);
      lastVerifiedBlockNumber--;
      const parentBlockHash = bufferToHex(header.parentHash);
      const parentBlockNumberHex = bigIntToHex(BigInt(lastVerifiedBlockNumber));
      if (
        parentBlockNumberHex in this.blockHashes &&
        this.blockHashes[parentBlockNumberHex] !== parentBlockHash
      ) {
        console.log(
          "Overriding an existing verified blockhash. Possibly the chain had a reorg",
        );
      }
      this.blockHashes[parentBlockNumberHex] = parentBlockHash;
    }

    return this.blockHashes[bigIntToHex(blockNumber)];
  }
}
