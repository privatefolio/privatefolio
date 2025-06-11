import fs from "fs"
import { join } from "path"
import { getAuditLogs } from "src/api/account/audit-logs-api"
import {
  computeBalances,
  deleteBalances,
  getBalances,
  getBalancesAt,
} from "src/api/account/balances-api"
import { fetchDailyPrices } from "src/api/account/daily-prices-api"
import { importFile } from "src/api/account/file-imports-api"
import { getValue } from "src/api/account/kv-api"
import { ProgressUpdate, Timestamp } from "src/interfaces"
import { beforeAll, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const mocks = vi.hoisted(() => {
  return {
    access: vi.fn().mockResolvedValue(true),
    readFile: vi.fn(),
  }
})

vi.mock("fs/promises", () => ({
  ...fs.promises,
  access: mocks.access,
  readFile: mocks.readFile,
}))

beforeAll(async () => {
  //
  const fileName = "coinmama.csv"
  const filePath = join("test/files", fileName)
  const buffer = await fs.promises.readFile(filePath, "utf8")
  mocks.readFile.mockResolvedValue(buffer)
  await importFile(accountName, {
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
})

it.sequential("should not have balances computed", async () => {
  // act
  const auditLogs = await getAuditLogs(accountName)
  // assert
  expect(auditLogs).toMatchSnapshot()
})

it.sequential("should compute historical balances", async () => {
  // arrange
  const until = Date.UTC(2017, 8, 14, 0, 0, 0, 0) // 14 Sep 2017
  // act
  const updates: ProgressUpdate[] = []
  await computeBalances(accountName, { until }, async (state) => updates.push(state))
  // assert
  const balancesCursor = await getValue<Timestamp>(accountName, "balancesCursor", 0)
  expect(balancesCursor).toBe(until)
  expect(updates.join("\n")).toMatchInlineSnapshot(`
    "0,Computing balances for 2 audit logs
    0,Processing logs 1 to 2
    90,Processed 7 daily balances
    95,Setting networth cursor to Dec 31, 1969
    96,Filling balances to reach today
    100,Saved 14 records to disk"
  `)
})

it.sequential("should re-compute today's balances", async () => {
  // arrange
  const until = Date.UTC(2017, 8, 14, 0, 0, 0, 0) // 14 Sep 2017
  // act
  const updates: ProgressUpdate[] = []
  await computeBalances(
    accountName,
    {
      since: 1504742400000,
      until,
    },
    async (state) => updates.push(state)
  )
  // assert
  const balancesCursor = await getValue<Timestamp>(accountName, "balancesCursor", 0)
  expect(balancesCursor).toBe(until)
  expect(updates.join("\n")).toMatchInlineSnapshot(`
    "0,Refreshing balances starting Sep 07, 2017
    0,Computing balances for 1 audit logs
    0,Processing logs 1 to 1
    90,Processed 1 daily balances
    95,Setting networth cursor to Sep 06, 2017
    96,Filling balances to reach today
    100,Saved 8 records to disk"
  `)
})

it.sequential("should fetch historical balances", async () => {
  // arrange
  // act
  const balances = await getBalances(accountName)
  // assert
  expect(balances.length).toMatchInlineSnapshot(`14`)
  expect(balances).toMatchSnapshot()
})

it.sequential("should have balances computed", async () => {
  // act
  const auditLogs = await getAuditLogs(accountName)
  // assert
  expect(auditLogs).toMatchSnapshot()
})

it.sequential("should fetch latest balances without price data", async () => {
  // arrange
  // act
  const balances = await getBalancesAt(accountName)
  // assert
  expect(balances).toMatchSnapshot()
})

it.sequential("should fetch latest balances with price data", async () => {
  // arrange
  await fetchDailyPrices(accountName, [
    {
      id: "coinmama:BTC",
      priceApiId: "coinbase",
      symbol: "BTC",
    },
  ])
  // act
  const balances = await getBalancesAt(accountName)
  // assert
  expect(balances).toMatchSnapshot()
})

it.sequential("should delete all balances", async () => {
  // arrange
  const initialAuditLogs = await getAuditLogs(accountName)
  // act
  await deleteBalances(accountName)
  // assert
  const balances = await getBalances(accountName)
  expect(balances).toMatchInlineSnapshot(`[]`)
  expect(initialAuditLogs).toMatchInlineSnapshot(`
    [
      {
        "assetId": "coinmama:BTC",
        "balance": "0.072958518",
        "change": "0.036979259",
        "fileImportId": "2702913076",
        "id": "2702913076_3604660326_0",
        "importIndex": 0,
        "operation": "Buy with Credit Card",
        "platform": "coinmama",
        "timestamp": 1504789876000,
        "wallet": "Coinmama Spot",
      },
      {
        "assetId": "coinmama:BTC",
        "balance": "0.035979259",
        "change": "0.035979259",
        "fileImportId": "2702913076",
        "id": "2702913076_1607323056_0",
        "importIndex": 1,
        "operation": "Buy with Credit Card",
        "platform": "coinmama",
        "timestamp": 1504267876000,
        "wallet": "Coinmama Spot",
      },
    ]
  `)
  const auditLogs = await getAuditLogs(accountName)
  expect(auditLogs).toMatchInlineSnapshot(`
    [
      {
        "assetId": "coinmama:BTC",
        "change": "0.036979259",
        "fileImportId": "2702913076",
        "id": "2702913076_3604660326_0",
        "importIndex": 0,
        "operation": "Buy with Credit Card",
        "platform": "coinmama",
        "timestamp": 1504789876000,
        "wallet": "Coinmama Spot",
      },
      {
        "assetId": "coinmama:BTC",
        "change": "0.035979259",
        "fileImportId": "2702913076",
        "id": "2702913076_1607323056_0",
        "importIndex": 1,
        "operation": "Buy with Credit Card",
        "platform": "coinmama",
        "timestamp": 1504267876000,
        "wallet": "Coinmama Spot",
      },
    ]
  `)
})
