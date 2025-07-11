import fs from "fs"
import { join } from "path"
import { countAuditLogs, getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import { importFile } from "src/api/account/file-imports-api"
import { getTransactions } from "src/api/account/transactions-api"
import { ProgressUpdate } from "src/interfaces"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { beforeAll, describe, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)
const snapshotDir = "binance-import"

const mocks = vi.hoisted(() => {
  return {
    access: vi.fn().mockResolvedValue(true),
    readFile: vi.fn(),
  }
})

describe("binance test imports", () => {
  beforeAll(async () => {
    vi.mock("fs/promises", () => ({
      ...fs.promises,
      access: mocks.access,
      readFile: mocks.readFile,
    }))
  })

  it("should add a file import", async () => {
    // arrange
    const fileName = "binance.csv"
    const filePath = join("test/files", fileName)
    const buffer = await fs.promises.readFile(filePath, "utf8")
    mocks.readFile.mockResolvedValue(buffer)
    // act
    const fileImport = await importFile(accountName, {
      createdBy: "user",
      id: 0,
      metadata: {
        lastModified: 0,
        size: buffer.length,
        type: "text/csv",
      },
      name: fileName,
      scheduledAt: 0,
      status: "completed",
    })
    // assert
    const auditLogsCount = await countAuditLogs(
      accountName,
      `SELECT COUNT(*) FROM audit_logs WHERE fileImportId = ?`,
      [fileImport.id]
    )
    delete fileImport.timestamp
    expect(fileImport).toMatchInlineSnapshot(`
      {
        "id": "2822928863",
        "lastModified": 0,
        "meta": {
          "assetIds": [
            "ex.binance:ETH",
            "ex.binance:IOTA",
            "ex.binance:ETF",
            "ex.binance:XLM",
            "ex.binance:QTUM",
            "ex.binance:MANA",
          ],
          "extensionId": "binance-file-import",
          "logs": 27,
          "operations": [
            "Deposit",
            "Sell",
            "Buy",
            "Fee",
            "Reward",
          ],
          "parserId": "binance-account-statement",
          "platformId": "ex.binance",
          "rows": 27,
          "transactions": 10,
          "wallets": [
            "Binance Spot",
          ],
        },
        "name": "binance.csv",
        "size": 1970,
      }
    `)
    expect(auditLogsCount).toMatchInlineSnapshot(`27`)
  })

  it.sequential("should compute balances", async () => {
    // arrange
    const until = Date.UTC(2000, 0, 0, 0, 0, 0, 0) // 1 Jan 2000
    // act
    const updates: ProgressUpdate[] = []
    await computeBalances(accountName, { until }, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 27 audit logs
      0,Processing logs 1 to 27
      90,Processed 24 daily balances
      96,Filling balances to reach today
      99,Setting balances cursor to Dec 27, 2017
      100,Saved 25 records to disk"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const balances = await getBalances(accountName)
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    // assert
    expect(balances.length).toMatchInlineSnapshot(`25`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/${snapshotDir}/balances-${i}.ts.snap`
      )
    }
    expect(auditLogs.length).toMatchInlineSnapshot(`27`)
    for (let i = 0; i < auditLogs.length; i += 100) {
      await expect(auditLogs.slice(i, i + 100).map(sanitizeAuditLog)).toMatchFileSnapshot(
        `../__snapshots__/${snapshotDir}/audit-logs-${i}.ts.snap`
      )
    }
    expect(transactions.length).toMatchInlineSnapshot(`10`)
    for (let i = 0; i < transactions.length; i += 100) {
      await expect(transactions.slice(i, i + 100).map(normalizeTransaction)).toMatchFileSnapshot(
        `../__snapshots__/${snapshotDir}/transactions-${i}.ts.snap`
      )
    }
  })
})
