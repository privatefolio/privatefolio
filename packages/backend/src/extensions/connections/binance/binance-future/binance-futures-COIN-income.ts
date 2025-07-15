import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult, ResolutionString } from "src/interfaces"
import { floorTimestamp } from "src/utils/utils"

import { BinanceCoinFuturesIncome } from "../binance-api"
import { BINANCE_WALLETS } from "../binance-settings"

export function parseCoinFuturesIncome(
  row: BinanceCoinFuturesIncome,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { asset, income: amount, incomeType, time, tranId: id } = row

  const wallet = `Binance ${BINANCE_WALLETS.coinFutures}`
  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance`
  const importId = connection.id
  const importIndex = index

  let logs: AuditLog[] = []
  const incomeBN = new Big(amount)
  const income = incomeBN.toFixed()
  const incomeN = incomeBN.toNumber()

  switch (incomeType) {
    case "TRANSFER":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_TRANSFER_FUTURES`,
          importIndex,
          operation: "Transfer",
          platformId,
          timestamp,
          wallet,
        },
        {
          assetId: `${platformId}:${asset}`,
          change: incomeN > 0 ? `-${income}` : income.replace("-", ""),
          fileImportId: importId,
          id: `${txId}_TRASNFER_SPOT`,
          importIndex,
          operation: "Transfer",
          platformId,
          timestamp,
          wallet: BINANCE_WALLETS.spot,
        },
      ]
      break
    case "WELCOME_BONUS":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_WELCOME_BONUS`,
          importIndex,
          operation: "Reward",
          platformId,
          timestamp,
          wallet,
        },
      ]
      break
    case "FUNDING_FEE":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_FUNDING_FEE`,
          importIndex,
          operation: "Funding Fee",
          platformId,
          timestamp,
          wallet,
        },
      ]
      break
    case "REALIZED_PNL":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_REALIZED_PNL`,
          importIndex,
          operation: "Realized Profit and Loss",
          platformId,
          timestamp,
          wallet,
        },
      ]
      break
    case "COMMISSION":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_COMMISSION`,
          importIndex,
          operation: "Commission",
          platformId,
          timestamp,
          wallet,
        },
      ]
      break
    case "INSURANCE_CLEAR":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_INSURANCE_CLEAR`,
          importIndex,
          operation: "Insurance Fund",
          platformId,
          timestamp,
          wallet,
        },
      ]
      break
    case "API_REBATE":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_API_REBATE`,
          importIndex,
          operation: "API Rebate",
          platformId,
          timestamp,
          wallet,
        },
      ]
      break
    case "DELIVERED_SETTELMENT":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_DELIVERED_SETTLEMENT`,
          importIndex,
          operation: "Delivered Settelment",
          platformId,
          timestamp,
          wallet,
        },
      ]
      break
  }
  return {
    logs,
  }
}
