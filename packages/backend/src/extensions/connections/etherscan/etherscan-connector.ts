import { ETHEREUM_PLATFORM_ID } from "src/extensions/utils/evm-utils"
import { EtherscanConnection, ProgressCallback, SyncResult } from "src/interfaces"
import { PLATFORMS_META } from "src/settings/settings"
import { noop } from "src/utils/utils"

import { parseNormal } from "./etherscan"
import { parseBlockReward } from "./etherscan-block-reward"
import { parseERC20 } from "./etherscan-erc20"
import { parseInternal } from "./etherscan-internal"
import {
  BlockRewardTransaction,
  Erc20Transaction,
  FullEtherscanProvider,
  InternalTransaction,
  NormalTransaction,
  StakingWithdrawalTransaction,
} from "./etherscan-rpc"
import { ETHERSCAN_API_KEY_V2 } from "./etherscan-settings"
import { parseStakingWithdrawal } from "./etherscan-staking-withdrawal"

const parserList = [
  parseNormal,
  parseInternal,
  parseERC20,
  parseStakingWithdrawal,
  parseBlockReward,
]

export async function syncEtherscan(
  progress: ProgressCallback = noop,
  connection: EtherscanConnection,
  since: string,
  until: string
) {
  const chainId = PLATFORMS_META[connection.platformId].chainId
  if (!chainId) {
    throw new Error(`ChainId not found for platform: ${connection.platformId}`)
  }

  const rpcProvider = new FullEtherscanProvider(chainId, ETHERSCAN_API_KEY_V2)

  await progress([0, `Starting from block number ${since}`])

  const result: SyncResult = {
    assetMap: {},
    logMap: {},
    newCursor: since,
    operationMap: {},
    rows: 0,
    txMap: {},
    walletMap: {},
  }

  let normal: NormalTransaction[] = []
  let internal: InternalTransaction[] = []
  let erc20: Erc20Transaction[] = []
  let staking: StakingWithdrawalTransaction[] = []
  let blocks: BlockRewardTransaction[] = []

  await progress([0, `Fetching all transactions`])
  normal = await rpcProvider.getTransactions(connection.address, since, until)
  await progress([10, `Fetched ${normal.length} Normal transactions`])

  if (normal.length === 0) {
    const reason = "because the wallet is not active"
    await progress([20, `Skipping Internal transactions ${reason}`])
    await progress([30, `Skipping ERC20 transactions ${reason}`])
    await progress([40, `Skipping Staking Withdrawal transactions ${reason}`])
    await progress([50, `Skipping Block Reward transactions ${reason}`])
  } else {
    internal = await rpcProvider.getInternalTransactions(connection.address, since, until)
    await progress([20, `Fetched ${internal.length} Internal transactions`])
    erc20 = await rpcProvider.getErc20Transactions(connection.address, since, until)
    await progress([30, `Fetched ${erc20.length} ERC20 transactions`])
  }

  if (connection.platformId === ETHEREUM_PLATFORM_ID && normal.length > 0) {
    staking = await rpcProvider.getStakingWithdrawalTransactions(connection.address, since, until)
    await progress([40, `Fetched ${staking.length} Staking Withdrawal transactions`])
    blocks = await rpcProvider.getBlockRewardTransactions(connection.address, since, until)
    await progress([50, `Fetched ${blocks.length} Block Reward transactions`])
  }

  if (connection.platformId !== ETHEREUM_PLATFORM_ID && normal.length > 0) {
    const reason = "because the chain is not Ethereum"
    await progress([60, `Skipping Staking Withdrawal transactions ${reason}`])
    await progress([70, `Skipping Block Reward transactions ${reason}`])
  }

  const transactionArrays = [normal, internal, erc20, staking, blocks]

  let blockNumber = 0

  await progress([50, "Parsing all transactions"])
  for (let i = 0; i < transactionArrays.length; i++) {
    const parse = parserList[i]
    const txArray = transactionArrays[i]
    result.rows += txArray.length

    for (let j = 0; j < txArray.length; j++) {
      const row = txArray[j] as never
      const rowIndex = j

      try {
        const { logs, txns = [] } = parse(row, rowIndex, connection)

        // if (logs.length === 0) throw new Error(JSON.stringify(row, null, 2))

        for (const log of logs) {
          result.logMap[log.id] = log
          result.assetMap[log.assetId] = true
          result.walletMap[log.wallet] = true
          result.operationMap[log.operation] = true
        }

        for (const transaction of txns) {
          result.txMap[transaction.id] = transaction
        }
      } catch (error) {
        await progress([undefined, `Error parsing row ${rowIndex + 1}: ${String(error)}`])
      }
    }

    const lastBlock = txArray[txArray.length - 1]?.blockNumber

    if (lastBlock && Number(lastBlock) > blockNumber) {
      blockNumber = Number(lastBlock)
    }
  }

  result.newCursor = String(blockNumber + 1)
  return result
}
