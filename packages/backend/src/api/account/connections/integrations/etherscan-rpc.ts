import type { BlockTag } from "ethers"
import { EtherscanProvider } from "ethers"

/**
 * @example
 * ```json
 * {
 *     "blockNumber":"3462296",
 *     "timeStamp":"1491118514",
 *     "blockReward":"5194770940000000000"
 * }
 * ```
 */
export interface BlockRewardTransaction {
  blockNumber: string
  blockReward: string
  timeStamp: string
}

/**
 *
 * @example
 * ```json
 * {
 *   "blockNumber": "302086",
 *   "timeStamp": "1443428683",
 *   "hash": "0x9b629147b75dc0b275d478fa34d97c5d4a26926457540b15a5ce871df36c23fd",
 *   "nonce": "109",
 *   "blockHash": "0xa3c3db0ff0bb72b859d670b04bcd2831731b7c36ba578ece204f49de9ffea05c",
 *   "transactionIndex": "1",
 *   "from": "0x1db3439a222c519ab44bb1144fc28167b4fa6ee6",
 *   "to": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
 *   "value": "250000000000000000",
 *   "gas": "90000",
 *   "gasPrice": "50000000000",
 *   "isError": "0",
 *   "txreceipt_status": "",
 *   "input": "0x",
 *   "contractAddress": "",
 *   "cumulativeGasUsed": "42000",
 *   "gasUsed": "21000",
 *   "confirmations": "18568510",
 *   "methodId": "0x",
 *   "functionName": ""
 * }
 * ```
 */
export interface NormalTransaction {
  blockHash: string
  blockNumber: string
  confirmations: string
  contractAddress: string
  cumulativeGasUsed: string
  from: string
  functionName: string
  gas: string
  gasPrice: string
  gasUsed: string
  hash: string
  input: string
  isError: string
  methodId: string
  nonce: string
  timeStamp: string // Time as string
  to: string
  transactionIndex: string
  txreceipt_status: string
  value: string
}

/**
 * @example
 * ```json
 * {
 *   "blockNumber": "6404681",
 *   "timeStamp": "1537989326",
 *   "hash": "0x8e94d2b8ac737582b108c928d54b5eb0f1eb9cebf99b4bae0db7ea2123bbf813",
 *   "from": "0x30f938fedade6e06a9a7cd2ac3517131c317b1e7",
 *   "to": "0x003dc32fe920b4aaeed12dc87e145f030aa753f3",
 *   "value": "2039696004929649789",
 *   "contractAddress": "",
 *   "input": "",
 *   "type": "call",
 *   "gas": "2300",
 *   "gasUsed": "0",
 *   "traceId": "1",
 *   "isError": "0",
 *   "errCode": ""
 * }
 * ```
 */
export interface InternalTransaction {
  blockNumber: string
  contractAddress: string
  errCode: string
  from: string
  gas: string
  gasUsed: string
  hash: string
  input: string
  isError: string
  timeStamp: string // Time as string
  to: string
  traceId: string
  type: string
  value: string
}

/**
 * @example
 * ```json
 * {
 *   "blockNumber": "4497036",
 *   "timeStamp": "1511302899",
 *   "hash": "0x129bee633df089f99c55d7ebd0608655c613e3459b823db030a32abbc2b24b50",
 *   "nonce": "491",
 *   "blockHash": "0x4372dcddc9090af8ae8d2c60eff39df6f34150fc13f722ec3509201b06e79813",
 *   "from": "0xae2b80f7f4d285caa658a285233550d19c8e7847",
 *   "contractAddress": "0x519475b31653e46d20cd09f9fdcf3b12bdacb4f5",
 *   "to": "0x00d12hnid12ndi12dn12d12d12d12d12d12d12d",
 *   "value": "9041312760000000000",
 *   "tokenName": "VIU",
 *   "tokenSymbol": "VIU",
 *   "tokenDecimal": "18",
 *   "transactionIndex": "57",
 *   "gas": "3300000",
 *   "gasPrice": "200000000",
 *   "gasUsed": "3271356",
 *   "cumulativeGasUsed": "5932947",
 *   "input": "deprecated",
 *   "confirmations": "14403522"
 * }
 * ```
 */
