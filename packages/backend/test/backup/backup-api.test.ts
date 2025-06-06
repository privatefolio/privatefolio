import fs from "fs"
import { join } from "path"
import { countAuditLogs, getAuditLogs } from "src/api/account/audit-logs-api"
import { backup, restore } from "src/api/account/backup-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import { importFile } from "src/api/account/file-imports-api"
import { getTransactions } from "src/api/account/transactions-api"
import { ProgressUpdate } from "src/interfaces"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { describe, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const mocks = vi.hoisted(() => {
  return {
    readFile: vi.fn(),
  }
})

vi.mock("fs/promises", () => ({
  ...fs.promises,
  readFile: mocks.readFile,
}))

describe.todo("should backup and restore", () => {
  it("should add a file import", async () => {
    // arrange
    const fileName = "0xf98/etherscan.csv"
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
    const auditLogsCount = await countAuditLogs(
      accountName,
      `SELECT COUNT(*) FROM audit_logs WHERE fileImportId = ?`,
      [fileImport.id]
    )
    // assert
    expect(auditLogsCount).toMatchInlineSnapshot(`16`)
  })

  it("should add an erc20 file import", async () => {
    // arrange
    const fileName = "0xf98/etherscan-erc20.csv"
    const filePath = join("test/files", fileName)
    const buffer = await fs.promises.readFile(filePath, "utf8")
    mocks.readFile.mockResolvedValue(buffer)
    // act
    const fileImport = await importFile(
      accountName,
      {
        createdBy: "user",
        id: 0,
        metadata: {
          lastModified: 0,
          size: buffer.length,
          type: "text/csv",
        },
        name: fileName,
        scheduledAt: 0,
        status: "scheduled",
      },
      {
        userAddress: "0xf98c96b5d10faafc2324847c82305bd5fd7e5ad3",
      }
    )
    const auditLogsCount = await countAuditLogs(
      accountName,
      `SELECT COUNT(*) FROM audit_logs WHERE fileImportId = ?`,
      [fileImport.id]
    )
    // assert
    delete fileImport.timestamp
    expect(auditLogsCount).toMatchInlineSnapshot(`8`)
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
      100,Saved 1210 records to disk"
    `)
  })

  it.sequential("should backup the account and restore it into a different account", async () => {
    // arrange
    const backupData = await backup(accountName)
    const newAccountName = "my-new-account"
    // act
    await restore(newAccountName, backupData)
    // assert
    const auditLogs = await getAuditLogs(newAccountName)
    const transactions = await getTransactions(newAccountName)
    const balances = await getBalances(newAccountName)
    expect(transactions.length).toMatchInlineSnapshot(`17`)
    await expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/0xf98/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`24`)
    await expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/0xf98/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`1210`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/0xf98/balances-${i}.ts.snap`
      )
    }
  })
})
