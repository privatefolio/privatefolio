import fs from "fs"
import { join } from "path"
import { computeBalances } from "src/api/account/balances-api"
import { fetchDailyPrices } from "src/api/account/daily-prices-api"
import { importFile } from "src/api/account/file-imports-api"
import { computeNetworth, getNetworth } from "src/api/account/networth-api"
import { ProgressUpdate, ResolutionString } from "src/interfaces"
import { aggregateCandles } from "src/utils/data-utils"
import { beforeAll, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const mocks = vi.hoisted(() => {
  return {
    access: vi.fn().mockResolvedValue(true),
    readFile: vi.fn(),
  }
})

beforeAll(async () => {
  vi.mock("fs/promises", () => ({
    ...fs.promises,
    access: mocks.access,
    readFile: mocks.readFile,
  }))
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
      coingeckoId: "bitcoin",
      id: "coinmama:BTC",
      priceApiId: "coinbase",
      symbol: "BTC",
    },
  ])
})

it.sequential("should compute historical networth", async () => {
  // arrange
  // act
  const updates: ProgressUpdate[] = []
  await computeNetworth(accountName, 0, async (state) => updates.push(state))
  const networthArray = await getNetworth(accountName)
  // assert
  expect(updates.join("\n")).toMatchInlineSnapshot(
    `
    "5,Computing networth for 15 days
    10,Computing networth starting Aug 31, 2017
    95,Saving 15 records to the database
    99,Setting networth cursor to Sep 14, 2017"
  `
  )
  expect(networthArray.length).toMatchInlineSnapshot(`15`)
  expect(networthArray).toMatchSnapshot()
  expect(aggregateCandles(networthArray, "3d" as ResolutionString)).toMatchSnapshot("as 3d candles")
  expect(aggregateCandles(networthArray, "1w" as ResolutionString)).toMatchSnapshot("as 1w candles")
  expect(aggregateCandles(networthArray, "1m" as ResolutionString)).toMatchSnapshot("as 1m candles")
})

it.sequential("should refresh networth", async () => {
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
  expect(networthArray.length).toMatchInlineSnapshot(`15`)
  expect(networthArray).toMatchSnapshot()
})
