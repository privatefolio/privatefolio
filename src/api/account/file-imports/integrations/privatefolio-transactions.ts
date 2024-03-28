import { AuditLog, EtherscanTransaction, ParserResult, TransactionType } from "src/interfaces"
import { PlatformId } from "src/settings"
import { asUTC } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

export const Identifier = "privatefolio"
export const platform: PlatformId = "ethereum"

export const HEADER =
  '"Timestamp","Platform","Wallet","Type","Incoming","Incoming Asset","Outgoing","Outgoing Asset","Fee","Fee Asset","Smart Contract","Smart Contract Method","Blockchain Tx","Notes"'

export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  // A regex that matches content inside quotes or non-comma characters, accounting for commas within quotes
  const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g
  let columns: string[] = csvRow.match(regex) || []

  if (columns.length !== 14) {
    throw new Error("Invalid number of columns")
  }
  // Remove quotes from the extracted columns
  columns = columns.map((column) => column.replace(/^"|"$/g, ""))
  //
  const timestamp = asUTC(new Date(columns[0]))
  const platform = columns[1] as PlatformId
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
  const incomingN = parseFloat(incoming)
  const outgoingN = parseFloat(outgoing)
  const feeN = parseFloat(fee)

  if (!incoming && !outgoing && !fee) {
    throw new Error("Invalid transaction")
  }

  const txns: EtherscanTransaction[] = [
    {
      _id: txId,
      contractAddress,
      fee: fee === "" ? undefined : fee,
      feeAsset: fee === "" ? undefined : feeAsset,
      feeN: fee === "" ? undefined : feeN,
      importId: fileImportId,
      importIndex: index,
      incoming: incoming === "" ? undefined : incoming,
      incomingAsset: incoming === "" ? undefined : incomingAsset,
      incomingN: incoming === "" ? undefined : incomingN,
      method,
      notes,
      outgoing: outgoing === "" ? undefined : outgoing,
      outgoingAsset: outgoing === "" ? undefined : outgoingAsset,
      outgoingN: outgoing === "" ? undefined : outgoingN,
      platform,
      timestamp,
      txHash,
      type,
      wallet,
    },
  ]

  const logs: AuditLog[] = []

  if (incoming !== "") {
    logs.push({
      _id: `${txId}_DEPOSIT`,
      assetId: incomingAsset,
      change: incoming,
      changeN: incomingN,
      importId: fileImportId,
      importIndex: index + 0.1,
      operation: "Deposit",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  if (outgoing !== "") {
    logs.push({
      _id: `${txId}_WITHDRAW`,
      assetId: outgoingAsset,
      change: `-${outgoing}`,
      changeN: -outgoingN,
      importId: fileImportId,
      importIndex: index + 0.1,
      operation: "Withdraw",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  if (fee !== "") {
    logs.push({
      _id: `${txId}_FEE`,
      assetId: feeAsset,
      change: fee,
      changeN: feeN,
      importId: fileImportId,
      importIndex: index + 0.1,
      operation: "Fee",
      platform,
      timestamp,
      txId,
      wallet,
    })
  }

  return { logs, txns }
}
