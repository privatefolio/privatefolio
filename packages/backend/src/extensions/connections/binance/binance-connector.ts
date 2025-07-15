import { extractTransactions, mergeAuditLogs } from "src/extensions/utils/binance-utils"
import {
  AuditLog,
  BinanceConnection,
  ParserResult,
  ProgressCallback,
  SyncResult,
  Timestamp,
} from "src/interfaces"
import { formatDate, ONE_DAY } from "src/utils/formatting-utils"
import { noop, paginate, paginateExact } from "src/utils/utils"

import { BinanceApi } from "./binance-api"
import { parseCoinFuturesIncome } from "./binance-future/binance-futures-COIN-income"
import { parseCoinFuturesTrade } from "./binance-future/binance-futures-COIN-trades"
import { parseUsdFuturesIncome } from "./binance-future/binance-futures-USD-income"
import { parseUsdFuturesTrade } from "./binance-future/binance-futures-USD-trades"
import { parseLoan, parseRepayment } from "./binance-margin/binance-margin-borrow-repay"
import { parseMarginTransfer } from "./binance-margin/binance-margin-transfer"
import { parseMarginLiquidation } from "./binance-margin/binance-margine-liquidation"
import {
  BINANCE_REWARD_TYPES,
  BINANCE_WALLETS,
  binanceConnExtension,
  FOUNDING_DATE,
} from "./binance-settings"
import { parseDeposit } from "./binance-spot/binance-deposit"
import { parseReward } from "./binance-spot/binance-rewards"
import { parseTrade } from "./binance-spot/binance-trades"
import { parseWithdraw } from "./binance-spot/binance-withdraw"

export const extensionId = binanceConnExtension

