import { countAuditLogs, getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import {
  countConnections,
  deleteConnection,
  getConnections,
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

describe("should import 0x003dc via connection", () => {
  it.sequential("should add the connection", async () => {
    // arrange
    const address = "0x003dc32fe920a4aaeed12dc87e145f030aa753f3"
    // act
    connection = await upsertConnection(accountName, {
      address,
      extensionId: "etherscan-connection",
      label: "",
      platform: "ethereum",
    })
    // assert
    expect(connection.id).toMatchInlineSnapshot(`"3641303814"`)
  })

  it.sequential("should sync connection", async () => {
    // arrange
    const updates: ProgressUpdate[] = []
    // act
    await syncConnection(
      async (state) => updates.push(state),
      connection.id,
      accountName,
      false,
      undefined,
      "16727786" // until
    )
    // assert
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Starting from block number 0
      0,Fetching all transactions
      10,Fetched 482 Normal transactions
      20,Fetched 48 Internal transactions
      30,Fetched 428 ERC20 transactions
      40,Fetched 0 Staking Withdrawal transactions
      50,Fetched 0 Block Reward transactions
      50,Parsing all transactions
      60,Saving 1025 audit logs to disk
      70,Saving 949 transactions to disk
      80,Saving metadata
      90,Setting cursor to 16727787"
    `)
  })

  it.sequential("should compute balances", async () => {
    // arrange
    const until = Date.UTC(2021, 0, 0, 0, 0, 0, 0) // 1 Jan 2021
    const updates: ProgressUpdate[] = []
    // act
    await computeBalances(accountName, { until }, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 1025 audit logs
      0,Processing logs 1 to 1000
      87,Processed 1350 daily balances
      87,Processing logs 1001 to 1025
      90,Processed 622 daily balances
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
      100,Saved 1972 records to disk"
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
      25,Processing 949 (EVM) transactions
      50,Saving 211 merged transactions
      70,Updating the audit logs of 211 merged transactions
      90,Deleting 493 deduplicated transactions
      100,Done"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`667`)
    await expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/0x003dc/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`1025`)
    await expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/0x003dc/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`1971`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/0x003dc/balances-${i}.ts.snap`
      )
    }
  })

  it.sequential("should delete the connection", async () => {
    // arrange
    const connections = await getConnections(accountName)
    const updates: ProgressUpdate[] = []
    // act
    for (const connection of connections) {
      await deleteConnection(accountName, connection.id, async (state) => updates.push(state))
    }
    // assert
    const remainingAuditLogs = await countAuditLogs(accountName)
    const remainingTransactions = await countTransactions(accountName)
    const remainingConnections = await countConnections(accountName)
    //
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Removing connection with id 3641303814
      0,Removing 1025 audit logs
      50,Removing 667 transactions
      100,Removal complete"
    `)
    expect(remainingAuditLogs).toMatchInlineSnapshot(`0`)
    expect(remainingTransactions).toMatchInlineSnapshot(`0`)
    expect(remainingConnections).toMatchInlineSnapshot(`0`)
  })
})
