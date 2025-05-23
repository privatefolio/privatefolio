import { BinanceConnection, ProgressCallback } from "src/interfaces"
import { formatDate } from "src/utils/formatting-utils"
import { noop, sleep } from "src/utils/utils"

import {
  BinanceFuturesUSDIncome,
  BinanceFuturesUSDTrades,
  getBinanceFuturesUSDIncome,
  getBinanceFuturesUSDSymbols,
  getBinanceFuturesUSDTrades,
} from "../binance-account-api"
import { sevenDays } from "../binance-settings"

export async function syncBinanceUsdFutures(
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

  await progress([0, `Fetching Futures symbols`])
  const symbols = connection.options?.symbols || (await getBinanceFuturesUSDSymbols(connection))
  console.log("Futures USD symbols:", symbols)
  await progress([5, `Fetched ${symbols.length} futures USD symbols`])

  await progress([5, `Fetching futures USD trade history`])
  let trades: BinanceFuturesUSDTrades[] = []
  let progressCount = 0
  for (let startTime = genesis; startTime <= currentTime; startTime += sevenDays) {
    const endTime = startTime + sevenDays
    for (let i = 0; i < symbols.length; i += 10) {
      const batch = symbols.slice(i, i + 10)

      await Promise.all(
        // eslint-disable-next-line no-loop-func
        batch.map(async (symbol) => {
          try {
            if (signal?.aborted) throw new Error(signal.reason)
            await progress([
              undefined,
              `Fetching futures USD-M trade history for ${symbol.symbol}, from ${formatDate(
                startTime
              )} to ${formatDate(endTime)}`,
            ])
            const trade = await getBinanceFuturesUSDTrades(
              connection,
              symbol,
              startTime,
              endTime,
              progress,
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
      await progress([5 + (progressCount / symbols.length) * 65])
      if (i + 10 < symbols.length) {
        await sleep(1250)
      }
    }
  }
  console.log("Trades Future USD-M: ", trades)
  await progress([70, `Fetched ${trades.length} futures USD-M trades`])

  await progress([70, `Fetching futures USD-M income history`])
  let incomes: BinanceFuturesUSDIncome[] = []
  const promises: (() => Promise<void>)[] = []
  for (let startTime = genesis; startTime <= currentTime; startTime += sevenDays) {
    // eslint-disable-next-line no-loop-func
    promises.push(async () => {
      const endTime = startTime + sevenDays > currentTime ? currentTime : startTime + sevenDays
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching futures USD-M income history from ${formatDate(startTime)} to ${formatDate(
            endTime
          )}`,
        ])
        const income = await getBinanceFuturesUSDIncome(
          connection,
          startTime,
          endTime,
          progress,
          debugMode
        )
        incomes = incomes.concat(income)
      } catch (err) {
        await progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
        ])
      }
    })
  }
  for (let i = 0; i < promises.length; i += 10) {
    await Promise.all(
      promises.slice(i, i + 10).map((fetchFn) =>
        fetchFn().then(() => {
          if (signal?.aborted) throw new Error(signal.reason)
        })
      )
    )
    if (i + 10 < promises.length) {
      await sleep(10_000)
    }
  }
  console.log("Income futures USD-M: ", incomes)
  await progress([98, `Fetched ${incomes.length} futures USD-M incomes`])

  const result = {
    incomes,
    trades,
  }
  return result
}
