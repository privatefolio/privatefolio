import Big from "big.js"
import { AuditLog, ParserResult, Transaction } from "src/interfaces"
import { PlatformId } from "src/settings"
import { parseEuropeanDateString } from "src/utils/formatting-utils"
import { hashString } from "src/utils/utils"

import { extractColumnsFromRow } from "../csv-utils"

export const Identifier = "blockpit"
export const platform: PlatformId = "blockpit"

export const HEADER =
  "Blockpit ID;Timestamp;Source Type;Source Name;Integration;Transaction Type;Outgoing Asset;Outgoing Amount;Incoming Asset;Incoming Amount;Fee Asset;Fee Amount;Transaction ID;Note;Merge ID"

export function parser(csvRow: string, index: number, fileImportId: string): ParserResult {
  const columns = extractColumnsFromRow(csvRow, 15)
  const timestamp = parseEuropeanDateString(columns[1])
  // const platform = "binance"
  const type = columns[5]
    .replace("Trade", "Swap")
    .replace("Airdrop", "Reward")
    .replace("Withdrawal", "Withdraw")

  let incoming: string | undefined, incomingAsset: string | undefined, incomingN: number | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined, outgoingN: number | undefined
  let fee: string | undefined, feeAsset: string | undefined, feeN: number | undefined
  let feeBN, incomingBN, outgoingBN

  if (columns[9]) {
    incomingBN = new Big(columns[9])
    incoming = incomingBN.toFixed()
    incomingAsset = `binance:${columns[8]}`
    incomingN = incomingBN.toNumber()
  }
  if (columns[7]) {
    outgoingBN = new Big(columns[7])
    outgoing = outgoingBN.toFixed()
    outgoingAsset = `binance:${columns[6]}`
    outgoingN = outgoingBN.toNumber()
  }
  if (columns[11]) {
    feeBN = new Big(columns[11])
    fee = feeBN.toFixed()
    feeAsset = `binance:${columns[10]}`
    feeN = feeBN.toNumber()
  }

  const txHash = columns[12]
  const notes = columns[13]

  const hash = hashString(`${index}_${csvRow}`)
  const txId = `${fileImportId}_${hash}`

  if (!incoming && !outgoing && !fee) {
    throw new Error("Invalid transaction")
  }
  const wallet = "Binance Spot"
  let logs: AuditLog[] = []
  let txns: Transaction[] = []

  if (type === "Swap") {
    const priceN = (incomingN as number) / (outgoingN as number)
    const price = priceN.toString()
    logs = [
      {
        _id: txId.concat("Buy"),
        assetId: incomingAsset as string,
        change: incoming as string,
        changeN: incomingN as number,
        importId: fileImportId,
        importIndex: index,
        operation: "Buy",
        platform: "binance",
        timestamp,
        wallet,
      },
      {
        _id: txId.concat("Sell"),
        assetId: outgoingAsset as string,
        change: `-${outgoing}`,
        changeN: -(outgoingN as number),
        importId: fileImportId,
        importIndex: index,
        operation: "Sell",
        platform: "binance",
        timestamp,
        wallet,
      },
      {
        _id: txId.concat("Fee"),
        assetId: feeAsset as string,
        change: `-${fee}`,
        changeN: -(feeN as number),
        importId: fileImportId,
        importIndex: index,
        operation: "Fee",
        platform: "binance",
        timestamp,
        wallet,
      },
    ]
    txns = [
      {
        _id: txId,
        fee,
        feeAsset,
        feeN,
        importId: fileImportId,
        importIndex: index,
        incoming,
        incomingAsset,
        incomingN,
        outgoing,
        outgoingAsset,
        outgoingN,
        platform: "binance",
        price,
        priceN,
        timestamp,
        type,
        wallet,
      },
    ]
  }
  if (type === "Deposit" || type === "Reward") {
    logs = [
      {
        _id: txId,
        assetId: incomingAsset as string,
        change: incoming as string,
        changeN: incomingN as number,
        importId: fileImportId,
        importIndex: index,
        operation: type,
        platform: "binance",
        timestamp,
        wallet,
      },
    ]
    txns = [
      {
        _id: txId,
        importId: fileImportId,
        importIndex: index,
        incoming,
        incomingAsset,
        incomingN,
        platform: "binance",
        timestamp,
        type,
        wallet,
      },
    ]
  }

  if (type === "Withdraw") {
    const change = outgoingBN.plus(feeBN)
    logs = [
      {
        _id: txId,
        assetId: outgoingAsset as string,
        change: `-${change.toFixed()}`,
        changeN: -change.toNumber(),
        importId: fileImportId,
        importIndex: index,
        operation: type,
        platform: "binance",
        timestamp,
        wallet,
      },
    ]
    txns = [
      {
        _id: txId,
        importId: fileImportId,
        importIndex: index,
        outgoing: change.toFixed(),
        outgoingAsset,
        outgoingN: change.toNumber(),
        platform: "binance",
        timestamp,
        type,
        wallet,
      },
    ]
  }
  return { logs, txns }
}
