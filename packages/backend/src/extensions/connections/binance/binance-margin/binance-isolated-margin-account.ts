import { BinanceConnection, ProgressCallback, Timestamp } from "src/interfaces"
import { formatDate } from "src/utils/formatting-utils"
import { noop, sleep } from "src/utils/utils"

import {
  BinanceMarginLiquidation,
  BinanceMarginLoanRepayment,
  BinanceMarginTrade,
  BinanceMarginTransfer,
  getBinanceMarginLiquidation,
  getBinanceMarginLoanRepayment,
  getBinanceMarginTrades,
  getBinanceMarginTransfer,
  getBinanceSymbols,
} from "../binance-account-api"
import { _7_DAYS, _30_DAYS } from "../binance-settings"

export async function syncBinanceIsolatedMargin(
  progress: ProgressCallback = noop,
  connection: BinanceConnection,
  debugMode: boolean,
  since: Timestamp,
  until: Timestamp,
  signal?: AbortSignal
) {
  await progress([0, `Starting from ${formatDate(since)}`])
  const genesis = since
  const currentTime = until

  await progress([10, `Fetching symbols`])
  const symbols = connection.options?.symbols || (await getBinanceSymbols(connection))
  await progress([15, `Fetched ${symbols.length} symbols`])

  await progress([15, `Fetching isolated margin trade history`])
  let trades: BinanceMarginTrade[] = []
  let progressCount = 0
  for (let i = 0; i < symbols.length; i += 10) {
    const batch = symbols.slice(i, i + 10)

    await Promise.all(
      // eslint-disable-next-line no-loop-func
      batch.map(async (symbol) => {
        try {
          if (signal?.aborted) throw new Error(signal.reason)
          await progress([undefined, `Fetching margin trades for ${symbol.symbol} `])
          const trade = await getBinanceMarginTrades(
            connection,
            symbol,
            true,
            progress,
            genesis,
            currentTime,
            debugMode
          )
          trades = trades.concat(trade)
        } catch (err) {
          if (String(err).includes("429")) {
            throw err
          }
          await progress([undefined, `Skipping ${symbol}. ${String(err)}`])
        }
      })
    )

    progressCount += batch.length
    await progress([15 + (progressCount / symbols.length) * 15])
    if (i + 10 < symbols.length) {
      await sleep(5)
    }
  }
  await progress([30, `Fetched ${trades.length} trades`])

  await progress([30, `Fetching Loan and repayment history`])
  let loans: BinanceMarginLoanRepayment[] = []
  let repayments: BinanceMarginLoanRepayment[] = []
  const promisesMargin: (() => Promise<void>)[] = []
  for (let start = genesis; start <= currentTime; start += _7_DAYS) {
    // eslint-disable-next-line no-loop-func
    promisesMargin.push(async () => {
      const end = start + _7_DAYS
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching margin loans and repayments from ${formatDate(start)} to ${formatDate(end)}`,
        ])
        const borrow = await getBinanceMarginLoanRepayment(
          connection,
          start,
          end,
          "BORROW",
          true,
          progress,
          debugMode
        )
        const repay = await getBinanceMarginLoanRepayment(
          connection,
          start,
          end,
          "REPAY",
          true,
          progress,
          debugMode
        )
        loans = loans.concat(borrow)
        repayments = repayments.concat(repay)
      } catch (err) {
        await progress([
          undefined,
          `Skipping ${formatDate(start)}-${formatDate(end)}. ${String(err)}`,
        ])
      }
    })
  }
  await Promise.all(
    promisesMargin.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) throw new Error(signal.reason)
      })
    )
  )
  await progress([40, `Fetched ${loans.length} loans and ${repayments.length} repayments`])

  await progress([40, `Fetching Cross Margin transfers and liquidations`])
  let transfers: BinanceMarginTransfer[] = []
  let liquidations: BinanceMarginLiquidation[] = []
  const promisesMarginTransfer: (() => Promise<void>)[] = []
  for (let start = genesis; start <= currentTime; start += _30_DAYS) {
    // eslint-disable-next-line no-loop-func
    promisesMarginTransfer.push(async () => {
      const end = start + _30_DAYS > currentTime ? currentTime : start + _30_DAYS
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching margin transfers and liquidations from ${formatDate(start)} to ${formatDate(
            end
          )}`,
        ])
        const transfer = await getBinanceMarginTransfer(
          connection,
          start,
          end,
          true,
          progress,
          debugMode
        )
        const liquidation = await getBinanceMarginLiquidation(
          connection,
          start,
          end,
          true,
          progress,
          debugMode
        )
        transfers = transfers.concat(transfer)
        liquidations = liquidations.concat(liquidation)
      } catch (err) {
        await progress([
          undefined,
          `Skipping ${formatDate(start)}-${formatDate(end)}. ${String(err)}`,
        ])
      }
    })
  }

  await Promise.all(
    promisesMarginTransfer.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) throw new Error(signal.reason)
      })
    )
  )

  await progress([
    43,
    `Fetched ${transfers.length} transfers and ${liquidations.length} liquidations`,
  ])

  const result = {
    liquidations,
    loans,
    repayments,
    trades,
    transfers,
  }

  return result
}
