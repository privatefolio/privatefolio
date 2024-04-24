import { AuditLog, BinanceConnection, ParserResult } from "src/interfaces"

import { BinanceFuturesCOINIncome } from "../binance-account-api"

export function parseFuturesCOINIncome(
  row: BinanceFuturesCOINIncome,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { asset, income, incomeType, info, symbol, time, tranId: id } = row

  const wallet = `Binance Coin-M Futures`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection._id}_${id}_binance_${index}`
  const importId = connection._id
  const importIndex = index
  let logs: AuditLog[] = []
  const incomeN = parseFloat(income)
  switch (incomeType) {
    case "TRANSFER":
      logs = [
        {
          _id: `${txId}_Transfer_Futures`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Transfer",
          platform,
          timestamp,
          txId,
          wallet,
        },
        {
          _id: `${txId}_Transfer_Spot`,
          assetId: `binance:${asset}`,
          change: incomeN > 0 ? `-${income}` : income.replace("-", ""),
          changeN: incomeN * -1,
          importId,
          importIndex,
          operation: "Transfer",
          platform,
          timestamp,
          txId,
          wallet: "Binance Spot",
        },
      ]
      break
    case "WELCOME_BONUS":
      logs = [
        {
          _id: `${txId}_WELCOME_BONUS`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Reward",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "FUNDING_FEE":
      logs = [
        {
          _id: `${txId}_FUNDING_FEE`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Funding Fee",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "REALIZED_PNL":
      logs = [
        {
          _id: `${txId}_REALIZED_PNL`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Realized Profit and Loss",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "COMMISSION":
      logs = [
        {
          _id: `${txId}_Commission`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Commission",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "INSURANCE_CLEAR":
      logs = [
        {
          _id: `${txId}_INSURANCE_CLEAR`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Insurance Fund",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "API_REBATE":
      logs = [
        {
          _id: `${txId}_API_REBATE`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "API Rebate",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "DELIVERED_SETTELMENT":
      logs = [
        {
          _id: `${txId}_DELIVERED_SETTELMENT`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Delivered Settelment",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
  }
  return {
    logs,
  }
}
