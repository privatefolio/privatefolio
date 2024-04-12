import { BinanceConnection, SyncResult } from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"
import { formatDate } from "src/utils/formatting-utils"
import { noop, wait } from "src/utils/utils"

import {
  BinanceDeposit,
  BinanceTrade,
  BinanceWithdraw,
  getBinanceDeposit,
  getBinanceSymbols,
  getBinanceTradesForSymbol,
  getBinanceWithdraw,
} from "./binance-account-api"
import { parseDeposit } from "./binance-deposit"
import { parseTrade } from "./binance-trades"
import { parseWithdraw } from "./binance-withdraw"

const parserList = [parseDeposit, parseWithdraw, parseTrade]

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
        } catch (err) {
          if (String(err).includes("429")) {
            throw err
          }
          progress([undefined, `Skipping ${symbol}. Error: ${String(err)}`])
        }
      })
    )

    progressCount += batch.length
    progress([30 + (progressCount / symbols.length) * 50])

    if (i + 10 < symbols.length) {
      await wait(200 * 4)
    }
  }
  console.log("Trades: ", allTrades)
  const transactionArrays = [allDeposits, allWithdrawals, allTrades]
  let blockNumber = 0

  progress([80, "Parsing all transactions"])
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
