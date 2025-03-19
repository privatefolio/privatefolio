import {
  AuditLog,
  AuditLogOperation,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PlatformId, PLATFORMS_META } from "src/settings"
import { formatAddress } from "src/utils/assets-utils"

export const Identifier = "etherscan-block-rewards"
export const platform: PlatformId = "ethereum"

export const HEADER =
  '"Blockno","UnixTimestamp","DateTime (UTC)","Txn","Uncles","Miner","GasUsed","GasLimit","BaseFee","Reward(ETH)"'

export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  // ----------------------------------------------------------------- Parse
  const columns = csvRow
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((column) => column.replaceAll('"', ""))

  const blockNumber = columns[0]
  const miner = formatAddress(columns[5])
  const unixTimestamp = columns[1]
  const reward = columns[9]
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(unixTimestamp) * 1000).getTime()
  // const timestamp = asUTC(new Date(datetimeUtc))
  const wallet = miner
  const amount = reward
  //
  const txId = `${fileImportId}_${wallet}+${blockNumber}_BLOCK_${index}`
  const assetId = PLATFORMS_META.ethereum.nativeAssetId as string
  const operation: AuditLogOperation = "Reward"
  const type: TransactionType = operation

  const incoming = amount
  const incomingAsset = assetId

  const logs: AuditLog[] = []

  const change = incoming

  logs.push({
    assetId,
    change,
    fileImportId,
    id: `${txId}_VALUE_0`,
    importIndex: index,
    operation,
    platform,
    timestamp,
    txId,
    wallet,
  })

  const tx: Transaction = {
    fileImportId,
    id: txId,
    importIndex: index,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    metadata: {},
    platform,
    timestamp,
    type,
    wallet,
  }

  return {
    logs,
    txns: [tx],
  }
}
