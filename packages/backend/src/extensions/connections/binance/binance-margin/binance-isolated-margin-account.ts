import { BinanceConnection, ProgressCallback } from "src/interfaces"
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
import { sevenDays, thirtyDays } from "../binance-settings"

export async function syncBinanceIsolatedMargin(
  progress: ProgressCallback = noop,
  connection: BinanceConnection,
  debugMode: boolean,
  since: string,
  until: string,
  signal?: AbortSignal
) {
  await progress([0, `Starting from block number ${since}`])
  // const genesis = 1498867200000
  // const currentTime = Date.now()
  const genesis = since !== "0" ? parseFloat(since) : 1498867200000
  const currentTime = parseFloat(until)

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
  for (let startTime = genesis; startTime <= currentTime; startTime += sevenDays) {
    // eslint-disable-next-line no-loop-func
    promisesMargin.push(async () => {
      const endTime = startTime + sevenDays
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching margin loans and repayments from ${formatDate(startTime)} to ${formatDate(
            endTime
          )}`,
        ])
        const borrow = await getBinanceMarginLoanRepayment(
          connection,
          startTime,
          endTime,
          "BORROW",
          true,
          progress,
          debugMode
        )
        const repay = await getBinanceMarginLoanRepayment(
          connection,
          startTime,
          endTime,
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
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
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
  for (let startTime = genesis; startTime <= currentTime; startTime += thirtyDays) {
    // eslint-disable-next-line no-loop-func
    promisesMarginTransfer.push(async () => {
      const endTime = startTime + thirtyDays > currentTime ? currentTime : startTime + thirtyDays
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching margin transfers and liquidations from ${formatDate(startTime)} to ${formatDate(
            endTime
          )}`,
        ])
        const transfer = await getBinanceMarginTransfer(
          connection,
          startTime,
          endTime,
          true,
          progress,
          debugMode
        )
        const liquidation = await getBinanceMarginLiquidation(
          connection,
          startTime,
          endTime,
          true,
          progress,
          debugMode
        )
        transfers = transfers.concat(transfer)
        liquidations = liquidations.concat(liquidation)
      } catch (err) {
        await progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
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
