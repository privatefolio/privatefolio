import Big from "big.js"
import { getErc20Balance, getNativeBalance } from "src/extensions/utils/evm-utils"
import { EventCause, ResolutionString, SqlParam } from "src/interfaces"
import { PLATFORMS_META } from "src/settings/platforms"
import { getAssetContract, getAssetPlatform, isEvmPlatform } from "src/utils/assets-utils"
import { formatDate, ONE_DAY } from "src/utils/formatting-utils"
import { floorTimestamp, noop } from "src/utils/utils"

import {
  Balance,
  BalanceMap,
  ProgressCallback,
  SubscriptionChannel,
  TaskPriority,
  TaskTrigger,
  Timestamp,
} from "../../interfaces"
import { DB_OPERATION_PAGE_SIZE } from "../../settings/settings"
import { getAccount } from "../accounts-api"
import { getMyAssets } from "./assets-api"
import { countAuditLogs, getAuditLogOrderQuery, getAuditLogs, getWallets } from "./audit-logs-api"
import { getPricesForAsset } from "./daily-prices-api"
import { getValue, setValue } from "./kv-api"
import { getPlatform } from "./platforms-api"
import { enqueueTask } from "./server-tasks-api"

export async function getBalances(
  accountName: string,
  query = "SELECT * FROM balances ORDER BY timestamp ASC",
  params?: SqlParam[]
): Promise<BalanceMap[]> {
  const account = await getAccount(accountName)

  try {
    const result = await account.execute(query, params)
    return result.map((row) => {
      const value: BalanceMap = JSON.parse(row[1] as string)
      value.timestamp = row[0] as Timestamp
      return value
    })
  } catch (error) {
    throw new Error(`Failed to query balances: ${error}`)
  }
}

export async function invalidateBalances(accountName: string, newValue: Timestamp) {
  const existing = (await getValue<Timestamp>(accountName, "balancesCursor", 0)) as Timestamp

  if (newValue < existing) {
    await setValue(accountName, "balancesCursor", newValue)
  }
}

export async function getBalancesAt(
  accountName: string,
  cursor: Timestamp = -1
): Promise<Balance[]> {
  const account = await getAccount(accountName)
  let balancesCursor =
    cursor !== -1
      ? cursor
      : ((await getValue<Timestamp>(accountName, "balancesCursor", 0)) as Timestamp)

  balancesCursor = floorTimestamp(balancesCursor, "1D" as ResolutionString)

  try {
    const result = await account.execute("SELECT * FROM balances WHERE timestamp = ?", [
      balancesCursor,
    ])
    const [timestamp, data] = result[0]
    const map = JSON.parse(data as string) as BalanceMap
    const balanceDocs = Object.keys(map).map((x) => ({ assetId: x, balance: map[x] }))

    const balances = await Promise.all(
      balanceDocs.map(async (x) => {
        const prices = await getPricesForAsset(accountName, x.assetId, timestamp as number)
        const price = prices.length > 0 ? prices[0] : undefined

        return {
          assetId: x.assetId,
          balance: x.balance as string,
          balanceN: Number(x.balance),
          id: `${timestamp as number}_${x.assetId}`,
          price,
          value: price ? price.value * Number(x.balance) : undefined,
        }
      })
    )

    return balances
  } catch (error) {
    return []
  }
}

export type GetHistoricalBalancesRequest = {
  limit?: number
  order?: "asc" | "desc"
  skip?: number
  symbol?: string
}

export type ComputeBalancesRequest = {
  pageSize?: number
  since?: Timestamp
  until?: Timestamp
}

