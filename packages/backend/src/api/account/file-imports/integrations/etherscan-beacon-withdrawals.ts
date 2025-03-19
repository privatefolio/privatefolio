import {
  AuditLog,
  AuditLogOperation,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { PlatformId, PLATFORMS_META } from "src/settings"
import { formatAddress } from "src/utils/assets-utils"

export const Identifier = "etherscan-beacon-withdrawals"
export const platform: PlatformId = "ethereum"

export const HEADER =
  '"Index","Blockno","UnixTimestamp","DateTime (UTC)","Validator Index","Recipient","Value"'

export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  // ----------------------------------------------------------------- Parse
  const columns = csvRow
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((column) => column.replaceAll('"', ""))

  // const blockNumber = columns[0]
  const withdrawalIndex = columns[1]
  const unixTimestamp = columns[2]
  const validatorIndex = columns[4]
  const recipient = formatAddress(columns[5])
  const value = columns[6]
  // ----------------------------------------------------------------- Derive
  const timestamp = new Date(Number(unixTimestamp) * 1000).getTime()
  // const timestamp = asUTC(new Date(datetimeUtc))
  const wallet = recipient
  const amount = value.split(" ")[0]
  //
  const txId = `${fileImportId}_${validatorIndex}+${withdrawalIndex}_BEACON_${index}`
  const assetId = PLATFORMS_META.ethereum.nativeAssetId as string
  const operation: AuditLogOperation = "Deposit"
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
