import { extractTransactions } from "src/extensions/utils/binance-utils"
import {
  AuditLog,
  BinanceConnection,
  BinanceConnectionOptions,
  ProgressCallback,
  SyncResult,
  Timestamp,
} from "src/interfaces"
import { formatDate } from "src/utils/formatting-utils"
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
import { BINANCE_WALLET_LABELS, binanceConnExtension, FOUNDING_DATE } from "./binance-settings"
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

export const extensionId = binanceConnExtension

export async function syncBinance(
  progress: ProgressCallback = noop,
  connection: BinanceConnection,
  debugMode: boolean,
  sinceCursor: string,
  untilCursor: string,
  signal?: AbortSignal
): Promise<SyncResult> {
  let since: Timestamp, until: Timestamp

  if (untilCursor === undefined) {
    until = Date.now()
  } else {
    until = Number(untilCursor)
  }

  if (sinceCursor === undefined) {
    since = FOUNDING_DATE
  } else {
    since = Number(sinceCursor)
  }

  const options = connection.options as BinanceConnectionOptions
  const { wallets, sinceLimit, untilLimit } = options

  if (sinceLimit && since < sinceLimit) since = sinceLimit
  if (untilLimit && until > untilLimit) until = untilLimit

  await progress([0, `Starting from ${formatDate(since)}`])
  if (untilLimit) {
    await progress([0, `Stopping at ${formatDate(untilLimit)}`])
  }

  const result: SyncResult = {
    assetMap: {},
    logMap: {},
    newCursor: String(since),
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

  await progress([98, "Extracting all the transactions & audit logs"])
  const allLogs: AuditLog[] = []
  for (let i = 0; i < transactionArrays.length; i++) {
    const parse = parserList[i]
    const txArray = transactionArrays[i]
    result.rows += txArray.length

    for (let j = 0; j < txArray.length; j++) {
      const row = txArray[j] as never
      const rowIndex = j

      try {
        const { logs } = parse(row, rowIndex, connection)

        for (const log of logs) {
          result.logMap[log.id] = log
          result.assetMap[log.assetId] = true
          result.walletMap[log.wallet] = true
          result.operationMap[log.operation] = true
        }
        allLogs.push(...logs)
      } catch (error) {
        await progress([undefined, `Error parsing row ${rowIndex + 1}: ${String(error)}`])
      }
    }
  }

  // TODO9
  const transactions = extractTransactions(allLogs, connection.id)
  // transactions = transactions.concat(extractTransactions(logs, _fileImportId, parserId))

  for (const transaction of transactions) {
    result.txMap[transaction.id] = transaction
  }

  result.newCursor = String(until + 1)
  return result
}