export async function computeBalances(
  accountName: string,
  request: ComputeBalancesRequest = {},
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  const { pageSize = DB_OPERATION_PAGE_SIZE, until = Date.now() } = request
  let { since } = request

  // TODO8 skip assets tagged as spam

  const account = await getAccount(accountName)
  if (since === undefined) {
    since = (await getValue<Timestamp>(accountName, "balancesCursor", 0)) as Timestamp
  }

  if (since !== 0) {
    await progress([0, `Refreshing balances starting ${formatDate(since)}`])
  }

  const count =
    since === 0
      ? await countAuditLogs(accountName)
      : await countAuditLogs(accountName, "SELECT COUNT(*) FROM audit_logs WHERE timestamp >= ?", [
          since,
        ])
  await progress([0, `Computing balances for ${count} audit logs`])

  const orderQueryAsc = await getAuditLogOrderQuery(true)
  const orderQueryDesc = await getAuditLogOrderQuery()

  let recordsLength = 0
  let latestBalances: Omit<BalanceMap, "timestamp"> = {}
  const walletBalances: Record<string, Record<string, string>> = {} // wallet -> assetId -> balance

  let genesisDay: Timestamp = -1

  if (since !== 0) {
    try {
      const result = await account.execute("SELECT data FROM balances WHERE timestamp = ?", [
        since - 86400000,
      ])
      const data = result[0][0]
      latestBalances = typeof data === "string" ? JSON.parse(data) : latestBalances

      // initialize walletBalances; going through each balance and each wallet
      const wallets = await getWallets(accountName)
      for (const balance of Object.keys(latestBalances)) {
        for (const wallet of wallets) {
          const [latestLog] = await getAuditLogs(
            accountName,
            `SELECT * FROM audit_logs WHERE wallet = ? AND assetId = ? AND timestamp <= ? ${orderQueryDesc} LIMIT 1`,
            [wallet, balance, since]
          )
          if (!walletBalances[wallet]) {
            walletBalances[wallet] = {}
          }
          walletBalances[wallet][balance] = latestLog?.balanceWallet || "0"
        }
      }
    } catch {
      // ignore
    }
  } else {
    genesisDay = 0
  }

  let historicalBalances: Record<number, Omit<BalanceMap, "timestamp">> = {}

  let latestDay: Timestamp = 0

  for (let i = 0; i < count; i += pageSize) {
    if (signal?.aborted) throw new Error(signal.reason)

    const firstIndex = i + 1
    const lastIndex = Math.min(i + pageSize, count)

    await progress([Math.floor((i * 90) / count), `Processing logs ${firstIndex} to ${lastIndex}`])
    const logs = await getAuditLogs(
      accountName,
      `SELECT * FROM audit_logs WHERE timestamp >= ? ${orderQueryAsc} LIMIT ? OFFSET ?`,
      [since, pageSize, i]
    )

    for (const log of logs) {
      const { assetId, change, timestamp, wallet } = log

      if (genesisDay === 0) {
        genesisDay = floorTimestamp(timestamp, "1D" as ResolutionString)
      }

      const nextDay: Timestamp = floorTimestamp(timestamp, "1D" as ResolutionString)

      // fill the daily gaps
      if (latestDay !== 0) {
        const daysDiff = (nextDay - latestDay) / 86400000
        if (daysDiff > 1) {
          for (let i = 1; i < daysDiff; i++) {
            const gapDay = latestDay + i * 86400000
            historicalBalances[gapDay] = Object.assign({}, latestBalances)
          }
        }
      }

      // Initialize wallet balances if needed
      if (!walletBalances[wallet]) {
        walletBalances[wallet] = {}
      }

      // Update per-wallet balance
      if (!walletBalances[wallet][assetId]) {
        walletBalances[wallet][assetId] = change
      } else {
        walletBalances[wallet][assetId] = new Big(walletBalances[wallet][assetId])
          .plus(new Big(change))
          .toFixed()
      }

      // Update cumulative balance (for historical balances table)
      if (!latestBalances[assetId]) {
        latestBalances[assetId] = change
      } else {
        latestBalances[assetId] = new Big(latestBalances[assetId]).plus(new Big(change)).toFixed()
      }

      // Update audit log
      log.balance = latestBalances[assetId] as string
      log.balanceWallet = walletBalances[wallet][assetId] as string

      // Remove zero wallet balances
      if (walletBalances[wallet][assetId] === "0") {
        delete walletBalances[wallet][assetId]
      }

      // remove zero balances from cumulative
      if (latestBalances[assetId] === "0") {
        delete latestBalances[assetId]
      }

      // update historical balances
      if (!historicalBalances[nextDay]) {
        historicalBalances[nextDay] = Object.assign({}, latestBalances)
      } else if (latestBalances[assetId] !== "0") {
        historicalBalances[nextDay][assetId] = latestBalances[assetId]
      }

      latestDay = nextDay
    }

    await account.executeMany(
      "UPDATE audit_logs SET balance = ?, balanceWallet = ? WHERE id = ?",
      logs.map((log) => [log.balance as string, log.balanceWallet as string, log.id])
    )
    account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Updated)

    const balanceIds = Object.keys(historicalBalances)

    recordsLength += balanceIds.length
    await account.executeMany(
      "INSERT OR REPLACE INTO balances (timestamp, data) VALUES (?, ?)",
      // eslint-disable-next-line no-loop-func
      balanceIds.map((timestamp) => [timestamp, JSON.stringify(historicalBalances[timestamp])])
    )

    await progress([
      Math.floor((Math.min(i + pageSize, count) * 90) / count),
      `Processed ${balanceIds.length} daily balances`,
    ])

    // free memory
    historicalBalances = {}
  }

  if (latestDay === 0 && since === 0) {
    await account.execute("DELETE FROM balances")
    return
  }
  if (latestDay === 0) latestDay = since

  await progress([96, `Filling balances to reach today`])
  for (let i = latestDay + 86400000; i <= until; i += 86400000) {
    historicalBalances[i] = latestBalances
    latestDay = i
  }

  // filling the day before the genesis day
  if (genesisDay > 0) {
    historicalBalances[genesisDay - ONE_DAY] = {}
  }

  if (Object.keys(historicalBalances).length > 0) {
    const balanceIds = Object.keys(historicalBalances)
    await account.executeMany(
      "INSERT OR REPLACE INTO balances (timestamp, data) VALUES (?, ?)",
      balanceIds.map((timestamp) => [
        Number(timestamp),
        JSON.stringify(historicalBalances[timestamp]),
      ])
    )
    recordsLength += balanceIds.length
  }

  await progress([99, `Setting balances cursor to ${formatDate(latestDay)}`])
  await setValue(accountName, "balancesCursor", latestDay)
  await progress([100, `Saved ${recordsLength} records to disk`])
}

