import fs from "fs"
import { join } from "path"
import { computeBalances } from "src/api/account/balances-api"
import { fetchDailyPrices } from "src/api/account/daily-prices-api"
import { importFile } from "src/api/account/file-imports-api"
import { computeNetworth, getNetworth } from "src/api/account/networth-api"
import { ProgressUpdate } from "src/interfaces"
import { GITHUB_CI } from "src/server-env"
import { beforeAll, expect, it, vi } from "vitest"

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
  const until = Date.UTC(2017, 8, 14, 0, 0, 0, 0) // 14 Sep 2017
  await computeBalances(accountName, { until })
  await fetchDailyPrices(accountName, [
    {
      id: "coinmama:BTC",
      priceApiId: "binance",
      symbol: "BTC",
    },
  ])
})

it.sequential("should compute historical networth", async (test) => {
  if (GITHUB_CI) {
    test.skip()
  }
  // arrange
  // act
  const updates: ProgressUpdate[] = []
  await computeNetworth(accountName, 0, async (state) => updates.push(state))
  const networthArray = await getNetworth(accountName)
  // assert
  expect(updates.join("\n")).toMatchInlineSnapshot(
    `
    "5,Computing networth for 14 days
    10,Computing networth starting Sep 01, 2017
    95,Saving 14 records to the database
    99,Setting networth cursor to Sep 14, 2017"
  `
  )
  expect(networthArray.length).toMatchInlineSnapshot(`14`)
  expect(networthArray).toMatchSnapshot()
})

it.sequential("should refresh networth", async (test) => {
  if (GITHUB_CI) {
    test.skip()
  }
  // arrange
  // act
  const updates: ProgressUpdate[] = []
  await computeNetworth(accountName, undefined, async (state) => updates.push(state))
  const networthArray = await getNetworth(accountName)
  // assert
  expect(updates.join("\n")).toMatchInlineSnapshot(`
    "5,Computing networth for 1 days
    10,Computing networth starting Sep 14, 2017
    95,Saving 1 records to the database
    99,Setting networth cursor to Sep 14, 2017"
  `)
  expect(networthArray.length).toMatchInlineSnapshot(`14`)
  expect(networthArray).toMatchSnapshot()
})
