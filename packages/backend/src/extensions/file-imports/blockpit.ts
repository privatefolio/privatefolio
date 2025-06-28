import Big from "big.js"
import { AuditLog, ParserResult, Transaction } from "src/interfaces"
import { extractColumnsFromRow } from "src/utils/csv-utils"
import { parseEuropeanDateString } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

export const extensionId = "blockpit-file-import"
export const parserId = "blockpit"
export const platformId = "a/blockpit"

export const HEADER =
  "Blockpit ID;Timestamp;Source Type;Source Name;Integration;Transaction Type;Outgoing Asset;Outgoing Amount;Incoming Asset;Incoming Amount;Fee Asset;Fee Amount;Transaction ID;Note;Merge ID"

export function parse(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = extractColumnsFromRow(csvRow, 15)
  const timestamp = parseEuropeanDateString(columns[1])
  // const platform = "binance"
  const type = columns[5]
    .replace("Trade", "Swap")
    .replace("Airdrop", "Reward")
    .replace("Withdrawal", "Withdraw")

  let incoming: string | undefined, incomingAsset: string | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined
  let fee: string | undefined, feeAsset: string | undefined
  let feeBN, incomingBN, outgoingBN

  if (columns[9]) {
    incomingBN = new Big(columns[9])
    incoming = incomingBN.toFixed()
    incomingAsset = `binance:${columns[8]}`
  }
  if (columns[7]) {
    outgoingBN = new Big(columns[7])
    outgoing = outgoingBN.toFixed()
    outgoingAsset = `binance:${columns[6]}`
  }
  if (columns[11]) {
    feeBN = new Big(columns[11])
    fee = feeBN.toFixed()
    feeAsset = `binance:${columns[10]}`
  }

  // const txHash = columns[12]
  // const notes = columns[13]

  const hash = hashString(`${index}_${csvRow}`)
  const txId = `${fileImportId}_${hash}`

  if (!incoming && !outgoing && !fee) {
    throw new Error("Invalid transaction")
  }
  const wallet = "Binance"
  let logs: AuditLog[] = []
  let txns: Transaction[] = []

  if (type === "Swap") {
    const price = outgoingBN.div(incomingBN).toString()
    if (fee) {
      logs = [
        {
          assetId: incomingAsset as string,
          change: incoming as string,
          fileImportId,
          id: txId.concat("Buy"),
          importIndex: index,
          operation: "Buy",
          platformId: "binance",
          timestamp,
          wallet,
        },
        {
          assetId: outgoingAsset as string,
          change: `-${outgoing}`,
          fileImportId,
          id: txId.concat("Sell"),
          importIndex: index,
          operation: "Sell",
          platformId: "binance",
          timestamp,
          wallet,
        },
        {
          assetId: feeAsset as string,
          change: `-${fee}`,
          fileImportId,
          id: txId.concat("Fee"),
          importIndex: index,
          operation: "Fee",
          platformId: "binance",
          timestamp,
          wallet,
        },
      ]
    } else {
      logs = [
        {
          assetId: incomingAsset as string,
          change: incoming as string,
          fileImportId,
          id: txId.concat("Buy"),
          importIndex: index,
          operation: "Buy",
          platformId: "binance",
          timestamp,
          wallet,
        },
        {
          assetId: outgoingAsset as string,
          change: `-${outgoing}`,
          fileImportId,
          id: txId.concat("Sell"),
          importIndex: index,
          operation: "Sell",
          platformId: "binance",
          timestamp,
          wallet,
        },
      ]
    }
    txns = [
      {
        fee,
        feeAsset,
        fileImportId,
        id: txId,
        importIndex: index,
        incoming,
        incomingAsset,
        metadata: {},
        outgoing,
        outgoingAsset,
        platformId: "binance",
        price,
        timestamp,
        type,
        wallet,
      },
    ]
  }
  if (type === "Deposit" || type === "Reward") {
    logs = [
      {
        assetId: incomingAsset as string,
        change: incoming as string,
        fileImportId,
        id: txId,
        importIndex: index,
        operation: type,
        platformId: "binance",
        timestamp,
        wallet,
      },
    ]
    txns = [
      {
        fileImportId,
        id: txId,
        importIndex: index,
        incoming,
        incomingAsset,
        metadata: {},
        platformId: "binance",
        timestamp,
        type,
        wallet,
      },
    ]
  }

  if (type === "Withdraw") {
    const change = feeBN ? outgoingBN.plus(feeBN) : outgoingBN
    logs = [
      {
        assetId: outgoingAsset as string,
        change: `-${change.toFixed()}`,
        fileImportId,
        id: txId,
        importIndex: index,
        operation: type,
        platformId: "binance", // TODO9
        timestamp,
        wallet,
      },
    ]
    txns = [
      {
        fileImportId,
        id: txId,
        importIndex: index,
        metadata: {},
        outgoing: change.toFixed(),
        outgoingAsset,
        platformId: "binance",
        timestamp,
        type,
        wallet,
      },
    ]
  }
  return { logs, txns }
}
