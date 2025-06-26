import { countAuditLogs, getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import {
  countConnections,
  getConnections,
  resetConnection,
  syncConnection,
  upsertConnection,
} from "src/api/account/connections-api"
import { fetchDailyPrices } from "src/api/account/daily-prices-api"
import { computeNetworth, getNetworth } from "src/api/account/networth-api"
import {
  computeTrades,
  getAccountPnL,
  getTradePnL,
  getTrades,
  getTradesFullQuery,
} from "src/api/account/trades-api"
import {
  autoMergeTransactions,
  countTransactions,
  getTransactions,
} from "src/api/account/transactions-api"
import { Connection, ProgressUpdate } from "src/interfaces"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { describe, expect, it } from "vitest"

const accountName = Math.random().toString(36).substring(7)

let connection: Connection

describe("should import 0xb6e via connection", () => {
  it.sequential("should add the connection", async () => {
    // arrange
    const address = "0xB6e32891033D8578ebC79Dd8D202310bF6b7FEcC"
    // act
    connection = await upsertConnection(accountName, {
      address,
      extensionId: "etherscan-connection",
      platformId: "arbitrum-one",
    })
    // assert
    expect(connection.id).toMatchInlineSnapshot(`"2662444559"`)
  })

  it.sequential("should sync connection", async () => {
    // act
    await syncConnection(undefined, connection.id, accountName, false)
    // assert
  })

  it.sequential("should compute balances", async () => {
    // arrange
    const until = Date.UTC(2021, 0, 0, 0, 0, 0, 0) // 1 Jan 2021
    // act
    const updates: ProgressUpdate[] = []
    await computeBalances(accountName, { until }, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 166 audit logs
      0,Processing logs 1 to 166
      90,Processed 432 daily balances
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
      100,Saved 433 records to disk"
    `)
  })

  it.sequential("should merge transactions", async () => {
    // arrange
    const updates: ProgressUpdate[] = []
    // act
    await autoMergeTransactions(accountName, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching all transactions
      25,Processing 166 (EVM) transactions
      50,Saving 3 merged transactions
      70,Updating the audit logs of 3 merged transactions
      90,Deleting 7 deduplicated transactions
      100,Done"
    `)
  })

  it.sequential("should fetch daily prices", async () => {
    await fetchDailyPrices(accountName, undefined, undefined, undefined, { until: 1749859200000 })
  })

  it.sequential("should compute networth", async () => {
    // act
    const updates: ProgressUpdate[] = []
    await computeNetworth(accountName, undefined, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "5,Computing networth for 433 days
      10,Computing networth starting Mar 03, 2024
      61.96304849884527,Computing networth starting Nov 08, 2024
      95,Saving 433 records to the database
      99,Setting networth cursor to May 09, 2025"
    `)
  })

  it.sequential("should compute trades", async () => {
    // act
    const updates: ProgressUpdate[] = []
    await computeTrades(accountName, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching audit logs
      10,Processing 166 audit logs
      ,Skipped arbitrum-one:0xfAf87e196A29969094bE35DfB0Ab9d0b8518dB84:ACHIVX: No coingeckoId
      ,Skipped arbitrum-one:0xdf109e2b175038c66e074BfEacF37D7b0f3e426c:MaticSlot: No coingeckoId
      20,Found 4 asset groups
      35,Processed 1/4 asset groups
      50,Processed 2/4 asset groups
      65,Processed 3/4 asset groups
      80,Processed 4/4 asset groups
      80,Setting trades cursor to Nov 26, 2024
      80,Trades computation completed
      82,Processing 6 trades
      84,Processed 1/6 trades
      87,Processed 2/6 trades
      90,Processed 3/6 trades
      92,Processed 4/6 trades
      95,Processed 5/6 trades
      98,Processed 6/6 trades
      98,Setting profit & loss cursor to Jun 14, 2025
      100,PnL computation completed"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    const networth = await getNetworth(accountName)
    const trades = await getTrades(accountName, await getTradesFullQuery())
    trades.sort((a, b) => a.createdAt - b.createdAt)
    const tradesPnl = await Promise.all(
      trades.map(async (trade) => getTradePnL(accountName, trade.id))
    )
    const accountPnl = await getAccountPnL(accountName)
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`162`)
    await expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/0xb6e/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`166`)
    await expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/0xb6e/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`433`)
    await expect(balances).toMatchFileSnapshot(`../__snapshots__/0xb6e/balances.ts.snap`)
    expect(networth.length).toMatchInlineSnapshot(`433`)
    await expect(networth).toMatchFileSnapshot(`../__snapshots__/0xb6e/networth.ts.snap`)
    expect(trades.length).toMatchInlineSnapshot(`6`)
    await expect(trades).toMatchFileSnapshot(`../__snapshots__/0xb6e/trades.ts.snap`)
    expect(tradesPnl.length).toMatchInlineSnapshot(`6`)
    for (let i = 0; i < tradesPnl.length; i += 1) {
      await expect(tradesPnl[i]).toMatchFileSnapshot(
        `../__snapshots__/0xb6e/trades-pnl-${i + 1}.ts.snap`
      )
    }
    expect(accountPnl.length).toMatchInlineSnapshot(`469`)
    await expect(accountPnl).toMatchFileSnapshot(`../__snapshots__/0xb6e/account-pnl.ts.snap`)
  })

  it.sequential("should delete the connection", async () => {
    // arrange
    const connections = await getConnections(accountName)
    const updates: ProgressUpdate[] = []
    // act
    for (const connection of connections) {
      await resetConnection(accountName, connection.id, async (state) => updates.push(state))
    }
    // assert
    const remainingAuditLogs = await countAuditLogs(accountName)
    const remainingTransactions = await countTransactions(accountName)
    const remainingConnections = await countConnections(accountName)
    //
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Removing 166 audit logs
      50,Removing 162 transactions"
    `)
    expect(remainingAuditLogs).toMatchInlineSnapshot(`0`)
    expect(remainingTransactions).toMatchInlineSnapshot(`0`)
    expect(remainingConnections).toMatchInlineSnapshot(`1`)
  })
})
