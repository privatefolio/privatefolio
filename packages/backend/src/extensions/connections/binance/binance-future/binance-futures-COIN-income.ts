import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult } from "src/interfaces"

import { BinanceFuturesCOINIncome } from "../binance-account-api"
import { BINANCE_WALLET_LABELS } from "../binance-settings"

export function parseFuturesCOINIncome(
  row: BinanceFuturesCOINIncome,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { asset, income: amount, incomeType, time, tranId: id } = row

  const wallet = `Binance ${BINANCE_WALLET_LABELS.coinFutures}`
  const timestamp = new Date(Number(time)).getTime()
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${time}`)
  }
  const txId = `${connection.id}_${id}_binance_${index}`
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
          assetId: `binance:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_TRANSFER_FUTURES`,
          importIndex,
          operation: "Transfer",
          platformId,
          timestamp,
          txId,
          wallet,
        },
        {
          assetId: `binance:${asset}`,
          change: incomeN > 0 ? `-${income}` : income.replace("-", ""),
          fileImportId: importId,
          id: `${txId}_TRASNFER_SPOT`,
          importIndex,
          operation: "Transfer",
          platformId,
          timestamp,
          txId,
          wallet: "Binance Spot",
        },
      ]
      break
    case "WELCOME_BONUS":
      logs = [
        {
          assetId: `binance:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_WELCOME_BONUS`,
          importIndex,
          operation: "Reward",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "FUNDING_FEE":
      logs = [
        {
          assetId: `binance:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_FUNDING_FEE`,
          importIndex,
          operation: "Funding Fee",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "REALIZED_PNL":
      logs = [
        {
          assetId: `binance:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_REALIZED_PNL`,
          importIndex,
          operation: "Realized Profit and Loss",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "COMMISSION":
      logs = [
        {
          assetId: `binance:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_COMMISSION`,
          importIndex,
          operation: "Commission",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "INSURANCE_CLEAR":
      logs = [
        {
          assetId: `binance:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_INSURANCE_CLEAR`,
          importIndex,
          operation: "Insurance Fund",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "API_REBATE":
      logs = [
        {
          assetId: `binance:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_API_REBATE`,
          importIndex,
          operation: "API Rebate",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "DELIVERED_SETTELMENT":
      logs = [
        {
          assetId: `binance:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_DELIVERED_SETTLEMENT`,
          importIndex,
          operation: "Delivered Settelment",
          platformId,
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
