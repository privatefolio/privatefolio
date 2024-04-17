import { BinanceConnection, SyncResult } from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"
import { formatDate } from "src/utils/formatting-utils"
import { noop, wait } from "src/utils/utils"

import {
  BinanceDeposit,
  BinanceMarginLiquidation,
  BinanceMarginLoanRepayment,
  BinanceMarginTrade,
  BinanceMarginTransfer,
  BinanceReward,
  BinanceTrade,
  BinanceWithdraw,
  getBinanceDeposit,
  getBinanceFlexibleRewards,
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
  const currentTime = Date.now()
  let allDeposits: BinanceDeposit[] = []
  const promisesDeposits: (() => Promise<void>)[] = []
  const ninetyDays = 7_776_000_000
  const genesis = 1498867200000

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
        const x = await getBinanceDeposit(connection, startTime, endTime)
        allDeposits = allDeposits.concat(x)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. Error: ${String(err)}`,
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
  console.log("Deposits: ", allDeposits)
  progress([10, `Fetched ${allDeposits.length} deposits`])
  progress([10, `Fetching withdrawals`])

  const promisesWithdrawals: (() => Promise<void>)[] = []
  let allWithdrawals: BinanceWithdraw[] = []
  for (let startTime = genesis; startTime <= currentTime; startTime += ninetyDays) {
    // eslint-disable-next-line no-loop-func
    promisesWithdrawals.push(async () => {
      const endTime = startTime + ninetyDays
      try {
        if (signal?.aborted) {
          throw new Error(signal.reason)
        }
        progress([
          undefined,
          `Fetching withdrawals history for ${formatDate(startTime)} to ${formatDate(endTime)}`,
        ])
        const x = await getBinanceWithdraw(connection, startTime, endTime, progress)
        allWithdrawals = allWithdrawals.concat(x)
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. Error: ${String(err)}`,
        ])
      }
    })
  }

  for (let page = 0; page < promisesWithdrawals.length / 10; page++) {
    const batch = promisesWithdrawals.slice(page * 10, page * 10 + 10)

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
  console.log("Withdrawels: ", allWithdrawals)
  progress([20, `Fetched ${allWithdrawals.length} withdrawals`])
  progress([20, `Fetching symbols`])
  const symbols = await getBinanceSymbols(connection)
  progress([30, `Fetched ${symbols.length} symbols`])
  progress([30, `Fetching trade history`])
  // const promises: (() => Promise<void>)[] = []

  // for (let i = 0; i < symbols.length; i++) {
  //   const symbol = symbols[i]
  //   // eslint-disable-next-line no-loop-func
  //   promises.push(async () => {
  //     try {
  //       progress([undefined, `Fetching trade history for ${symbol}`])
  //       const x = await getBinanceTradesForSymbol(connection, symbol)
  //       allTrades = allTrades.concat(x)
  //     } catch (err) {
  //       progress([undefined, `Skipping ${symbol}. Error: ${String(err)}`])
  //     }
  //   })
  // }

  // await Promise.all(
  //   promises.map((fetchFn) =>
  //     fetchFn().then(() => {
  //       if (signal?.aborted) {
  //         throw new Error(signal.reason)
  //       }
  //       progressCount += 1
  //       progress([(progressCount / symbols.length) * 100])
  //     })
  //   )
  // )
  let allTrades: BinanceTrade[] = []
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
          allTrades = allTrades.concat(tradesForSymbol)
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
          progress([undefined, `Skipping ${symbol}. Error: ${String(err)}`])
        }
      })
    )

    progressCount += batch.length
    progress([30 + (progressCount / symbols.length) * 40])
    if (i + 10 < symbols.length) {
      await wait(200 * 4)
    }
  }
  console.log("Trades: ", allTrades)
  progress([70, `Fetched ${allTrades.length} trades`])
  progress([70, `Fetching rewards`])
  let allRewards: BinanceReward[] = []
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
          `Fetching deposit history for ${formatDate(startTime)} to ${formatDate(endTime)}`,
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
        allRewards = allRewards.concat(
          lockedReward,
          flexibleReward,
          flexibleBonus,
          flexibleRealtime
        )
      } catch (err) {
        progress([
          undefined,
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. Error: ${String(err)}`,
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
  console.log("Rewards: ", allRewards)
  progress([75, `Fetched ${allRewards.length} rewards`])

  let loans: BinanceMarginLoanRepayment[] = []
  let repayments: BinanceMarginLoanRepayment[] = []
  const promisesMargin: (() => Promise<void>)[] = []
  const sevenDays = 604_800_000

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
          `Fetching margin for ${formatDate(startTime)} to ${formatDate(endTime)}`,
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
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. Error: ${String(err)}`,
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
  console.log("Loans: ", loans)
  console.log("Repayments: ", repayments)
  progress([10, `Fetched ${loans.length} loans and ${repayments.length} repayments`])
  let marginTransfers: BinanceMarginTransfer[] = []
  let marginLiquidations: BinanceMarginLiquidation[] = []
  const promisesMarginTransfer: (() => Promise<void>)[] = []
  const thirtyDays = 2_592_000_000

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
          `Skipping ${formatDate(startTime)}-${formatDate(endTime)}. Error: ${String(err)}`,
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

  const transactionArrays = [
    allDeposits,
    allWithdrawals,
    allTrades,
    allRewards,
    loans,
    repayments,
    marginTrades,
    marginTransfers,
    marginLiquidations,
  ]

  let blockNumber = 0
  progress([75, "Parsing all transactions"])
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
