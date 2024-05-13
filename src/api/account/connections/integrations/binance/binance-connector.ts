import { BinanceConnection, SyncResult } from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"
import { noop } from "src/utils/utils"

import {
  BinanceDeposit,
  BinanceFuturesCOINIncome,
  BinanceFuturesCOINTrades,
  BinanceFuturesUSDIncome,
  BinanceFuturesUSDTrades,
  BinanceMarginLiquidation,
  BinanceMarginLoanRepayment,
  BinanceMarginTrade,
  BinanceMarginTransfer,
  BinanceReward,
  BinanceTrade,
  BinanceWithdraw,
} from "./binance-account-api"
import { binanceFuturesCOINAccount } from "./binance-future/binance-futures-COIN-account"
import { parseFuturesCOINIncome } from "./binance-future/binance-futures-COIN-income"
import { parseFuturesCOINTrade } from "./binance-future/binance-futures-COIN-trades"
import { binanceFuturesUSDAccount } from "./binance-future/binance-futures-USD-account"
import { parseFuturesUSDIncome } from "./binance-future/binance-futures-USD-income"
import { parseFuturesUSDTrade } from "./binance-future/binance-futures-USD-trades"
import { binanceCrossMarginAccount } from "./binance-margin/binance-cross-margin-account"
import { binanceIsolatedMarginAccount } from "./binance-margin/binance-isolated-margin-account"
import { parseLoan, parseRepayment } from "./binance-margin/binance-margin-borrow-repay"
import { parseMarginTrade } from "./binance-margin/binance-margin-trades"
import { parseMarginTransfer } from "./binance-margin/binance-margin-transfer"
import { parseMarginLiquidation } from "./binance-margin/binance-margine-liquidation"
import { parseDeposit } from "./binance-spot/binance-deposit"
import { parseReward } from "./binance-spot/binance-rewards"
import { binanceSpotAccount } from "./binance-spot/binance-spot-account"
import { parseTrade } from "./binance-spot/binance-trades"
import { parseWithdraw } from "./binance-spot/binance-withdraw"

const parserList = [
  parseDeposit,
  parseWithdraw,
  parseTrade,
  parseReward,
  parseLoan,
  parseRepayment,
  parseMarginTrade,
  parseMarginTransfer,
  parseMarginLiquidation,
  parseFuturesCOINTrade,
  parseFuturesCOINIncome,
  parseFuturesUSDTrade,
  parseFuturesUSDIncome,
]

