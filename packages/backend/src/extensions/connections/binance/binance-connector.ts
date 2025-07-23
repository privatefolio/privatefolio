import { getValue, setValue } from "src/api/account/kv-api"
import { AuthSecrets, readSecrets } from "src/api/auth-http-api"
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
import { decryptValue } from "src/utils/jwt-utils"
import { noop, paginate, paginateExact } from "src/utils/utils"

import { BinanceApi } from "./binance-api"
import { parseCoinFuturesIncome } from "./binance-future/binance-futures-COIN-income"
import { parseCoinFuturesTrade } from "./binance-future/binance-futures-COIN-trades"
import { parseUsdFuturesIncome } from "./binance-future/binance-futures-USD-income"
import { parseUsdFuturesTrade } from "./binance-future/binance-futures-USD-trades"
import { parseLoan, parseRepayment } from "./binance-margin/binance-margin-borrow-repay"
import { parseMarginLiquidation } from "./binance-margin/binance-margin-liquidation"
import { parseMarginTransfer } from "./binance-margin/binance-margin-transfer"
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

const SLOW_DOWN_FACTOR = 2

export async function syncBinance(
  accountName: string,
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

  const totalWallets = Object.keys(BINANCE_WALLETS).filter((x) => wallets[x]).length
  if (totalWallets === 0) throw new Error("No wallets enabled for sync")

  const SETUP_PROGRESS = 10 // 0-10% for setup
  const WALLET_PROGRESS_RANGE = 80 // 10-90% for wallets (80% total)

  const progressPerWallet = WALLET_PROGRESS_RANGE / totalWallets

  let currentWalletIndex = 0
  const getWalletProgressStart = (walletIndex: number) =>
    SETUP_PROGRESS + walletIndex * progressPerWallet

  const apiSecretEncrypted = await getValue<string | null>(
    accountName,
    `connection_api_secret_${connection.id}`
  )
  if (!apiSecretEncrypted) {
    throw new Error("Binance API secret not found for this connection")
  }

  const { jwtSecret } = (await readSecrets()) as AuthSecrets
  const apiSecret = await decryptValue(apiSecretEncrypted, jwtSecret)
  if (!apiSecret) {
    throw new Error("Failed to decrypt Binance API secret")
  }

  const binanceApi = new BinanceApi(connection.apiKey, apiSecret)

  await progress([2, `Checking API key permissions`])
  await binanceApi.getAccount()
  try {
    await binanceApi.ensureReadOnlyPermissions()
  } catch (error) {
    await progress([4, `API key permissions are bad, deleting secret`])
    await setValue(accountName, `connection_api_secret_${connection.id}`, null)
    await progress([6, `API secret deleted`])
    throw error
  }
  await progress([8, `API key permissions are good`])

  let results: ParserResult[] = []

  let symbols = connection.options?.symbols ?? []
  if (symbols.length === 0) {
    await progress([9, `Fetching trade pairs`])
    symbols = await binanceApi.getPairs()
    await progress([SETUP_PROGRESS, `Fetched ${symbols.length} trade pairs`])
  }

  if (wallets.spot) {
    const startProgress = getWalletProgressStart(currentWalletIndex)

    await progress([startProgress + progressPerWallet * 0.1, `Fetching deposits`])
    results = results.concat(
      await paginate({
        debugMode,
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
    await progress([startProgress + progressPerWallet * 0.3, `Fetching withdrawals`])
    results = results.concat(
      await paginate({
        cooldown: 1_000,
        debugMode,
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
    await progress([startProgress + progressPerWallet * 0.5, `Fetching trades`])
    results = results.concat(
      await paginateExact({
        concurrency: 10,
        cooldown: SLOW_DOWN_FACTOR * 200 * 10,
        count: symbols.length,
        debugMode,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getTrades(symbols[symbolIndex], since, until)
          if (debugMode) {
            await progress([
              undefined,
              `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
            ])
          }
          return records.map((row, index) =>
            parseTrade(row, index, connection, BINANCE_WALLETS.spot)
          )
        },
        progress,
        signal,
      })
    )
    await progress([startProgress + progressPerWallet * 0.8, `Fetching rewards (3 types)`])
    for (const rewardType of BINANCE_REWARD_TYPES) {
      results = results.concat(
        await paginate({
          debugMode,
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
    await progress([startProgress + progressPerWallet * 0.9, `Fetching locked rewards`])
    results = results.concat(
      await paginate({
        debugMode,
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
    currentWalletIndex++
  }

  if (wallets.crossMargin) {
    const startProgress = getWalletProgressStart(currentWalletIndex)

    await progress([startProgress + progressPerWallet * 0.1, `Fetching cross margin trades`])
    results = results.concat(
      await paginateExact({
        concurrency: 40,
        cooldown: SLOW_DOWN_FACTOR * 50 * 40,
        count: symbols.length,
        debugMode,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getMarginTrades(
            symbols[symbolIndex],
            false,
            since,
            until
          )
          if (debugMode) {
            await progress([
              undefined,
              `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
            ])
          }
          return records.map((row, index) =>
            parseTrade(row, index, connection, BINANCE_WALLETS.crossMargin)
          )
        },
        progress,
        signal,
      })
    )
    await progress([startProgress + progressPerWallet * 0.3, `Fetching cross margin loans`])
    results = results.concat(
      await paginate({
        concurrency: 10,
        cooldown: SLOW_DOWN_FACTOR * 50 * 10,
        debugMode,
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
    await progress([startProgress + progressPerWallet * 0.5, `Fetching cross margin repayments`])
    results = results.concat(
      await paginate({
        concurrency: 10,
        cooldown: SLOW_DOWN_FACTOR * 50 * 10,
        debugMode,
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
    await progress([startProgress + progressPerWallet * 0.7, `Fetching cross margin transfers`])
    results = results.concat(
      await paginate({
        concurrency: 10,
        debugMode,
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
    await progress([startProgress + progressPerWallet * 0.9, `Fetching cross margin liquidations`])
    results = results.concat(
      await paginate({
        concurrency: 10,
        debugMode,
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
    currentWalletIndex++
  }

  if (wallets.isolatedMargin) {
    const startProgress = getWalletProgressStart(currentWalletIndex)

    await progress([startProgress + progressPerWallet * 0.1, `Fetching isolated margin trades`])
    results = results.concat(
      await paginateExact({
        concurrency: 40,
        cooldown: SLOW_DOWN_FACTOR * 50 * 40,
        count: symbols.length,
        debugMode,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getMarginTrades(symbols[symbolIndex], true, since, until)
          if (debugMode) {
            await progress([
              undefined,
              `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
            ])
          }
          return records.map((row, index) =>
            parseTrade(row, index, connection, BINANCE_WALLETS.isolatedMargin)
          )
        },
        progress,
        signal,
      })
    )
    await progress([startProgress + progressPerWallet * 0.25, `Fetching isolated margin loans`])
    results = results.concat(
      await paginateExact({
        concurrency: 1,
        cooldown: SLOW_DOWN_FACTOR * 50,
        count: symbols.length,
        debugMode,
        fn: (symbolIndex) =>
          paginate({
            concurrency: 10,
            cooldown: SLOW_DOWN_FACTOR * 50 * 10,
            fn: async (start, end) => {
              const records = await binanceApi.getMarginLoansAndRepayments(
                start,
                end,
                "BORROW",
                symbols[symbolIndex].symbol
              )
              if (debugMode) {
                await progress([
                  undefined,
                  `Fetched ${records.length} records from ${formatDate(start)} - ${formatDate(end)} for ${symbols[symbolIndex].symbol}`,
                ])
              }
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
    await progress([
      startProgress + progressPerWallet * 0.45,
      `Fetching isolated margin repayments`,
    ])
    results = results.concat(
      await paginateExact({
        concurrency: 1,
        cooldown: SLOW_DOWN_FACTOR * 50,
        count: symbols.length,
        debugMode,
        fn: (symbolIndex) =>
          paginate({
            concurrency: 10,
            cooldown: SLOW_DOWN_FACTOR * 50 * 10,
            fn: async (start, end) => {
              const records = await binanceApi.getMarginLoansAndRepayments(
                start,
                end,
                "REPAY",
                symbols[symbolIndex].symbol
              )
              if (debugMode) {
                await progress([
                  undefined,
                  `Fetched ${records.length} records from ${formatDate(start)} - ${formatDate(end)} for ${symbols[symbolIndex].symbol}`,
                ])
              }
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
    await progress([startProgress + progressPerWallet * 0.65, `Fetching isolated margin transfers`])
    results = results.concat(
      await paginate({
        debugMode,
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
    await progress([
      startProgress + progressPerWallet * 0.8,
      `Fetching isolated margin liquidations`,
    ])
    results = results.concat(
      await paginateExact({
        concurrency: 40,
        cooldown: SLOW_DOWN_FACTOR * 5 * 40,
        count: symbols.length,
        debugMode,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getMarginLiquidation(
            since,
            until,
            symbols[symbolIndex].symbol
          )
          if (debugMode) {
            await progress([
              undefined,
              `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
            ])
          }
          return records.map((row, index) =>
            parseMarginLiquidation(row, index, connection, symbols[symbolIndex])
          )
        },
        progress,
        signal,
      })
    )
    currentWalletIndex++
  }

  if (wallets.coinFutures) {
    const startProgress = getWalletProgressStart(currentWalletIndex)

    await progress([startProgress + progressPerWallet * 0.1, `Fetching Futures symbols`])
    const symbols = await binanceApi.getCoinFuturesSymbols()
    await progress([startProgress + progressPerWallet * 0.2, `Fetching COIN-M futures trades`])
    results = results.concat(
      await paginateExact({
        concurrency: 5,
        cooldown: SLOW_DOWN_FACTOR * 125 * 5,
        count: symbols.length,
        debugMode,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getCoinFuturesTrades(symbols[symbolIndex], since, until)
          if (debugMode) {
            await progress([
              undefined,
              `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
            ])
          }
          return records.map((row, index) => parseCoinFuturesTrade(row, index, connection))
        },
        progress,
        signal,
        // cooldown: 10_000,
        // window: 200 * ONE_DAY,
      })
    )
    await progress([startProgress + progressPerWallet * 0.7, `Fetching COIN-M futures income`])
    results = results.concat(
      await paginate({
        debugMode,
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
    currentWalletIndex++
  }

  if (wallets.usdFutures) {
    const startProgress = getWalletProgressStart(currentWalletIndex)

    await progress([startProgress + progressPerWallet * 0.1, `Fetching Futures symbols`])
    const symbols = await binanceApi.getUsdFuturesPairs()
    await progress([startProgress + progressPerWallet * 0.2, `Fetching USD-M futures trades`])
    results = results.concat(
      await paginateExact({
        concurrency: 5,
        cooldown: SLOW_DOWN_FACTOR * 2000 * 5,
        count: symbols.length,
        debugMode,
        fn: async (symbolIndex) => {
          const records = await binanceApi.getUsdFuturesTrades(symbols[symbolIndex], since, until)
          if (debugMode) {
            await progress([
              undefined,
              `Fetched ${records.length} records from ${formatDate(since)} - ${formatDate(until)} for ${symbols[symbolIndex].symbol}`,
            ])
          }
          return records.map((row, index) => parseUsdFuturesTrade(row, index, connection))
        },
        progress,
        signal,
        // cooldown: 1_250,
        // window: 7 * ONE_DAY,
      })
    )
    await progress([startProgress + progressPerWallet * 0.7, `Fetching USD-M futures income`])
    results = results.concat(
      await paginate({
        debugMode,
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
    currentWalletIndex++
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

  let allLogs: AuditLog[] = []
  let rows = 0

  await progress([92, "Computing portfolio changes"])
  for (let i = 0; i < results.length; i++) {
    // TODO5
    const { logs, txns: _txns } = results[i]

    for (const log of logs) {
      rows += 1
      result.assetMap[log.assetId] = true
      result.walletMap[log.wallet] = true
      result.operationMap[log.operation] = true
      allLogs.push(log)
    }
  }
  result.rows = rows

  allLogs = mergeAuditLogs(allLogs, connection.id, connection.platformId)
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
