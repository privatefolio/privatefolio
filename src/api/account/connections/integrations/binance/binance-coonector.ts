import { BinanceConnection, SyncResult } from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"
import { formatDate } from "src/utils/formatting-utils"
import { noop, wait } from "src/utils/utils"

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
  getBinanceDeposit,
  getBinanceFlexibleRewards,
  getBinanceFuturesCOINIncome,
  getBinanceFuturesCOINSymbols,
  getBinanceFuturesCOINTrades,
  getBinanceFuturesUSDIncome,
  getBinanceFuturesUSDSymbols,
  getBinanceFuturesUSDTrades,
  getBinanceLockedRewards,
  getBinanceMarginLiquidation,
  getBinanceMarginLoanRepayment,
  getBinanceMarginTrades,
  getBinanceMarginTransfer,
  getBinanceSymbols,
  getBinanceTradesForSymbol,
  getBinanceWithdraw,
} from "./binance-account-api"
import { parseDeposit } from "./binance-deposit"
import { parseFuturesCOINIncome } from "./binance-future/binance-futures-COIN-income"
import { parseFuturesCOINTrade } from "./binance-future/binance-futures-COIN-trades"
import { parseFuturesUSDIncome } from "./binance-future/binance-futures-USD-income"
import { parseFuturesUSDTrade } from "./binance-future/binance-futures-USD-trades"
import { parseLoan, parseRepayment } from "./binance-margin/binance-margin-borrow-repay"
import { parseMarginTrade } from "./binance-margin/binance-margin-trades"
import { parseMarginTransfer } from "./binance-margin/binance-margin-transfer"
import { parseMarginLiquidation } from "./binance-margin/binance-margine-liquidation"
import { parseReward } from "./binance-rewards"
import { parseTrade } from "./binance-trades"
import { parseWithdraw } from "./binance-withdraw"

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
  since: string,
  signal?: AbortSignal
): Promise<SyncResult> {
  progress([0, `Starting from block number ${since}`])

  const result: SyncResult = {
    assetMap: {},
    logMap: {},
    newCursor: since,
    operationMap: {},
    rows: 0,
    txMap: {},
    walletMap: {},
  }

  progress([0, `Fetching deposits`])
  const genesis = 1498867200000
  const currentTime = Date.now()
  const sevenDays = 604_800_000
  const thirtyDays = 2_592_000_000
  const ninetyDays = 7_776_000_000
  const twoHundredDays = 17_280_000_000

  let deposits: BinanceDeposit[] = []
  const promisesDeposits: (() => Promise<void>)[] = []

  for (let startTime = genesis; startTime <= currentTime; startTime += ninetyDays) {
    // eslint-disable-next-line no-loop-func
    promisesDeposits.push(async () => {
      const endTime = startTime + ninetyDays
      try {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progress([
          undefined,
          `Fetching deposit history for ${formatDate(startTime)} to ${formatDate(endTime)}`,
        ])
        const deposit = await getBinanceDeposit(connection, startTime, endTime)
        deposits = deposits.concat(deposit)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
        ])
      }
    })
  }

  await Promise.all(
    promisesDeposits.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
      })
    )
  )
  console.log("Deposits: ", deposits)
  progress([5, `Fetched ${deposits.length} deposits`])
  progress([5, `Fetching withdrawals`])

  let withdraws: BinanceWithdraw[] = []
  const promisesWithdraws: (() => Promise<void>)[] = []
  for (let startTime = genesis; startTime <= currentTime; startTime += ninetyDays) {
    // eslint-disable-next-line no-loop-func
    promisesWithdraws.push(async () => {
      const endTime = startTime + ninetyDays
      try {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progress([
          undefined,
          `Fetching withdraws history for ${formatDate(startTime)} to ${formatDate(endTime)}`,
        ])
        const withdraw = await getBinanceWithdraw(connection, startTime, endTime, progress)
        withdraws = withdraws.concat(withdraw)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
        ])
      }
    })
  }

  for (let page = 0; page < promisesWithdraws.length / 10; page++) {
    const batch = promisesWithdraws.slice(page * 10, page * 10 + 10)
    if (page !== 0) {
      await wait(1_000)
    }
    await Promise.all(
      batch.map((fetchFn) =>
        fetchFn().then(() => {
          if (signal?.aborted) {
            throw new Error(signal.reason)
          }
        })
      )
    )
  }

  console.log("Withdraws: ", withdraws)
  progress([10, `Fetched ${withdraws.length} withdraws`])
  progress([10, `Fetching symbols`])
  const symbols = await getBinanceSymbols(connection)
  progress([15, `Fetched ${symbols.length} symbols`])
  progress([15, `Fetching spot and margin trade history`])

  let trades: BinanceTrade[] = []
  let marginTrades: BinanceMarginTrade[] = []
  let progressCount = 0
  for (let i = 0; i < symbols.length; i += 10) {
    const batch = symbols.slice(i, i + 10)

    await Promise.all(
      // eslint-disable-next-line no-loop-func
      batch.map(async (symbol) => {
        try {
          if (signal?.aborted) {
            throw new Error(signal.reason)
          }
          progress([undefined, `Fetching trade history for ${symbol.symbol}`])
          const tradesForSymbol = await getBinanceTradesForSymbol(connection, symbol, progress)
          trades = trades.concat(tradesForSymbol)
          const marginCrossTrades = await getBinanceMarginTrades(
            connection,
            symbol,
            false,
            progress
          )
          const marginIsolatedTrades = await getBinanceMarginTrades(
            connection,
            symbol,
            true,
            progress
          )
          marginTrades = marginTrades.concat(marginIsolatedTrades, marginCrossTrades)
        } catch (err) {
          if (String(err).includes("429")) {
            throw err
          }
          progress([undefined, `Skipping ${symbol}. ${String(err)}`])
        }
      })
    )

    progressCount += batch.length
    progress([15 + (progressCount / symbols.length) * 15])
    if (i + 10 < symbols.length) {
      await wait(200 * 4)
    }
  }

  console.log("Spot and Margin trades: ", trades)
  progress([30, `Fetched ${trades.length} trades`])
  progress([30, `Fetching rewards`])
  let rewards: BinanceReward[] = []
  const promisesRewards: (() => Promise<void>)[] = []
  for (let startTime = genesis; startTime <= currentTime; startTime += ninetyDays) {
    // eslint-disable-next-line no-loop-func
    promisesRewards.push(async () => {
      const endTime = startTime + ninetyDays
      try {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progress([
          undefined,
          `Fetching reward history for ${formatDate(startTime)} to ${formatDate(endTime)}`,
        ])
        const flexibleReward = await getBinanceFlexibleRewards(
          connection,
          startTime,
          endTime,
          progress,
          "REWARDS"
        )
        const flexibleBonus = await getBinanceFlexibleRewards(
          connection,
          startTime,
          endTime,
          progress,
          "BONUS"
        )
        const flexibleRealtime = await getBinanceFlexibleRewards(
          connection,
          startTime,
          endTime,
          progress,
          "REALTIME"
        )
        const lockedReward = await getBinanceLockedRewards(connection, startTime, endTime, progress)
        rewards = rewards.concat(lockedReward, flexibleReward, flexibleBonus, flexibleRealtime)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
        ])
      }
    })
  }

  await Promise.all(
    promisesRewards.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
      })
    )
  )
  console.log("Rewards: ", rewards)
  progress([35, `Fetched ${rewards.length} rewards`])
  progress([35, `Fetching  Loan and repayment history`])
  let loans: BinanceMarginLoanRepayment[] = []
  let repayments: BinanceMarginLoanRepayment[] = []
  const promisesMargin: (() => Promise<void>)[] = []

  for (let startTime = genesis; startTime <= currentTime; startTime += sevenDays) {
    // eslint-disable-next-line no-loop-func
    promisesMargin.push(async () => {
      const endTime = startTime + sevenDays
      try {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progress([
          undefined,
          `Fetching margin loan and repay for ${formatDate(startTime)} to ${formatDate(endTime)}`,
        ])
        const borrow = await getBinanceMarginLoanRepayment(
          connection,
          startTime,
          endTime,
          "BORROW",
          progress
        )
        const repay = await getBinanceMarginLoanRepayment(
          connection,
          startTime,
          endTime,
          "REPAY",
          progress
        )
        loans = loans.concat(borrow)
        repayments = repayments.concat(repay)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
        ])
      }
    })
  }

  await Promise.all(
    promisesMargin.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
      })
    )
  )
  console.log("Loans: ", loans, "Repayments: ", repayments)
  progress([40, `Fetched ${loans.length} loans and ${repayments.length} repayments`])
  progress([40, `Fetching Margin transfers and liquidations`])
  let marginTransfers: BinanceMarginTransfer[] = []
  let marginLiquidations: BinanceMarginLiquidation[] = []
  const promisesMarginTransfer: (() => Promise<void>)[] = []

  for (let startTime = genesis; startTime <= currentTime; startTime += thirtyDays) {
    // eslint-disable-next-line no-loop-func
    promisesMarginTransfer.push(async () => {
      const endTime = startTime + thirtyDays > currentTime ? currentTime : startTime + thirtyDays
      try {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progress([
          undefined,
          `Fetching margin transfers and liquidation for ${formatDate(startTime)} to ${formatDate(
            endTime
          )}`,
        ])
        const transfers = await getBinanceMarginTransfer(connection, startTime, endTime, progress)
        const liquidations = await getBinanceMarginLiquidation(
          connection,
          startTime,
          endTime,
          progress
        )
        marginTransfers = marginTransfers.concat(transfers)
        marginLiquidations = marginLiquidations.concat(liquidations)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
        ])
      }
    })
  }

  await Promise.all(
    promisesMarginTransfer.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
      })
    )
  )

  console.log("Margin Transfers: ", marginTransfers)
  console.log("Margin Liquidations: ", marginLiquidations)
  progress([
    43,
    `Fetched ${marginTransfers.length} transfers and ${marginLiquidations.length} liquidations`,
  ])
  progress([43, `Fetching Futures symbols`])
  const futuresUSDSymbols = await getBinanceFuturesUSDSymbols(connection)
  console.log("Futures USD symbols:", futuresUSDSymbols)
  const futuresCOINSymbols = await getBinanceFuturesCOINSymbols(connection)
  console.log("Futures COIN symbols:", futuresCOINSymbols)
  progress([
    45,
    `Fetched ${futuresUSDSymbols.length} futures USD symbols and ${futuresCOINSymbols.length} futures COIN symbols`,
  ])
  progress([45, `Fetching futures COIN trade history`])

  let futuresCOINTrades: BinanceFuturesCOINTrades[] = []
  progressCount = 0
  for (let startTime = genesis; startTime <= currentTime; startTime += twoHundredDays) {
    const endTime =
      startTime + twoHundredDays > currentTime ? currentTime : startTime + twoHundredDays
    for (let i = 0; i < futuresCOINSymbols.length; i += 10) {
      const batch = futuresCOINSymbols.slice(i, i + 10)
      await Promise.all(
        // eslint-disable-next-line no-loop-func
        batch.map(async (symbol) => {
          try {
            if (signal?.aborted) {
              throw new Error(signal.reason)
            }
            progress([undefined, `Fetching futures COIN trade history for ${symbol.symbol}`])
            const trades = await getBinanceFuturesCOINTrades(
              connection,
              symbol,
              startTime,
              endTime,
              progress
            )
            futuresCOINTrades = futuresCOINTrades.concat(trades)
          } catch (err) {
            if (String(err).includes("429")) {
              throw err
            }
            progress([undefined, `Skipping ${symbol}. ${String(err)}`])
          }
        })
      )

      progressCount += batch.length
      progress([45 + (progressCount / symbols.length) * 15])
      if (i + 10 < symbols.length) {
        await wait(10000)
      }
    }
  }
  console.log("Trades futures COIN: ", futuresCOINTrades)
  progress([60, `Fetched ${futuresCOINTrades.length} futures COIN-M trades`])
  progress([60, `Fetching futures COIN income history`])

  let futuresCOINIncome: BinanceFuturesCOINIncome[] = []
  const promisesfutureCoin: (() => Promise<void>)[] = []
  for (let startTime = genesis; startTime <= currentTime; startTime += twoHundredDays) {
    // eslint-disable-next-line no-loop-func
    promisesfutureCoin.push(async () => {
      const endTime =
        startTime + twoHundredDays > currentTime ? currentTime : startTime + twoHundredDays
      try {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progress([
          undefined,
          `Fetching margin for ${formatDate(startTime)} to ${formatDate(endTime)}`,
        ])
        const x = await getBinanceFuturesCOINIncome(connection, startTime, endTime, progress)
        futuresCOINIncome = futuresCOINIncome.concat(x)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
        ])
      }
    })
  }

  await Promise.all(
    promisesfutureCoin.map((fetchFn) =>
      fetchFn().then(() => {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
      })
    )
  )
  console.log("Income futures COIN: ", futuresCOINIncome)
  progress([65, `Fetched ${futuresCOINIncome.length} futures COIN-M income`])
  progress([65, `Fetching futures USD trade history`])

  let futuresUSDTrades: BinanceFuturesUSDTrades[] = []
  progressCount = 0
  for (let startTime = genesis; startTime <= currentTime; startTime += sevenDays) {
    const endTime = startTime + sevenDays
    for (let i = 0; i < futuresUSDSymbols.length; i += 10) {
      const batch = futuresUSDSymbols.slice(i, i + 10)

      await Promise.all(
        // eslint-disable-next-line no-loop-func
        batch.map(async (symbol) => {
          try {
            if (signal?.aborted) {
              throw new Error(signal.reason)
            }
            progress([undefined, `Fetching futures USD-M trade history for ${symbol.symbol}`])
            const trades = await getBinanceFuturesUSDTrades(
              connection,
              symbol,
              startTime,
              endTime,
              progress
            )
            futuresUSDTrades = futuresUSDTrades.concat(trades)
          } catch (err) {
            if (String(err).includes("429")) {
              throw err
            }
            progress([undefined, `Skipping ${symbol}. ${String(err)}`])
          }
        })
      )

      progressCount += batch.length
      progress([65 + (progressCount / symbols.length) * 30])
      if (i + 10 < symbols.length) {
        await wait(1250)
      }
    }
  }
  console.log("Trades Future USD-M: ", futuresUSDTrades)
  progress([95, `Fetched ${futuresUSDTrades.length} futures USD-M trades`])
  progress([95, `Fetching futures USD-M income history`])

  let futuresUSDIncome: BinanceFuturesUSDIncome[] = []
  const promisesfutureUSD: (() => Promise<void>)[] = []
  for (let startTime = genesis; startTime <= currentTime; startTime += sevenDays) {
    // eslint-disable-next-line no-loop-func
    promisesfutureUSD.push(async () => {
      const endTime = startTime + sevenDays > currentTime ? currentTime : startTime + sevenDays
      try {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progress([
          undefined,
          `Fetching futures USD income for ${formatDate(startTime)} to ${formatDate(endTime)}`,
        ])
        const x = await getBinanceFuturesUSDIncome(connection, startTime, endTime, progress)
        futuresUSDIncome = futuresUSDIncome.concat(x)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. ${String(err)}`,
        ])
      }
    })
  }

  for (let i = 0; i < promisesfutureUSD.length; i += 10) {
    await Promise.all(
      promisesfutureUSD.slice(i, i + 10).map((fetchFn) =>
        fetchFn().then(() => {
          if (signal?.aborted) {
            throw new Error(signal.reason)
          }
        })
      )
    )
    if (i + 10 < promisesfutureUSD.length) {
      await wait(10_000)
    }
  }
  console.log("Income futures USD-M: ", futuresUSDIncome)
  progress([98, `Fetched ${futuresUSDIncome.length} futures USD-M incomes`])

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

  let blockNumber = 0
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

    const lastBlock = txArray[txArray.length - 1]?.blockNumber

    if (lastBlock && Number(lastBlock) > blockNumber) {
      blockNumber = Number(lastBlock)
    }
  })

  result.newCursor = String(blockNumber + 1)
  console.log("🚀 ~ result:", result)
  return result
}
