import { describe, expect, it, mock } from "bun:test"
import fs from "fs"
import { join } from "path"
import { countAuditLogs, getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import {
  countFileImports,
  deleteFileImport,
  getFileImports,
  importFile,
} from "src/api/account/file-imports-api"
import { computeNetworth, getNetworth } from "src/api/account/networth-api"
import { upsertServerTask } from "src/api/account/server-tasks-api"
import { countTransactions, getTransactions } from "src/api/account/transactions-api"
import { getAccount, resetAccount } from "src/api/accounts-api"
import { ProgressUpdate, TaskPriority, TaskStatus } from "src/interfaces"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { sleep } from "src/utils/utils"
import { beforeAll } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const mocks = {
  access: mock().mockResolvedValue(true),
  readFile: mock(),
}

describe("0xf98 file import", () => {
  beforeAll(async () => {
    mock.module("fs/promises", () => ({
      ...fs.promises,
      access: mocks.access,
      readFile: mocks.readFile,
    }))
  })

  it("should add a file import", async () => {
    const fileName = "0xf98/etherscan.csv"
    const filePath = join("test/files", fileName)
    const buffer = await fs.promises.readFile(filePath, "utf8")
    mocks.readFile.mockResolvedValue(buffer)
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
    delete fileImport.timestamp
    expect(fileImport).toMatchSnapshot(`file-import`)
    expect(auditLogsCount).toEqual(16)
  })

  it("should add an erc20 file import", async () => {
    const fileName = "0xf98/etherscan-erc20.csv"
    const filePath = join("test/files", fileName)
    const buffer = await fs.promises.readFile(filePath, "utf8")
    mocks.readFile.mockResolvedValue(buffer)
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
        status: "completed",
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
    delete fileImport.timestamp
    expect(fileImport).toMatchSnapshot(`file-import-erc20`)
    expect(auditLogsCount).toEqual(8)
  })

  it("should compute balances", async () => {
    const until = 0 // no gap filling
    const updates: ProgressUpdate[] = []
    await computeBalances(accountName, { until }, async (state) => updates.push(state))
    expect(updates.join("\n")).toMatchSnapshot()
  })

  it("should compute networth", async () => {
    const updates: ProgressUpdate[] = []
    await computeNetworth(accountName, undefined, async (state) => updates.push(state))
    expect(updates.join("\n")).toMatchSnapshot()
  })

  it("should save the correct data", async () => {
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    const networth = await getNetworth(accountName)
    expect(transactions.length).toEqual(17)
    expect(transactions.map(normalizeTransaction)).toMatchSnapshot(`transactions`)
    expect(auditLogs.length).toEqual(24)
    expect(auditLogs.map(sanitizeAuditLog)).toMatchSnapshot(`audit logs`)
    expect(balances.length).toEqual(1154)
    for (let i = 0; i < balances.length; i += 100) {
      expect(balances.slice(i, i + 100)).toMatchSnapshot(`balances - page ${i / 100}`)
    }
    expect(networth.length).toEqual(1154)
    expect(networth).toMatchSnapshot(`networth`)
  })

  it("should delete the file imports", async () => {
    // arrange
    const fileImports = await getFileImports(accountName)
    const updates: ProgressUpdate[] = []
    // act
    for (const fileImport of fileImports) {
      await deleteFileImport(accountName, fileImport, async (state) => updates.push(state))
    }
    // assert
    const remainingAuditLogs = await countAuditLogs(accountName)
    const remainingTransactions = await countTransactions(accountName)
    const remainingFileImports = await countFileImports(accountName)
    //
    expect(updates.join("\n")).toMatchSnapshot()
    expect(remainingAuditLogs).toEqual(0)
    expect(remainingTransactions).toEqual(0)
    expect(remainingFileImports).toEqual(0)
  })

  // test if sqlite_sequence is reset after reset account
  it("should reset the sqlite_sequence", async () => {
    // arrange
    await upsertServerTask(accountName, {
      createdAt: 1,
      description: "",
      name: "Test task",
      priority: TaskPriority.Lowest,
      status: TaskStatus.Completed,
      trigger: "user",
    })
    let account = await getAccount(accountName)
    await sleep(100) // wait for the init_db task to be created
    let sqliteSequence = await account.execute(`SELECT * FROM sqlite_sequence`)
    expect(sqliteSequence).toEqual([["server_tasks", 1]])
    // act
    await resetAccount(accountName)
    // assert
    account = await getAccount(accountName)
    await sleep(100) // wait for the init_db task to be created
    await upsertServerTask(accountName, {
      createdAt: 1,
      description: "",
      name: "Test task 2",
      priority: TaskPriority.Lowest,
      status: TaskStatus.Completed,
      trigger: "user",
    })
    sqliteSequence = await account.execute(`SELECT * FROM sqlite_sequence`)
    expect(sqliteSequence).toEqual([["server_tasks", 1]])
  })
})
