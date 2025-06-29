import { countAuditLogs, getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import {
  countConnections,
  getConnections,
  resetConnection,
  syncConnection,
  upsertConnection,
} from "src/api/account/connections-api"
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

describe("should import 0xf98 via connection", () => {
  it.sequential("should add the connection", async () => {
    // arrange
    const address = "0xf98C96B5d10faAFc2324847c82305Bd5fd7E5ad3"
    // act
    connection = await upsertConnection(accountName, {
      address,
      extensionId: "etherscan-connection",
      platformId: "chain.ethereum",
    })
    // assert
    expect(connection.id).toMatchInlineSnapshot(`"2328608129"`)
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
      "0,Computing balances for 24 audit logs
      0,Processing logs 1 to 24
      90,Processed 1153 daily balances
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
      100,Saved 1211 records to disk"
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
      25,Processing 17 (EVM) transactions
      50,Saving 1 merged transactions
      70,Updating the audit logs of 1 merged transactions
      90,Deleting 2 deduplicated transactions
      100,Done"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`16`)
    await expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/0xf98/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`24`)
    await expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/0xf98/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`1211`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/0xf98/balances-${i}.ts.snap`
      )
    }
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
      "0,Removing 24 audit logs
      25,Setting balances cursor to Sep 08, 2017
      25,Setting networth cursor to Sep 08, 2017
      50,Removing 16 transactions"
    `)
    expect(remainingAuditLogs).toMatchInlineSnapshot(`0`)
    expect(remainingTransactions).toMatchInlineSnapshot(`0`)
    expect(remainingConnections).toMatchInlineSnapshot(`1`)
  })
})
