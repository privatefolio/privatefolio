import { AuditLog, BinanceConnection, ParserResult } from "src/interfaces"

import { BinanceFuturesUSDIncome } from "../binance-account-api"

export function parseFuturesUSDIncome(
  row: BinanceFuturesUSDIncome,
  index: number,
  connection: BinanceConnection
): ParserResult {
  const { platform } = connection
  const { asset, income, incomeType, info, symbol, time, tradeId, tranId: id } = row

  const wallet = `Binance USD-M Futures`
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
    case "REFERRAL_KICKBACK":
      logs = [
        {
          _id: `${txId}_REFERRAL_KICKBACK`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Referrer Rebates",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "COMMISSION_REBATE":
      logs = [
        {
          _id: `${txId}_COMMISSION_REBATE`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Commission Rebate",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "CONTEST_REWARD":
      logs = [
        {
          _id: `${txId}_CONTEST_REWARD`,
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
    case "OPTIONS_PREMIUM_FEE":
      logs = [
        {
          _id: `${txId}_OPTIONS_PREMIUM_FEE`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Options Fee",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "OPTIONS_SETTLE_PROFIT":
      logs = [
        {
          _id: `${txId}_OPTIONS_SETTLE_PROFIT`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Options Purchase",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "AUTO_EXCHANGE":
      logs = [
        {
          _id: `${txId}_AUTO_EXCHANGE`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Auto Exchange",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "COIN_SWAP_DEPOSIT":
      logs = [
        {
          _id: `${txId}_COIN_SWAP_DEPOSIT`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Deposit",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "COIN_SWAP_WITHDRAW":
      logs = [
        {
          _id: `${txId}_COIN_SWAP_WITHDRAW`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Withdraw",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "POSITION_LIMIT_INCREASE_FEE":
      logs = [
        {
          _id: `${txId}_COIN_SWAP_WITHDRAW`,
          assetId: `binance:${asset}`,
          change: income,
          changeN: incomeN,
          importId,
          importIndex,
          operation: "Increase Fee",
          platform,
          timestamp,
          txId,
          wallet,
        },
      ]
      break
    case "INTERNAL_TRANSFER":
      logs = [
        {
          _id: `${txId}_INTERNAL_TRANSFER`,
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
      ]
      break
    case "CROSS_COLLATERAL_TRANSFER":
      logs = [
        {
          _id: `${txId}_CROSS_COLLATERAL_TRANSFER`,
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
      ]
      break
  }
  return {
    logs,
  }
}