export interface Erc20Transaction {
  blockHash: string
  blockNumber: string
  confirmations: string
  contractAddress: string
  cumulativeGasUsed: string
  from?: string
  gas: string
  gasPrice: string
  gasUsed: string
  hash: string
  input: string
  nonce: string
  timeStamp: string
  to?: string
  tokenDecimal: string
  tokenName: string
  tokenSymbol: string
  transactionIndex: string
  value: string
}

/**
 * @example
 * ```json
 * {
 *    "withdrawalIndex":"14",
 *    "validatorIndex":"119023",
 *    "address":"0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f",
 *    "amount":"3244098967",
 *    "blockNumber":"17034877",
 *    "timestamp":"1681338599"
 * }
 * ```
 */
export interface StakingWithdrawalTransaction {
  address: string
  amount: string
  blockNumber: string
  timestamp: string
  validatorIndex: string
  withdrawalIndex: string
}

export class FullEtherscanProvider extends EtherscanProvider {
  // https://docs.etherscan.io/api-endpoints/accounts#get-list-of-blocks-validated-by-address
  async getBlockRewardTransactions(
    address: string,
    startBlock?: BlockTag,
    endBlock?: BlockTag
  ): Promise<Array<BlockRewardTransaction>> {
    const params = {
      action: "getminedblocks",
      address,
      sort: "asc",
    }

    return this.fetch("account", params)
      .catch((error) => {
        if (error?.info?.result?.result) {
          throw new Error(`Etherscan API: ${error?.info?.result?.result}`)
        }
        throw error
      })
      .then((blocks) => {
        return blocks.filter((block: BlockRewardTransaction) => {
          return (
            (startBlock == null || BigInt(block.blockNumber) >= BigInt(startBlock)) &&
            (endBlock == null || BigInt(block.blockNumber) <= BigInt(endBlock))
          )
        })
      })
  }

  // https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-erc20-token-transfer-events-by-address
  async getErc20Transactions(
    address: string,
    startBlock?: BlockTag,
    endBlock?: BlockTag
  ): Promise<Array<Erc20Transaction>> {
    const params = {
      action: "tokentx",
      address,
      endblock: endBlock == null ? 99_999_999_999 : endBlock,
      sort: "asc",
      startblock: startBlock == null ? 0 : startBlock,
    }

    return this.fetch("account", params).catch((error) => {
      if (error?.info?.result?.result) {
        throw new Error(`Etherscan API: ${error?.info?.result?.result}`)
      }
      throw error
    })
  }

  // https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-internal-transactions-by-address
  async getInternalTransactions(
    address: string,
    startBlock?: BlockTag,
    endBlock?: BlockTag
  ): Promise<Array<InternalTransaction>> {
    const params = {
      action: "txlistinternal",
      address,
      endblock: endBlock == null ? 99_999_999_999 : endBlock,
      sort: "asc",
      startblock: startBlock == null ? 0 : startBlock,
    }

    return this.fetch("account", params).catch((error) => {
      if (error?.info?.result?.result) {
        throw new Error(`Etherscan API: ${error?.info?.result?.result}`)
      }
      throw error
    })
  }

  // https://docs.etherscan.io/api-endpoints/accounts#get-beacon-chain-withdrawals-by-address-and-block-range
  async getStakingWithdrawalTransactions(
    address: string,
    startBlock?: BlockTag,
    endBlock?: BlockTag
  ): Promise<Array<StakingWithdrawalTransaction>> {
    const params = {
      action: "txsBeaconWithdrawal",
      address,
      endblock: endBlock == null ? 99_999_999_999 : endBlock,
      sort: "asc",
      startblock: startBlock == null ? 0 : startBlock,
    }

    return this.fetch("account", params).catch((error) => {
      if (error?.info?.result?.result) {
        throw new Error(`Etherscan API: ${error?.info?.result?.result}`)
      }
      throw error
    })
  }

  // https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-normal-transactions-by-address
  async getTransactions(
    address: string,
    startBlock?: BlockTag,
    endBlock?: BlockTag
  ): Promise<Array<NormalTransaction>> {
    const params = {
      action: "txlist",
      address,
      endblock: endBlock == null ? 99_999_999_999 : endBlock,
      sort: "asc",
      startblock: startBlock == null ? 0 : startBlock,
    }

    return this.fetch("account", params).catch((error) => {
      if (error?.info?.result?.result) {
        throw new Error(`Etherscan API: ${error?.info?.result?.result}`)
      }
      throw error
    })
  }
}
