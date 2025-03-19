import { getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import { syncConnection, upsertConnection } from "src/api/account/connections/connections-api"
import { autoMergeTransactions, getTransactions } from "src/api/account/transactions-api"
import { recreateAccount } from "src/api/accounts-api"
import { Connection, ProgressUpdate } from "src/interfaces"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { beforeAll, describe, expect, it } from "vitest"

const accountName = Math.random().toString(36).substring(7)

beforeAll(async () => {
  await recreateAccount(accountName)
})

let connection: Connection

describe.skip("should import 0x003dc from optimism via connection", () => {
  it.sequential("should add the connection", async () => {
    // arrange
    const address = "0x003dc32fe920a4aaeed12dc87e145f030aa753f3"
    // act
    connection = await upsertConnection(accountName, {
      address,
      label: "",
      platform: "eip155-10",
    })
    // assert
    expect(connection.id).toMatchInlineSnapshot(`"21687133"`)
  })

  it.sequential("should sync connection", async () => {
    // arrange
    const updates: ProgressUpdate[] = []
    // act
    await syncConnection(async (state) => updates.push(state), connection.id, accountName, false)
    // assert
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Starting from block number 0
      0,Fetching all transactions
      10,Fetched 23 Normal transactions
      20,Fetched 4 Internal transactions
      30,Fetched 11 ERC20 transactions
      50,Parsing all transactions
      60,Saving 42 audit logs to disk
      70,Saving 38 transactions to disk
      80,Saving metadata
      90,Setting cursor to 117705245"
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
      "0,Computing balances for 42 audit logs
      0,Processing logs 1 to 42
      90,Processed 661 daily balances
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
      100,Saved 661 records to disk"
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
      25,Processing 38 (EVM) transactions
      50,Saving 8 merged transactions
      70,Updating the audit logs of 8 merged transactions
      90,Deleting 18 deduplicated transactions
      100,Done"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`28`)
    expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/optimism/0x003dc/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`42`)
    expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/optimism/0x003dc/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`661`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/optimism/0x003dc/balances-${i}.ts.snap`
      )
    }
  })
})
