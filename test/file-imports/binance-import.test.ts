import fs from "fs"
import { join } from "path"
import { findAuditLogs } from "src/api/account/audit-logs-api"
import { computeBalances, getHistoricalBalances } from "src/api/account/balances-api"
import { addFileImport } from "src/api/account/file-imports/file-imports-api"
import { findTransactions } from "src/api/account/transactions-api"
import { getAccount, resetAccount } from "src/api/database"
import { ProgressUpdate } from "src/stores/task-store"
import { normalizeTransaction, sanitizeAuditLog, sanitizeBalance } from "src/utils/test-utils"
import { beforeAll, describe, expect, it } from "vitest"

const accountName = "green-zebra-1234"
const snapshotDir = "binance-import"

beforeAll(async () => {
  //
  await resetAccount(accountName)
})

describe("binance test imports", () => {
  it("should add a file import", async () => {
    // arrange
    const fileName = "/binance.csv"
    const filePath = join("test/files", fileName)
    const buffer = await fs.promises.readFile(filePath, "utf8")
    const file = new File([buffer], fileName, { lastModified: 0, type: "text/csv" })
    // act
    const fileImport = await addFileImport(file, undefined, accountName)
    const { docs: auditLogs } = await getAccount(accountName).auditLogsDB.find({
      selector: {
        importId: fileImport._id,
      },
    })
    auditLogs.sort((a, b) => b.timestamp - a.timestamp)
    // assert
    expect(fileImport).toMatchInlineSnapshot(`
      {
        "_id": "2930916201",
        "metadata": {
          "assetIds": [
            "binance:ETH",
            "binance:IOTA",
            "binance:ETF",
            "binance:XLM",
            "binance:QTUM",
            "binance:MANA",
          ],
          "integration": "binance-account-statement",
          "logs": 27,
          "operations": [
            "Deposit",
            "Sell",
            "Buy",
            "Fee",
            "Reward",
          ],
          "platform": "binance",
          "rows": 27,
          "transactions": 7,
          "wallets": [
            "Binance Spot",
          ],
        },
      }
    `)
  })

  it.sequential("should compute balances", async () => {
    // arrange
    const until = Date.UTC(2000, 0, 0, 0, 0, 0, 0) // 1 Jan 2000
    // act
    const updates: ProgressUpdate[] = []
    await computeBalances(accountName, { until }, (state) => updates.push(state))
    const balances = await getHistoricalBalances(accountName)
    const auditLogs = await findAuditLogs({}, accountName)
    // console.log(
    //   "📜 LOG > logs=logs.sort > logs:",
    //   auditLogs.filter((log) => log.timestamp === 1514369670000 && log.assetId === "binance:ETH")
    // )
    const transactions = await findTransactions({}, accountName)
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Computing balances for 27 audit logs
      0,Processing logs 1 to 27
      90,Processed 24 daily balances
      95,Setting networth cursor to Dec 31, 1969
      96,Filling balances to reach today
      100,Saved 24 records to disk"
    `)
    expect(balances.length).toMatchInlineSnapshot(`24`)
    for (let i = 0; i < balances.length; i += 100) {
      expect(balances.slice(i, i + 100).map(sanitizeBalance)).toMatchFileSnapshot(
        `./__snapshots__/${snapshotDir}/balances-${i}.ts.snap`
      )
    }
    expect(auditLogs.length).toMatchInlineSnapshot(`27`)
    for (let i = 0; i < auditLogs.length; i += 100) {
      expect(auditLogs.slice(i, i + 100).map(sanitizeAuditLog)).toMatchFileSnapshot(
        `./__snapshots__/${snapshotDir}/audit-logs-${i}.ts.snap`
      )
    }
    expect(transactions.length).toMatchInlineSnapshot(`7`)
    for (let i = 0; i < transactions.length; i += 100) {
      expect(transactions.slice(i, i + 100).map(normalizeTransaction)).toMatchFileSnapshot(
        `./__snapshots__/${snapshotDir}/transactions-${i}.ts.snap`
      )
    }
  })
})
