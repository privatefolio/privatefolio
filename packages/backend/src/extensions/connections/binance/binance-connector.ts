import {
  BinanceConnection,
  BinanceConnectionOptions,
  ProgressCallback,
  SyncResult,
} from "src/interfaces"
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
  BinanceWithdrawal,
} from "./binance-account-api"
import { syncBinanceCoinFutures } from "./binance-future/binance-futures-COIN-account"
import { parseFuturesCOINIncome } from "./binance-future/binance-futures-COIN-income"
import { parseFuturesCOINTrade } from "./binance-future/binance-futures-COIN-trades"
import { syncBinanceUsdFutures } from "./binance-future/binance-futures-USD-account"
import { parseFuturesUSDIncome } from "./binance-future/binance-futures-USD-income"
import { parseFuturesUSDTrade } from "./binance-future/binance-futures-USD-trades"
import { syncBinanceCrossMargin } from "./binance-margin/binance-cross-margin-account"
import { syncBinanceIsolatedMargin } from "./binance-margin/binance-isolated-margin-account"
import { parseLoan, parseRepayment } from "./binance-margin/binance-margin-borrow-repay"
import { parseMarginTrade } from "./binance-margin/binance-margin-trades"
import { parseMarginTransfer } from "./binance-margin/binance-margin-transfer"
import { parseMarginLiquidation } from "./binance-margin/binance-margine-liquidation"
import { BINANCE_WALLET_LABELS } from "./binance-settings"
import { parseDeposit } from "./binance-spot/binance-deposit"
import { parseReward } from "./binance-spot/binance-rewards"
import { syncBinanceSpot } from "./binance-spot/binance-spot-account"
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
  if (until === undefined) {
    until = String(Date.now())
  }

  const options = connection.options as BinanceConnectionOptions
  const { wallets, sinceLimit, untilLimit } = options

  if (sinceLimit && parseFloat(since) < sinceLimit) {
    since = String(sinceLimit)
  }

  if (untilLimit && parseFloat(until) > untilLimit) {
    until = String(untilLimit)
  }

  await progress([0, `Starting from timestamp ${since}`])
  if (untilLimit) {
    await progress([0, `Stopping at timestamp ${untilLimit}`])
  }

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
  let withdrawals: BinanceWithdrawal[] = []
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

  if (wallets.spot) {
    await progress([undefined, `Fetching data from Binance Spot`])
    const result = await syncBinanceSpot(progress, connection, debugMode, since, until, signal)
    deposits = result.deposits
    withdrawals = result.withdrawals
    trades = result.trades
    rewards = result.rewards
    await progress([undefined, `Fetched data from Binance Spot`])
  }

  if (wallets.crossMargin) {
    await progress([undefined, `Fetching data from Binance Cross Margin`])
    const result = await syncBinanceCrossMargin(
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
    await progress([undefined, `Fetched data from Binance Cross Margin`])
  }

  if (wallets.isolatedMargin) {
    await progress([undefined, `Fetching data from Binance Isolated Margin`])
    const result = await syncBinanceIsolatedMargin(
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
    await progress([undefined, `Fetched data from Binance Isolated Margin`])
  }

  if (wallets.coinFutures) {
    await progress([undefined, `Fetching data from ${BINANCE_WALLET_LABELS.coinFutures} wallet`])
    const result = await syncBinanceCoinFutures(
      progress,
      connection,
      debugMode,
      since,
      until,
      signal
    )
    futuresCOINTrades = result.trades
    futuresCOINIncome = result.incomes
    await progress([undefined, `Fetched data from ${BINANCE_WALLET_LABELS.coinFutures} wallet`])
  }

  if (wallets.usdFutures) {
    await progress([undefined, `Fetching data from Binance USD-M Futures`])
    const result = await syncBinanceUsdFutures(
      progress,
      connection,
      debugMode,
      since,
      until,
      signal
    )
    futuresUSDTrades = result.trades
    futuresUSDIncome = result.incomes
    await progress([undefined, `Fetched data from Binance USD-M Futures`])
  }
  const loans: BinanceMarginLoanRepayment[] = crossLoans.concat(isolatedLoans)
  const repayments: BinanceMarginLoanRepayment[] = crossRepayments.concat(isolatedRepayments)
  const marginTrades: BinanceMarginTrade[] = crossTrades.concat(isolatedTrades)
  const marginTransfers: BinanceMarginTransfer[] = crossTransfers.concat(isolatedTransfers)
  const marginLiquidations: BinanceMarginLiquidation[] =
    crossLiquidations.concat(isolatedLiquidations)

  const transactionArrays = [
    deposits,
    withdrawals,
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

  await progress([98, "Parsing all transactions"])
  for (let i = 0; i < transactionArrays.length; i++) {
    const parse = parserList[i]
    const txArray = transactionArrays[i]
    result.rows += txArray.length

    for (let j = 0; j < txArray.length; j++) {
      const row = txArray[j] as never
      const rowIndex = j

      try {
        const { logs, txns = [] } = parse(row, rowIndex, connection)

        // if (logs.length === 0) throw new Error(JSON.stringify(row, null, 2))

        for (const log of logs) {
          result.logMap[log.id] = log
          result.assetMap[log.assetId] = true
          result.walletMap[log.wallet] = true
          result.operationMap[log.operation] = true
        }

        for (const transaction of txns) {
          result.txMap[transaction.id] = transaction
        }
      } catch (error) {
        await progress([undefined, `Error parsing row ${rowIndex + 1}: ${String(error)}`])
      }
    }
  }

  result.newCursor = String(parseFloat(until) + 1)
  return result
}
