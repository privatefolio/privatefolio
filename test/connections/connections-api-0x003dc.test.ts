import { findAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getHistoricalBalances } from "src/api/account/balances-api"
import { addConnection, syncConnection } from "src/api/account/connections/connections-api"
import { autoMergeTransactions, findTransactions } from "src/api/account/transactions-api"
import { resetAccount } from "src/api/database"
import { Connection } from "src/interfaces"
import { ProgressUpdate } from "src/stores/task-store"
import {
  normalizeTransaction,
  sanitizeAuditLog,
  sanitizeBalance,
  sortTransactions,
} from "src/utils/test-utils"
import { beforeAll, describe, expect, it } from "vitest"

const accountName = "grey"

beforeAll(async () => {
  await resetAccount(accountName)
})

let connection: Connection

describe("should import 0x003dc via connection", () => {
  it.sequential("should add the connection", async () => {
    // arrange
    const address = "0x003dc32fe920a4aaeed12dc87e145f030aa753f3"
    // act
    connection = await addConnection(
      {
        address,
        label: "",
        platform: "ethereum",
      },
      accountName
    )
    // assert
    expect(connection._id).toMatchInlineSnapshot(`"2351606471"`)
  })

  it.sequential("should sync connection", async () => {
    // arrange
    const updates: ProgressUpdate[] = []
    // act
    await syncConnection((state) => updates.push(state), connection, accountName)
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
      60,Saving 1024 audit logs to disk
      70,Saving 948 transactions to disk
      80,Saving metadata
      90,Setting cursor to block number 16727787"
    `)
  })

  it.sequential("should compute balances", async () => {
    // arrange
    const until = Date.UTC(2021, 0, 0, 0, 0, 0, 0) // 1 Jan 2021
    const updates: ProgressUpdate[] = []
    // act
    await computeBalances(accountName, { until }, (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 1024 audit logs
      0,Processing logs 1 to 1000
      87,Processed 1350 daily balances
      87,Processing logs 1001 to 1024
      90,Processed 621 daily balances
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
      100,Saved 1971 records to disk"
    `)
  })

  it.sequential("should merge transactions", async () => {
    // arrange
    const updates: ProgressUpdate[] = []
    // act
    await autoMergeTransactions(accountName, (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching all transactions
      25,Processing 948 Ethereum transactions
      50,Saving 211 merged transactions
      75,Deleting 493 deduplicated transactions
      100,Done"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await findAuditLogs({}, accountName)
    const transactions = await findTransactions({}, accountName)
    const balances = await getHistoricalBalances(accountName)
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`666`)
    expect(transactions.sort(sortTransactions).map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/0x003dc/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`1024`)
    expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/0x003dc/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`1971`)
    for (let i = 0; i < balances.length; i += 100) {
      expect(balances.slice(i, i + 100).map(sanitizeBalance)).toMatchFileSnapshot(
        `../__snapshots__/0x003dc/balances-${i}.ts.snap`
      )
    }
  })
})
