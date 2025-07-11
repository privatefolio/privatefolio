import { getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import { syncConnection, upsertConnection } from "src/api/account/connections-api"
import { autoMergeTransactions, getTransactions } from "src/api/account/transactions-api"
import { Connection, ProgressUpdate } from "src/interfaces"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { describe, expect, it } from "vitest"

const accountName = Math.random().toString(36).substring(7)

let connection: Connection

describe.skip("should import 0xB6e32 from arbitrum via connection", () => {
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
    expect(connection.id).toMatchInlineSnapshot(`"2295571797"`)
  })

  it.sequential("should sync connection", async () => {
    // arrange
    const updates: ProgressUpdate[] = []
    // act
    await syncConnection(async (state) => updates.push(state), connection.id, accountName, false)
    // assert
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot()
  })

  it.sequential("should compute balances", async () => {
    // arrange
    const until = Date.UTC(2021, 0, 0, 0, 0, 0, 0) // 1 Jan 2021
    const updates: ProgressUpdate[] = []
    // act
    await computeBalances(accountName, { until }, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 0 audit logs
      95,Setting networth cursor to Dec 31, 1969"
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
      25,Processing 0 (EVM) transactions
      50,Saving 0 merged transactions
      70,Updating the audit logs of 0 merged transactions
      90,Deleting 0 deduplicated transactions
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
      "../__snapshots__/arbitrum/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`42`)
    expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/arbitrum/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`661`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/arbitrum/balances-${i}.ts.snap`
      )
    }
  })
})
