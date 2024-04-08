import { BinanceConnection, SyncResult } from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"
import { noop } from "src/utils/utils"

import {
  BinanceTrade,
  getBinanceDeposit,
  getBinanceSymbols,
  getBinanceTradesForSymbol,
  getBinanceWithdraw,
} from "./binance-account-api"
import { parseDeposit } from "./binance-deposit"
import { parseTrade } from "./binance-trades"
import { parseWithdraw } from "./binance-withdraw"

// const parserList = [parseDeposit, parseWithdraw]
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
  const deposit = await getBinanceDeposit(connection)
  progress([10, `Fetching withdrawals`])
  const withdraw = await getBinanceWithdraw(connection)
  progress([20, `Fetching symbols`])
  const symbols = await getBinanceSymbols(connection)
  progress([30, `Fetched ${symbols.length} symbols`])
  let trades: BinanceTrade[] = []

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]
    if (signal?.aborted) {
      throw new Error(signal.reason)
    }
    try {
      progress([(30 / symbols.length) * i + 30, `Fetching trade history for ${symbol}`])
      const x = await getBinanceTradesForSymbol(connection, symbol)
      trades = trades.concat(x)
    } catch (err) {
      progress([undefined, `Skipping ${symbol}. Error: ${String(err)}`])
    }
  }

  console.log("Trades: ", trades)

  // const transactionArrays = [deposit, withdraw]
  const transactionArrays = [deposit, withdraw, trades]
  let blockNumber = 0

  progress([50, "Parsing all transactions"])
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
  return result
}
