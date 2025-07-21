import {
  AuditLog,
  AuditLogOperation,
  ParserRequirement,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PLATFORMS_META } from "src/settings/settings"
import { formatAddress } from "src/utils/assets-utils"

import { ETHEREUM_PLATFORM_ID } from "../utils/evm-utils"

export const extensionId = "etherscan-file-import"
export const parserId = "etherscan-block-rewards"

export const HEADER =
  '"Blockno","UnixTimestamp","DateTime (UTC)","Txn","Uncles","Miner","GasUsed","GasLimit","BaseFee","Reward(ETH)"'

export const requirements: ParserRequirement[] = [{ name: "platform", type: "platform" }]

export function parse(
  csvRow: string,
  index: number,
  fileImportId: string,
  parserContext: Record<string, unknown>
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const platformId = parserContext.platform as string
  if (!platformId) {
    throw new Error("'platform' is required for this type of file import")
  }
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
  const assetId = PLATFORMS_META[ETHEREUM_PLATFORM_ID].nativeAssetId as string as string
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
    platformId,
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
    platformId,
    timestamp,
    type,
    wallet,
  }

  return {
    logs,
    txns: [tx],
  }
}
