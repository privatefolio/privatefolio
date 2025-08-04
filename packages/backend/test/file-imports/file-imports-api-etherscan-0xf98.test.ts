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
import {
  computeTrades,
  getAccountPnL,
  getTrades,
  getTradesFullQuery,
} from "src/api/account/trades-api"
import {
  autoMergeTransactions,
  countTransactions,
  getTransactions,
} from "src/api/account/transactions-api"
import { ProgressUpdate } from "src/interfaces"
import { ETHEREUM_PLATFORM_ID } from "src/settings/platforms"
import { normalizeTransaction, sanitizeAuditLog } from "src/utils/test-utils"
import { beforeAll, describe, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const mocks = vi.hoisted(() => {
  return {
    access: vi.fn().mockResolvedValue(true),
    readFile: vi.fn(),
  }
})

describe("0xf98 file import", () => {
  beforeAll(async () => {
    vi.mock("fs/promises", () => ({
      ...fs.promises,
      access: mocks.access,
      readFile: mocks.readFile,
    }))
  })

  it("should add a file import", async () => {
    // arrange
    const fileName = "0xf98/etherscan.csv"
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
      { platform: ETHEREUM_PLATFORM_ID }
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
        "id": "1151263496",
        "lastModified": 0,
        "meta": {
          "assetIds": [
            "chain.ethereum:0x0000000000000000000000000000000000000000:ETH",
          ],
          "extensionId": "etherscan-file-import",
          "logs": 16,
          "operations": [
            "Deposit",
            "Fee",
            "Withdraw",
          ],
          "parserId": "etherscan-user-txns",
          "platformId": "chain.ethereum",
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
        platform: ETHEREUM_PLATFORM_ID,
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
            "chain.ethereum:0x0Cf0Ee63788A0849fE5297F3407f701E122cC023:XDATA",
            "chain.ethereum:0x1d462414fe14cf489c7A21CaC78509f4bF8CD7c0:CAN",
            "chain.ethereum:0x519475b31653E46D20cD09F9FdcF3B12BDAcB4f5:VIU",
            "chain.ethereum:0x52903256dd18D85c2Dc4a6C999907c9793eA61E3:INSP",
            "chain.ethereum:0x58b6A8A3302369DAEc383334672404Ee733aB239:LPT",
            "chain.ethereum:0x7B2f9706CD8473B4F5B7758b0171a9933Fc6C4d6:HEALP",
            "chain.ethereum:0xA4e8C3Ec456107eA67d3075bF9e3DF3A75823DB0:LOOM",
            "chain.ethereum:0xab95E915c123fdEd5BDfB6325e35ef5515F1EA69:XNN",
          ],
          "extensionId": "etherscan-file-import",
          "logs": 8,
          "operations": [
            "Deposit",
          ],
          "parserId": "etherscan-erc20-txns",
          "platformId": "chain.ethereum",
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
    const until = 0 // no gap filling
    // act
    const updates: ProgressUpdate[] = []
    await computeBalances(accountName, { until }, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 24 audit logs
      0,Processing logs 1 to 24
      90,Processed 1153 daily balances
      96,Filling balances to reach today
      99,Setting balances cursor to Nov 04, 2020
      100,Saved 1154 records to disk"
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
      25,Processing 17 (EVM) transactions
      50,Saving 1 merged transactions
      70,Updating the audit logs of 1 merged transactions
      90,Deleting 2 deduplicated transactions
      100,Done"
    `)
  })

  it.sequential("should compute trades from imported data", async () => {
    mocks.readFile.mockImplementation(fs.promises.readFile)
    // act
    const updates: ProgressUpdate[] = []
    await computeTrades(accountName, async (state) => updates.push(state))
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching audit logs
      2.5,Processing 24 audit logs
      6,Found 4 asset groups (skipped 5 unlisted assets)
      10,Processed all trades for ETH
      15,Processed all trades for XDATA
      20,Processed all trades for LOOM
      25,Processed all trades for LPT
      25,Setting trades cursor to Nov 04, 2020
      25,Computed 4 trades
      30,Computing PnL for 4 trades
      46,Processed trade #1 (Long 5.151643 ETH)
      62,Processed trade #2 (Long 0.21165476692904842 XDATA)
      78,Processed trade #3 (Long 10 LOOM)
      95,Processed trade #4 (Long 2.117826656607922 LPT)
      95,Saving 4 records to disk
      100,PnL computation completed"
    `)
  })

  it.sequential("should save the correct data", async () => {
    // act
    const auditLogs = await getAuditLogs(accountName)
    const transactions = await getTransactions(accountName)
    const balances = await getBalances(accountName)
    const trades = await getTrades(accountName, await getTradesFullQuery())
    const pnl = await getAccountPnL(accountName)
    // assert
    expect(transactions.length).toMatchInlineSnapshot(`16`)
    await expect(transactions.map(normalizeTransaction)).toMatchFileSnapshot(
      "../__snapshots__/0xf98/transactions.ts.snap"
    )
    expect(auditLogs.length).toMatchInlineSnapshot(`24`)
    await expect(auditLogs.map(sanitizeAuditLog)).toMatchFileSnapshot(
      "../__snapshots__/0xf98/audit-logs.ts.snap"
    )
    expect(balances.length).toMatchInlineSnapshot(`1154`)
    for (let i = 0; i < balances.length; i += 100) {
      await expect(balances.slice(i, i + 100)).toMatchFileSnapshot(
        `../__snapshots__/0xf98/balances-${i}.ts.snap`
      )
    }
    expect(trades.length).toMatchInlineSnapshot(`4`)
    await expect(trades).toMatchFileSnapshot("../__snapshots__/0xf98/trades.ts.snap")
    expect(pnl.length).toMatchInlineSnapshot(`4`)
    await expect(pnl).toMatchFileSnapshot("../__snapshots__/0xf98/account-pnl.ts.snap")
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
      50,Removing 8 transactions
      100,Removed file import with id 3477221057
      0,Removing file import with id 1151263496
      0,Removing 16 audit logs
      50,Removing 8 transactions
      100,Removed file import with id 1151263496"
    `)
    expect(remainingAuditLogs).toMatchInlineSnapshot(`0`)
    expect(remainingTransactions).toMatchInlineSnapshot(`0`)
    expect(remainingFileImports).toMatchInlineSnapshot(`0`)
  })
})