export async function syncBinance(
  progress: ProgressCallback = noop,
  connection: BinanceConnection,
  debugMode: boolean,
  since: string,
  until: string,
  signal?: AbortSignal
): Promise<SyncResult> {
  progress([0, `Starting from timestamp ${since}`])
  if (until === undefined) {
    until = String(Date.now())
  }
  const wallets = connection.binanceWallets

  const result: SyncResult = {
    assetMap: {},
    logMap: {},
    newCursor: since,
    operationMap: {},
    rows: 0,
    txMap: {},
    walletMap: {},
  }

  let deposits: BinanceDeposit[] = []
  let withdraws: BinanceWithdraw[] = []
  let trades: BinanceTrade[] = []
  let rewards: BinanceReward[] = []
  let crossLoans: BinanceMarginLoanRepayment[] = []
  let crossRepayments: BinanceMarginLoanRepayment[] = []
  let crossTrades: BinanceMarginTrade[] = []
  let crossTransfers: BinanceMarginTransfer[] = []
  let crossLiquidations: BinanceMarginLiquidation[] = []
  let isolatedLoans: BinanceMarginLoanRepayment[] = []
  let isolatedRepayments: BinanceMarginLoanRepayment[] = []
  let isolatedTrades: BinanceMarginTrade[] = []
  let isolatedTransfers: BinanceMarginTransfer[] = []
  let isolatedLiquidations: BinanceMarginLiquidation[] = []
  let futuresCOINTrades: BinanceFuturesCOINTrades[] = []
  let futuresCOINIncome: BinanceFuturesCOINIncome[] = []
  let futuresUSDTrades: BinanceFuturesUSDTrades[] = []
  let futuresUSDIncome: BinanceFuturesUSDIncome[] = []

  if (wallets?.spot) {
    progress([undefined, `Fetching data from Binance Spot`])
    const result = await binanceSpotAccount(progress, connection, debugMode, since, until, signal)
    deposits = result.deposits
    withdraws = result.withdraws
    trades = result.trades
    rewards = result.rewards
    progress([undefined, `Fetched data from Binance Spot`])
  }

  if (wallets?.cross) {
    progress([undefined, `Fetching data from Binance Cross Margin`])
    const result = await binanceCrossMarginAccount(
      progress,
      connection,
      debugMode,
      since,
      until,
      signal
    )
    crossLoans = result.loans
    crossRepayments = result.repayments
    crossTrades = result.trades
    crossTransfers = result.transfers
    crossLiquidations = result.liquidations
    progress([undefined, `Fetched data from Binance Cross Margin`])
  }

  if (wallets?.isolated) {
    progress([undefined, `Fetching data from Binance Isolated Margin`])
    const result = await binanceIsolatedMarginAccount(
      progress,
      connection,
      debugMode,
      since,
      until,
      signal
    )
    isolatedLoans = result.loans
    isolatedRepayments = result.repayments
    isolatedTrades = result.trades
    isolatedTransfers = result.transfers
    isolatedLiquidations = result.liquidations
    progress([undefined, `Fetched data from Binance Isolated Margin`])
  }

  if (wallets?.coin) {
    progress([undefined, `Fetching data from Binance Coin-M Futures`])
    const result = await binanceFuturesCOINAccount(
      progress,
      connection,
      debugMode,
      since,
      until,
      signal
    )
    futuresCOINTrades = result.trades
    futuresCOINIncome = result.incomes
    progress([undefined, `Fetched data from Binance Coin-M Futures`])
  }

  if (wallets?.usd) {
    progress([undefined, `Fetching data from Binance USD-M Futures`])
    const result = await binanceFuturesUSDAccount(
      progress,
      connection,
      debugMode,
      since,
      until,
      signal
    )
    futuresUSDTrades = result.trades
    futuresUSDIncome = result.incomes
    progress([undefined, `Fetched data from Binance USD-M Futures`])
  }
  const loans: BinanceMarginLoanRepayment[] = crossLoans.concat(isolatedLoans)
  const repayments: BinanceMarginLoanRepayment[] = crossRepayments.concat(isolatedRepayments)
  const marginTrades: BinanceMarginTrade[] = crossTrades.concat(isolatedTrades)
  const marginTransfers: BinanceMarginTransfer[] = crossTransfers.concat(isolatedTransfers)
  const marginLiquidations: BinanceMarginLiquidation[] =
    crossLiquidations.concat(isolatedLiquidations)

  const transactionArrays = [
    deposits,
    withdraws,
    trades,
    rewards,
    loans,
    repayments,
    marginTrades,
    marginTransfers,
    marginLiquidations,
    futuresCOINTrades,
    futuresCOINIncome,
    futuresUSDTrades,
    futuresUSDIncome,
  ]

  progress([98, "Parsing all transactions"])
  transactionArrays.forEach((txArray, arrayIndex) => {
    const parse = parserList[arrayIndex]
    result.rows += txArray.length

    txArray.forEach((row, rowIndex) => {
      try {
        const { logs, txns = [] } = parse(row, rowIndex, connection)

        // if (logs.length === 0) throw new Error(JSON.stringify(row, null, 2))

        for (const log of logs) {
          result.logMap[log._id] = log
          result.assetMap[log.assetId] = true
          result.walletMap[log.wallet] = true
          result.operationMap[log.operation] = true
        }

        for (const transaction of txns) {
          result.txMap[transaction._id] = transaction
        }
      } catch (error) {
        progress([undefined, `Error parsing row ${rowIndex + 1}: ${String(error)}`])
      }
    })
  })

  result.newCursor = String(parseFloat(until) + 1)
  console.log("🚀 ~ result:", result)
  return result
}
