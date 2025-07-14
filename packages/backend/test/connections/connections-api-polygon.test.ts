import { getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import { syncConnection, upsertConnection } from "src/api/account/connections-api"
import { autoMergeTransactions, getTransactions } from "src/api/account/transactions-api"
import { etherscanConnExtension } from "src/extensions/connections/etherscan/etherscan-settings"
import { Connection, ProgressUpdate } from "src/interfaces"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { describe, expect, it } from "vitest"

const accountName = Math.random().toString(36).substring(7)

let connection: Connection

describe.skip("should import 0x0E3ff from polygon via connection", () => {
  it.sequential("should add the connection", async () => {
    // arrange
    const address = "0x0E3ff3b68C3fA7aa0EE7b05DC7FB9dF12A08b5D4"
    // act
    connection = await upsertConnection(accountName, {
      address,
      extensionId: etherscanConnExtension,
      platformId: "polygon-pos",
    })
    // assert
    expect(connection.id).toMatchInlineSnapshot(`"3577169921"`)
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
      10,Fetched 203 Normal transactions
      20,Fetched 3 Internal transactions
      30,Fetched 26 ERC20 transactions
      50,Parsing all transactions
      60,Saving 311 audit logs to disk
      70,Saving 215 transactions to disk
      80,Saving metadata
      90,Setting cursor to 58154267"
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
      "0,Computing balances for 311 audit logs
      0,Processing logs 1 to 311
      90,Processed 172 daily balances
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
      100,Saved 172 records to disk"
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
      25,Processing 215 (EVM) transactions
      50,Saving 5 merged transactions
      70,Updating the audit logs of 5 merged transactions
      90,Deleting 10 deduplicated transactions
      100,Done"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`210`)
    expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/polygon/0x0E3ff/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`311`)
    expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/polygon/0x0E3ff/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`172`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/polygon/0x0E3ff/balances-${i}.ts.snap`
      )
    }
  })
})
