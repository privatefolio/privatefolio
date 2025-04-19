import fs from "fs"
import { join } from "path"
import { countAuditLogs, getAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getBalances } from "src/api/account/balances-api"
import {
  countFileImports,
  deleteFileImport,
  getFileImports,
  importFile,
} from "src/api/account/file-imports/file-imports-api"
import { computeTrades, getTrades, getTradesFullQuery } from "src/api/account/trades-api"
import { countTransactions, getTransactions } from "src/api/account/transactions-api"
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

describe("0xf98 file import", () => {
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
    delete fileImport.timestamp
    expect(fileImport).toMatchInlineSnapshot(`
      {
        "id": "1151263496",
        "lastModified": 0,
        "meta": {
          "assetIds": [
            "ethereum:0x0000000000000000000000000000000000000000:ETH",
          ],
          "integration": "etherscan",
          "logs": 16,
          "operations": [
            "Deposit",
            "Withdraw",
            "Fee",
          ],
          "platform": "ethereum",
          "rows": 9,
          "transactions": 9,
          "wallets": [
            "0xf98C96B5d10faAFc2324847c82305Bd5fd7E5ad3",
          ],
        },
        "name": "0xf98/etherscan.csv",
        "size": 2898,
      }
    `)
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
    // assert
    delete fileImport.timestamp
    expect(fileImport).toMatchInlineSnapshot(`
      {
        "id": "3477221057",
        "lastModified": 0,
        "meta": {
          "assetIds": [
            "ethereum:0xab95E915c123fdEd5BDfB6325e35ef5515F1EA69:XNN",
            "ethereum:0x0Cf0Ee63788A0849fE5297F3407f701E122cC023:XDATA",
            "ethereum:0x519475b31653E46D20cD09F9FdcF3B12BDAcB4f5:VIU",
            "ethereum:0x52903256dd18D85c2Dc4a6C999907c9793eA61E3:INSP",
            "ethereum:0x1d462414fe14cf489c7A21CaC78509f4bF8CD7c0:CAN",
            "ethereum:0xA4e8C3Ec456107eA67d3075bF9e3DF3A75823DB0:LOOM",
            "ethereum:0x7B2f9706CD8473B4F5B7758b0171a9933Fc6C4d6:HEALP",
            "ethereum:0x58b6A8A3302369DAEc383334672404Ee733aB239:LPT",
          ],
          "integration": "etherscan-erc20",
          "logs": 8,
          "operations": [
            "Deposit",
          ],
          "platform": "ethereum",
          "rows": 8,
          "transactions": 8,
          "wallets": [
            "0xf98C96B5d10faAFc2324847c82305Bd5fd7E5ad3",
          ],
        },
        "name": "0xf98/etherscan-erc20.csv",
        "size": 2447,
      }
    `)
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

  it.sequential("should compute trades from imported data", async () => {
    // act
    const updates: ProgressUpdate[] = []
    await computeTrades(accountName, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching audit logs
      10,Processing 24 audit logs
      20,Found 9 asset groups
      27,Processed 1/9 asset groups
      35,Processed 2/9 asset groups
      43,Processed 3/9 asset groups
      51,Processed 4/9 asset groups
      58,Processed 5/9 asset groups
      66,Processed 6/9 asset groups
      74,Processed 7/9 asset groups
      82,Processed 8/9 asset groups
      90,Processed 9/9 asset groups
      100,Trades computation completed"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    const trades = await getTrades(accountName, await getTradesFullQuery())
    // assert
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
    expect(trades.length).toMatchInlineSnapshot(`9`)
    await expect(trades).toMatchFileSnapshot("../__snapshots__/0xf98/trades.ts.snap")
  })

  it.sequential("should delete the file imports", async () => {
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
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Removing file import with id 3477221057
      0,Removing 8 audit logs
      25,Setting balances cursor to Oct 26, 2017
      25,Setting networth cursor to Oct 26, 2017
      50,Removing 8 transactions
      100,Removed file import with id 3477221057
      0,Removing file import with id 1151263496
      0,Removing 16 audit logs
      25,Setting balances cursor to Sep 08, 2017
      25,Setting networth cursor to Sep 08, 2017
      50,Removing 9 transactions
      100,Removed file import with id 1151263496"
    `)
    expect(remainingAuditLogs).toMatchInlineSnapshot(`0`)
    expect(remainingTransactions).toMatchInlineSnapshot(`0`)
    expect(remainingFileImports).toMatchInlineSnapshot(`0`)
  })
})