export function enqueueRecomputeBalances(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Recomputing balances of owned assets.",
    determinate: true,
    function: async (progress, signal) => {
      await computeBalances(accountName, { since: 0 }, progress, signal)
    },
    name: "Recompute balances",
    priority: TaskPriority.Medium,
    trigger,
  })
}

export function enqueueRefreshBalances(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Refreshing balances of owned assets.",
    determinate: true,
    function: async (progress, signal) => {
      await computeBalances(accountName, undefined, progress, signal)
    },
    name: "Refresh balances",
    priority: TaskPriority.Medium,
    trigger,
  })
}

export async function deleteBalances(accountName: string) {
  const account = await getAccount(accountName)
  await account.execute("DELETE FROM balances")
  await account.execute("UPDATE audit_logs SET balance=null, balanceWallet=null")
  account.eventEmitter.emit(SubscriptionChannel.AuditLogs, EventCause.Updated)
  account.eventEmitter.emit(SubscriptionChannel.Balances)
}

export function enqueueDeleteBalances(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Deleting all balances.",
    determinate: true,
    function: async () => {
      await deleteBalances(accountName)
    },
    name: "Delete balances",
    priority: TaskPriority.Low,
    trigger,
  })
}

/**
 * Checks on-chain balances for all wallets/assets and compares to stored balances.
 * Returns a list of discrepancies: { wallet, assetId, onChain, stored }
 */