export async function syncBinance(
  progress: ProgressCallback = noop,
  connection: BinanceConnection,
  debugMode: boolean,
  since: Timestamp,
  until: Timestamp,
  signal?: AbortSignal
): Promise<SyncResult> {
  if (since < FOUNDING_DATE) {
    since = FOUNDING_DATE
  }

  const { wallets } = connection.options

  const binanceApi = new BinanceApi(connection.apiKey, connection.apiSecret)

  let results: ParserResult[] = []

  let symbols = connection.options?.symbols ?? []
  if (symbols.length === 0) {
    await progress([undefined, `Fetching trade pairs`])
    symbols = await binanceApi.getPairs()
    await progress([undefined, `Fetched ${symbols.length} symbols`])
  }
  if (wallets.spot) {
    await progress([undefined, `Fetching data for ${BINANCE_WALLETS.spot}`])
    await progress([undefined, `Fetching deposits`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getDeposits(start, end)
            .then((x) => x.map((row, index) => parseDeposit(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 90 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetching withdrawals`])
    results = results.concat(
      await paginate({
        cooldown: 1_000,
        fn: (start, end) =>
          binanceApi
            .getWithdrawals(start, end)
            .then((x) => x.map((row, index) => parseWithdraw(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 90 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetching trades`])
    results = results.concat(
      await paginateExact({
        cooldown: 1_000,
        count: symbols.length,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getTrades(symbols[symbolIndex], since, until)
          await progress([
            undefined,
            `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
          ])
          return records.map((row, index) =>
            parseTrade(row, index, connection, BINANCE_WALLETS.spot)
          )
        },
        progress,
        signal,
      })
    )
    await progress([undefined, `Fetching rewards`])
    for (const rewardType of BINANCE_REWARD_TYPES) {
      results = results.concat(
        await paginate({
          fn: (start, end) =>
            binanceApi
              .getFlexibleRewards(start, end, rewardType)
              .then((x) => x.map((row, index) => parseReward(row, index, connection))),
          progress,
          signal,
          since,
          until,
          window: 90 * ONE_DAY,
        })
      )
    }
    await progress([undefined, `Fetching locked rewards`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getLockedRewards(start, end)
            .then((x) => x.map((row, index) => parseReward(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 90 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetched data for ${BINANCE_WALLETS.spot}`])
  }
  if (wallets.crossMargin) {
    await progress([undefined, `Fetching data for ${BINANCE_WALLETS.crossMargin}`])
    await progress([undefined, `Fetching cross margin trades`])
    results = results.concat(
      await paginateExact({
        concurrency: 40,
        cooldown: 1_000,
        count: symbols.length,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getMarginTrades(
            symbols[symbolIndex],
            false,
            since,
            until
          )
          await progress([
            undefined,
            `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
          ])
          return records.map((row, index) =>
            parseTrade(row, index, connection, BINANCE_WALLETS.crossMargin)
          )
        },
        progress,
        signal,
      })
    )
    await progress([undefined, `Fetching cross margin loans`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getMarginLoansAndRepayments(start, end, "BORROW")
            .then((x) => x.map((row, index) => parseLoan(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 7 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetching cross margin repayments`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getMarginLoansAndRepayments(start, end, "REPAY")
            .then((x) => x.map((row, index) => parseRepayment(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 7 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetching cross margin transfers`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getMarginTransfers(start, end, false)
            .then((x) => x.map((row, index) => parseMarginTransfer(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 360 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetching cross margin liquidations`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getMarginLiquidation(start, end)
            .then((x) => x.map((row, index) => parseMarginLiquidation(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 360 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetched data for ${BINANCE_WALLETS.crossMargin}`])
  }
  if (wallets.isolatedMargin) {
    await progress([undefined, `Fetching data for ${BINANCE_WALLETS.isolatedMargin}`])
    await progress([undefined, `Fetching isolated margin trades`])
    results = results.concat(
      await paginateExact({
        count: symbols.length,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getMarginTrades(symbols[symbolIndex], true, since, until)
          await progress([
            undefined,
            `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
          ])
          return records.map((row, index) =>
            parseTrade(row, index, connection, BINANCE_WALLETS.isolatedMargin)
          )
        },
        progress,
        signal,
      })
    )
    await progress([undefined, `Fetching isolated margin loans`])
    results = results.concat(
      await paginateExact({
        concurrency: 40,
        cooldown: 1_000,
        count: symbols.length,
        fn: (symbolIndex) =>
          paginate({
            fn: async (start, end) => {
              const records = await binanceApi.getMarginLoansAndRepayments(
                start,
                end,
                "BORROW",
                symbols[symbolIndex].symbol
              )
              await progress([
                undefined,
                `Fetched ${records.length} records from ${formatDate(start)} - ${formatDate(end)} for ${symbols[symbolIndex].symbol}`,
              ])
              return records.map((row, index) => parseLoan(row, index, connection))
            },
            signal,
            since,
            until,
            window: 30 * ONE_DAY,
          }),
        progress,
        signal,
      })
    )
    await progress([undefined, `Fetching isolated margin repayments`])
    results = results.concat(
      await paginateExact({
        concurrency: 40,
        cooldown: 1_000,
        count: symbols.length,
        fn: (symbolIndex) =>
          paginate({
            fn: async (start, end) => {
              const records = await binanceApi.getMarginLoansAndRepayments(
                start,
                end,
                "REPAY",
                symbols[symbolIndex].symbol
              )
              await progress([
                undefined,
                `Fetched ${records.length} records from ${formatDate(start)} - ${formatDate(end)} for ${symbols[symbolIndex].symbol}`,
              ])
              return records.map((row, index) => parseRepayment(row, index, connection))
            },
            signal,
            since,
            until,
            window: 30 * ONE_DAY,
          }),
        progress,
        signal,
      })
    )
    await progress([undefined, `Fetching isolated margin transfers`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getMarginTransfers(start, end, true)
            .then((x) => x.map((row, index) => parseMarginTransfer(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 30 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetching isolated margin liquidations`])
    results = results.concat(
      await paginateExact({
        concurrency: 40,
        cooldown: 1_000,
        count: symbols.length,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getMarginLiquidation(
            since,
            until,
            symbols[symbolIndex].symbol
          )
          await progress([
            undefined,
            `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
          ])
          return records.map((row, index) =>
            parseMarginLiquidation(row, index, connection, symbols[symbolIndex])
          )
        },
        progress,
        signal,
      })
    )
  }
  if (wallets.coinFutures) {
    await progress([undefined, `Fetching data from ${BINANCE_WALLETS.coinFutures} wallet`])
    await progress([0, `Fetching Futures symbols`])
    const symbols = await binanceApi.getCoinFuturesSymbols()
    await progress([undefined, `Fetching COIN-M futures trades`])
    results = results.concat(
      await paginateExact({
        count: symbols.length,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getCoinFuturesTrades(symbols[symbolIndex], since, until)
          await progress([
            undefined,
            `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
          ])
          return records.map((row, index) => parseCoinFuturesTrade(row, index, connection))
        },
        progress,
        signal,
        // cooldown: 10_000,
        // window: 200 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetching COIN-M futures income`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getCoinFuturesIncome(start, end)
            .then((x) => x.map((row, index) => parseCoinFuturesIncome(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 200 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetched data from ${BINANCE_WALLETS.coinFutures} wallet`])
  }

  if (wallets.usdFutures) {
    await progress([undefined, `Fetching data from ${BINANCE_WALLETS.usdFutures} wallet`])
    await progress([0, `Fetching Futures symbols`])
    const symbols = await binanceApi.getUsdFuturesPairs()
    await progress([undefined, `Fetching USD-M futures trades`])
    results = results.concat(
      await paginateExact({
        count: symbols.length,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getUsdFuturesTrades(symbols[symbolIndex], since, until)
          await progress([
            undefined,
            `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
          ])
          return records.map((row, index) => parseUsdFuturesTrade(row, index, connection))
        },
        progress,
        signal,
        // cooldown: 1_250,
        // window: 7 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetching USD-M futures income`])
    results = results.concat(
      await paginate({
        fn: (start, end) =>
          binanceApi
            .getUsdFuturesIncome(start, end)
            .then((x) => x.map((row, index) => parseUsdFuturesIncome(row, index, connection))),
        progress,
        signal,
        since,
        until,
        window: 7 * ONE_DAY,
      })
    )
    await progress([undefined, `Fetched data from ${BINANCE_WALLETS.usdFutures} wallet`])
  }

  const result: SyncResult = {
    assetMap: {},
    logMap: {},
    newCursor: since,
    operationMap: {},
    rows: 0,
    txMap: {},
    walletMap: {},
  }

  // TODO9
  let allLogs: AuditLog[] = []
  let rows = 0

  await progress([98, "Computing metadata"])
  for (let i = 0; i < results.length; i++) {
    const { logs, txns } = results[i]

    for (const log of logs) {
      rows += 1
      result.assetMap[log.assetId] = true
      result.walletMap[log.wallet] = true
      result.operationMap[log.operation] = true
      allLogs.push(log)
    }
  }
  result.rows = rows

  allLogs = mergeAuditLogs(allLogs, connection.id)
  for (const log of allLogs) {
    result.logMap[log.id] = log
  }
  const transactions = extractTransactions(allLogs, connection.id)

  for (const transaction of transactions) {
    result.txMap[transaction.id] = transaction
  }

  result.newCursor = until + 1
  return result
}
