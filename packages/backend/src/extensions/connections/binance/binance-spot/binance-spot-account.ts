import { BinanceConnection, ProgressCallback, Timestamp } from "src/interfaces"
import { formatDate } from "src/utils/formatting-utils"
import { noop, sleep } from "src/utils/utils"

import {
  BinanceDeposit,
  BinanceReward,
  BinanceTrade,
  BinanceWithdrawal,
  getBinanceDeposit,
  getBinanceFlexibleRewards,
  getBinanceLockedRewards,
  getBinanceSymbols,
  getBinanceTradesForSymbol,
  getBinanceWithdraw,
} from "../binance-account-api"
import { _90_DAYS } from "../binance-settings"

export async function syncBinanceSpot(
  progress: ProgressCallback = noop,
  connection: BinanceConnection,
  debugMode: boolean,
  since: Timestamp,
  until: Timestamp,
  signal?: AbortSignal
) {
  await progress([0, `Fetching deposits`])
  let deposits: BinanceDeposit[] = []

  const promisesDeposits: (() => Promise<void>)[] = []
  for (let start = since; start <= until; start += _90_DAYS) {
    // eslint-disable-next-line no-loop-func
    promisesDeposits.push(async () => {
      const end = start + _90_DAYS > until ? until : start + _90_DAYS
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching deposit history for ${formatDate(start)} to ${formatDate(end)}`,
        ])
        const deposit = await getBinanceDeposit(connection, start, end, progress, debugMode)
        deposits = deposits.concat(deposit)
      } catch (err) {
        await progress([
          undefined,
          `Skipping ${formatDate(start)}-${formatDate(end)}. ${String(err)}`,
        ])
      }
    })
  }
  await Promise.all(
    promisesDeposits.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) throw new Error(signal.reason)
      })
    )
  )
  await progress([15, `Fetched ${deposits.length} deposits`])

  await progress([15, `Fetching withdrawals`])
  let withdrawals: BinanceWithdrawal[] = []
  const promisesWithdrawals: (() => Promise<void>)[] = []
  for (let start = since; start <= until; start += _90_DAYS) {
    // eslint-disable-next-line no-loop-func
    promisesWithdrawals.push(async () => {
      const end = start + _90_DAYS > until ? until : start + _90_DAYS
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching withdrawals history for ${formatDate(start)} to ${formatDate(end)}`,
        ])
        const withdraw = await getBinanceWithdraw(connection, start, end, progress, debugMode)
        withdrawals = withdrawals.concat(withdraw)
      } catch (err) {
        await progress([
          undefined,
          `Skipping ${formatDate(start)}-${formatDate(end)}. ${String(err)}`,
        ])
      }
    })
  }
  for (let page = 0; page < promisesWithdrawals.length / 10; page++) {
    const batch = promisesWithdrawals.slice(page * 10, page * 10 + 10)
    if (page !== 0) {
      await sleep(1_000)
    }
    await Promise.all(
      batch.map((fetchFn) =>
        fetchFn().then(() => {
          if (signal?.aborted) throw new Error(signal.reason)
        })
      )
    )
  }
  await progress([30, `Fetched ${withdrawals.length} withdrawals`])

  await progress([30, `Fetching symbols`])
  const symbols = connection.options?.symbols || (await getBinanceSymbols(connection))

  await progress([35, `Fetched ${symbols.length} symbols`])

  await progress([35, `Fetching spot trade history`])
  let trades: BinanceTrade[] = []
  let progressCount = 0
  for (let i = 0; i < symbols.length; i += 10) {
    const batch = symbols.slice(i, i + 10)

    await Promise.all(
      // eslint-disable-next-line no-loop-func
      batch.map(async (symbol) => {
        try {
          if (signal?.aborted) throw new Error(signal.reason)
          await progress([
            undefined,
            `Fetching trade history for ${symbol.symbol} (${formatDate(since)} - ${formatDate(until)})`,
          ])
          const tradesForSymbol = await getBinanceTradesForSymbol(
            connection,
            symbol,
            progress,
            since,
            until,
            debugMode
          )
          trades = trades.concat(tradesForSymbol)
        } catch (err) {
          if (String(err).includes("429")) {
            throw err
          }
          await progress([undefined, `Skipping ${symbol}. ${String(err)}`])
        }
      })
    )

    progressCount += batch.length
    await progress([35 + (progressCount / symbols.length) * 55])
    if (i + 10 < symbols.length) {
      await sleep(200 * 10)
    }
  }
  await progress([90, `Fetched ${trades.length} trades`])

  await progress([90, `Fetching rewards`])
  let rewards: BinanceReward[] = []
  const promisesRewards: (() => Promise<void>)[] = []
  for (let start = since; start <= until; start += _90_DAYS) {
    // eslint-disable-next-line no-loop-func
    promisesRewards.push(async () => {
      const end = start + _90_DAYS > until ? until : start + _90_DAYS
      try {
        if (signal?.aborted) throw new Error(signal.reason)
        await progress([
          undefined,
          `Fetching rewards from ${formatDate(start)} to ${formatDate(end)}`,
        ])
        const flexibleReward = await getBinanceFlexibleRewards(
          connection,
          start,
          end,
          progress,
          debugMode,
          "REWARDS"
        )
        const flexibleBonus = await getBinanceFlexibleRewards(
          connection,
          start,
          end,
          progress,
          debugMode,
          "BONUS"
        )
        const flexibleRealtime = await getBinanceFlexibleRewards(
          connection,
          start,
          end,
          progress,
          debugMode,
          "REALTIME"
        )
        const lockedReward = await getBinanceLockedRewards(
          connection,
          start,
          end,
          progress,
          debugMode
        )
        rewards = rewards.concat(lockedReward, flexibleReward, flexibleBonus, flexibleRealtime)
      } catch (err) {
        await progress([
          undefined,
          `Skipping ${formatDate(start)}-${formatDate(end)}. ${String(err)}`,
        ])
      }
    })
  }
  await Promise.all(
    promisesRewards.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) throw new Error(signal.reason)
      })
    )
  )
  await progress([100, `Fetched ${rewards.length} rewards`])
  const result = {
    deposits,
    rewards,
    trades,
    withdrawals,
  }

  return result
}
