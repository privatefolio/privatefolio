import { BinanceConnection, ProgressCallback, Timestamp } from "src/interfaces"
import { formatDate } from "src/utils/formatting-utils"
import { noop, sleep } from "src/utils/utils"

import {
  BinanceFuturesCOINIncome,
  BinanceFuturesCOINTrades,
  getBinanceFuturesCOINIncome,
  getBinanceFuturesCOINSymbols,
  getBinanceFuturesCOINTrades,
} from "../binance-account-api"
import { _200_DAYS } from "../binance-settings"

export async function syncBinanceCoinFutures(
  progress: ProgressCallback = noop,
  connection: BinanceConnection,
  debugMode: boolean,
  since: Timestamp,
  until: Timestamp,
  signal?: AbortSignal
) {
  const genesis = since
  const currentTime = until
  await progress([0, `Starting from ${formatDate(since)}`])

  await progress([0, `Fetching Futures symbols`])
  const symbols = connection.options?.symbols || (await getBinanceFuturesCOINSymbols(connection))
  console.log("Futures COIN symbols:", symbols)
  await progress([5, `Fetched ${symbols.length} futures COIN-M symbols`])

  await progress([5, `Fetching futures COIN-M trade history`])
  let trades: BinanceFuturesCOINTrades[] = []
  let progressCount = 0
  for (let start = genesis; start <= currentTime; start += _200_DAYS) {
    const end = start + _200_DAYS > currentTime ? currentTime : start + _200_DAYS
    for (let i = 0; i < symbols.length; i += 10) {
      const batch = symbols.slice(i, i + 10)
      await Promise.all(
        // eslint-disable-next-line no-loop-func
        batch.map(async (symbol) => {
          try {
            if (signal?.aborted) throw new Error(signal.reason)
            await progress([
              undefined,
              `Fetching futures Coin-M trade history for ${symbol.symbol}`,
            ])
            const trade = await getBinanceFuturesCOINTrades(
              connection,
              symbol,
              start,
              end,
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
      await progress([45 + (progressCount / symbols.length) * 15])
      if (i + 10 < symbols.length) {
        await sleep(10000)
      }
    }
  }
  console.log("Trades futures COIN: ", trades)
  await progress([55, `Fetched ${trades.length} futures COIN-M trades`])

  await progress([55, `Fetching futures COIN income history`])
  let incomes: BinanceFuturesCOINIncome[] = []
  const promises: (() => Promise<void>)[] = []
  for (let start = genesis; start <= currentTime; start += _200_DAYS) {
    // eslint-disable-next-line no-loop-func
    promises.push(async () => {
      const end = start + _200_DAYS > currentTime ? currentTime : start + _200_DAYS
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching futures Coin-M income history from ${formatDate(start)} to ${formatDate(end)}`,
        ])
        const income = await getBinanceFuturesCOINIncome(
          connection,
          start,
          end,
          progress,
          debugMode
        )
        incomes = incomes.concat(income)
      } catch (err) {
        await progress([
          undefined,
          `Skipping ${formatDate(start)}-${formatDate(end)}. ${String(err)}`,
        ])
      }
    })
  }

  await Promise.all(
    promises.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) throw new Error(signal.reason)
      })
    )
  )
  console.log("Income futures COIN: ", incomes)
  await progress([100, `Fetched ${incomes.length} futures COIN-M income`])

  const result = {
    incomes,
    trades,
  }
  return result
}
