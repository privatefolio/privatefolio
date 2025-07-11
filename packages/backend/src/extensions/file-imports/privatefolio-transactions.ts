import { AuditLog, EtherscanTransaction, ParserResult, TransactionType } from "src/interfaces"
import { PlatformPrefix } from "src/settings/settings"
import { extractColumnsFromRow } from "src/utils/csv-utils"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

export const extensionId = "privatefolio-file-import"
export const parserId = "privatefolio-transactions"
export const platformId = `${PlatformPrefix.App}privatefolio` // TODO8: this should work for all EVM chains

export const HEADER =
  '"Timestamp","Platform","Wallet","Type","Incoming","Incoming Asset","Outgoing","Outgoing Asset","Fee","Fee Asset","Smart Contract","Smart Contract Method","Blockchain Tx","Notes"'

export function parse(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = extractColumnsFromRow(csvRow, 14)
  //
  const timestamp = asUTC(new Date(columns[0]))
  const platformId = columns[1]
  const wallet = columns[2]
  const type = columns[3] as TransactionType
  const incoming = columns[4]
  const incomingAsset = columns[5]
  const outgoing = columns[6]
  const outgoingAsset = columns[7]
  const fee = columns[8]
  const feeAsset = columns[9]
  const contractAddress = columns[10]
  const method = columns[11]
  const txHash = columns[12]
  const notes = columns[13]

  const hash = hashString(`${index}_${csvRow}`)
  const txId = `${fileImportId}_${hash}`

  if (!incoming && !outgoing && !fee) {
    throw new Error("Invalid transaction")
  }

  const txns: EtherscanTransaction[] = [
    {
      fee: fee === "" ? undefined : fee,
      feeAsset: fee === "" ? undefined : feeAsset,
      fileImportId,
      id: txId,
      importIndex: index,
      incoming: incoming === "" ? undefined : incoming,
      incomingAsset: incoming === "" ? undefined : incomingAsset,
      metadata: {
        contractAddress,
        method,
        txHash,
      },
      notes,
      outgoing: outgoing === "" ? undefined : outgoing,
      outgoingAsset: outgoing === "" ? undefined : outgoingAsset,
      platformId,
      timestamp,
      type,
      wallet,
    },
  ]

  const logs: AuditLog[] = []

  if (incoming !== "") {
    logs.push({
      assetId: incomingAsset,
      change: incoming,
      fileImportId,
      id: `${txId}_DEPOSIT`,
      importIndex: index + 0.1,
      operation: "Deposit",
      platformId,
      timestamp,
      txId,
      wallet,
    })
  }

  if (outgoing !== "") {
    logs.push({
      assetId: outgoingAsset,
      change: `-${outgoing}`,
      fileImportId,
      id: `${txId}_WITHDRAW`,
      importIndex: index + 0.1,
      operation: "Withdraw",
      platformId,
      timestamp,
      txId,
      wallet,
    })
  }

  if (fee !== "") {
    logs.push({
      assetId: feeAsset,
      change: fee,
      fileImportId,
      id: `${txId}_FEE`,
      importIndex: index + 0.1,
      operation: "Fee",
      platformId,
      timestamp,
      txId,
      wallet,
    })
  }

  return { logs, txns }
}
