import Big from "big.js"
import { AuditLog, BinanceConnection, ParserResult, ResolutionString } from "src/interfaces"
import { floorTimestamp } from "src/utils/utils"

import { BinanceFuturesUSDIncome } from "../binance-account-api"

export function parseFuturesUSDIncome(
  row: BinanceFuturesUSDIncome,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platformId } = connection
  const { asset, income: amount, incomeType, time, tranId: id } = row

  const wallet = `Binance USD-M Futures`
  const timestamp = floorTimestamp(time, "1S" as ResolutionString)
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
          assetId: `${platformId}:${asset}`,
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
          assetId: `${platformId}:${asset}`,
          change: incomeN > 0 ? `-${income}` : income.replace("-", ""),
          fileImportId: importId,
          id: `${txId}_TRANSFER_SPOT`,
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
          assetId: `${platformId}:${asset}`,
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
          assetId: `${platformId}:${asset}`,
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
          assetId: `${platformId}:${asset}`,
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
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_Commission`,
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
          assetId: `${platformId}:${asset}`,
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
          assetId: `${platformId}:${asset}`,
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
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_DELIVERED_SETTELMENT`,
          importIndex,
          operation: "Delivered Settelment",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "REFERRAL_KICKBACK":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_REFERRAL_KICKBACK`,
          importIndex,
          operation: "Referrer Rebates",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "COMMISSION_REBATE":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_COMMISSION_REBATE`,
          importIndex,
          operation: "Commission Rebate",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "CONTEST_REWARD":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_CONTEST_REWARD`,
          importIndex,
          operation: "Reward",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "OPTIONS_PREMIUM_FEE":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_OPTIONS_PREMIUM_FEE`,
          importIndex,
          operation: "Options Fee",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "OPTIONS_SETTLE_PROFIT":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_OPTIONS_SETTLE_PROFIT`,
          importIndex,
          operation: "Options Purchase",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "AUTO_EXCHANGE":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_AUTO_EXCHANGE`,
          importIndex,
          operation: "Auto Exchange",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "COIN_SWAP_DEPOSIT":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_COIN_SWAP_DEPOSIT`,
          importIndex,
          operation: "Deposit",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "COIN_SWAP_WITHDRAW":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_COIN_SWAP_WITHDRAW`,
          importIndex,
          operation: "Withdraw",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "POSITION_LIMIT_INCREASE_FEE":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_COIN_SWAP_WITHDRAW`,
          importIndex,
          operation: "Increase Fee",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "INTERNAL_TRANSFER":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_INTERNAL_TRANSFER`,
          importIndex,
          operation: "Transfer",
          platformId,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "CROSS_COLLATERAL_TRANSFER":
      logs = [
        {
          assetId: `${platformId}:${asset}`,
          change: income,
          fileImportId: importId,
          id: `${txId}_CROSS_COLLATERAL_TRANSFER`,
          importIndex,
          operation: "Transfer",
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
