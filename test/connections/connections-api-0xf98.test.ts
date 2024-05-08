import { findAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getHistoricalBalances } from "src/api/account/balances-api"
import { addConnection, syncConnection } from "src/api/account/connections/connections-api"
import { findTransactions } from "src/api/account/transactions-api"
import { resetAccount } from "src/api/database"
import { Connection } from "src/interfaces"
import { $debugMode } from "src/stores/app-store"
import { ProgressUpdate } from "src/stores/task-store"
import { normalizeTransaction, sanitizeAuditLog, sanitizeBalance } from "src/utils/test-utils"
import { beforeAll, describe, expect, it } from "vitest"

const accountName = "orange"

beforeAll(async () => {
  await resetAccount(accountName)
})

let connection: Connection

describe.skip("should import 0xf98 via connection", () => {
  it.sequential("should add the connection", async () => {
    // arrange
    const address = "0xf98C96B5d10faAFc2324847c82305Bd5fd7E5ad3"
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
    expect(connection._id).toMatchInlineSnapshot(`"431128919"`)
  })

  it.sequential("should sync connection", async () => {
    // act
    await syncConnection(undefined, connection, accountName, $debugMode.get())
    // assert
  })

  it.sequential("should compute balances", async () => {
    // arrange
    const until = Date.UTC(2021, 0, 0, 0, 0, 0, 0) // 1 Jan 2021
    // act
    const updates: ProgressUpdate[] = []
    await computeBalances(accountName, { until }, (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 24 audit logs
      0,Processing logs 1 to 24
      90,Processed 1153 daily balances
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
      100,Saved 1210 records to disk"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await findAuditLogs({}, accountName)
    const transactions = await findTransactions({}, accountName)
    const balances = await getHistoricalBalances(accountName)
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`9`)
    expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/0xf98/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`24`)
    expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/0xf98/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`1210`)
    for (let i = 0; i < balances.length; i += 100) {
      expect(balances.slice(i, i + 100).map(sanitizeBalance)).toMatchFileSnapshot(
        `../__snapshots__/0xf98/balances-${i}.ts.snap`
      )
    }
  })
})