export async function verifyBalances(
  accountName: string,
  progress: ProgressCallback = noop,
  signal?: AbortSignal
) {
  await progress([0, "Loading wallets and assets"])
  const wallets = await getWallets(accountName)
  const assets = await getMyAssets(accountName)

  if (signal?.aborted) throw new Error(signal.reason)

  // Filter to only EVM assets with coingeckoId
  const evmAssets = assets.filter((asset) => {
    if (!asset.coingeckoId) return false
    const platform = getAssetPlatform(asset.id)
    return platform && isEvmPlatform(platform) && PLATFORMS_META[platform]?.chainId
  })

  const totalChecks = wallets.length * evmAssets.length
  await progress([5, `Checking ${totalChecks} wallet/asset combinations`])

  const discrepancies: Array<{
    assetId: string
    onChain: string
    platform: string
    stored: string | undefined
    wallet: string
  }> = []

  let currentCheck = 0
  const orderQuery = await getAuditLogOrderQuery()

  for (const wallet of wallets) {
    for (const asset of evmAssets) {
      if (signal?.aborted) throw new Error(signal.reason)

      currentCheck++
      const progressPercent = 5 + Math.floor((currentCheck * 85) / totalChecks)

      if (currentCheck % 10 === 0) {
        await progress([
          progressPercent,
          // `Checking ${asset.symbol || asset.id} balance for wallet ${wallet} (${currentCheck}/${totalChecks})`,
        ])
      }

      const assetId = asset.id
      const platformId = getAssetPlatform(assetId)
      const platform = await getPlatform(platformId)
      const meta = PLATFORMS_META[platformId]
      const contract = getAssetContract(assetId)
      let onChain: string | undefined

      try {
        if (contract === "0x0000000000000000000000000000000000000000") {
          // Native asset
          onChain = await getNativeBalance(wallet, meta.chainId)
        } else {
          // ERC-20
          const { balance } = await getErc20Balance(contract, wallet, meta.chainId)
          onChain = balance
        }
      } catch (error) {
        await progress([
          progressPercent,
          `Error fetching ${asset.symbol || asset.id} for ${wallet}: ${error instanceof Error ? error.message : error}`,
        ])
        continue
      }

      // Get the latest balance for this wallet/asset combination
      const [latestLog] = await getAuditLogs(
        accountName,
        `SELECT * FROM audit_logs WHERE wallet = ? AND assetId = ? ${orderQuery} LIMIT 1`,
        [wallet, assetId]
      )
      if (!latestLog) continue
      if (latestLog && !latestLog.balanceWallet) {
        throw new Error(`No balance found on audit log. Did you forget to call "computeBalances"?`)
      }
      const stored = latestLog.balanceWallet

      const onChainBig = onChain ? new Big(onChain) : new Big(0)
      const storedBig = stored ? new Big(stored) : new Big(0)

      const difference = onChainBig.minus(storedBig)

      if (difference.gt(0) || difference.lt(0)) {
        const onChainStr = onChainBig.toFixed()
        const storedStr = storedBig.toFixed()
        const diffStr = difference.toFixed()

        const gravity = difference.lt(0) ? "Error" : "Warning"

        await progress([
          progressPercent,
          `${gravity}: ${platform.name} wallet ${wallet} has a mismatch of ${asset.symbol || asset.id}: expected ${storedStr} but got ${onChainStr} (diff: ${diffStr})`,
        ])

        discrepancies.push({
          assetId,
          onChain: onChainStr,
          platform: platformId,
          stored: storedStr,
          wallet,
        })
      }
    }
  }

  await progress([undefined, `Found ${discrepancies.length} balance discrepancies`])
  await progress([100, `Verification complete - ${discrepancies.length} discrepancies found`])
  return discrepancies
}

export function enqueueVerifyBalances(accountName: string, trigger: TaskTrigger) {
  return enqueueTask(accountName, {
    description: "Verifying balances of owned assets.",
    determinate: true,
    function: async (progress, signal) => {
      await verifyBalances(accountName, progress, signal)
    },
    name: "Verify balances",
    priority: TaskPriority.Low,
    trigger,
  })
}
