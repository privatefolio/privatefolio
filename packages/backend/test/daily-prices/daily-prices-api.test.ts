import fs from "fs"
import { join } from "path"
import { fetchDailyPrices, getPricesForAsset } from "src/api/account/daily-prices-api"
import { importFile } from "src/api/account/file-imports-api"
import { ProgressUpdate } from "src/interfaces"
import { GITHUB_CI } from "src/server-env"
import { formatDate } from "src/utils/formatting-utils"
import { assertTimeConsistency } from "src/utils/test-utils"
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
})

it("should fetch no prices", async () => {
  // act
  const updates: ProgressUpdate[] = []
  await fetchDailyPrices(accountName, [], async (state) => updates.push(state))
  // assert
  expect(updates.join("\n")).toMatchInlineSnapshot(`"0,Fetching asset prices for 0 assets"`)
})

it("should fetch BTC prices using Binance", async (test) => {
  if (GITHUB_CI) {
    test.skip()
  }
  // arrange
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices(
    accountName,
    [{ id: "binance:BTC", priceApiId: "binance", symbol: "BTC" }],
    async (state) => updates.push(state)
  )
  const records = await getPricesForAsset(accountName, "binance:BTC")
  // assert
  expect(updates).toMatchInlineSnapshot(`
    [
      [
        0,
        "Fetching asset prices for 1 assets",
      ],
      [
        undefined,
        "Fetched BTC using Binance from Dec 24, 2022 to Jun 10, 2025",
      ],
      [
        undefined,
        "Fetched BTC using Binance from Jul 07, 2020 to Dec 23, 2022",
      ],
      [
        undefined,
        "Fetched BTC using Binance from Jan 19, 2018 to Jul 06, 2020",
      ],
      [
        undefined,
        "Fetched BTC using Binance from Aug 17, 2017 to Jan 18, 2018",
      ],
      [
        100,
      ],
    ]
  `)
  assertTimeConsistency(records)
  expect(records.slice(0, 3)).toMatchInlineSnapshot(`
    [
      {
        "close": 4285.08,
        "high": 4485.39,
        "low": 4200.74,
        "open": 4261.48,
        "time": 1502928000,
        "value": 4285.08,
        "volume": 795.150377,
      },
      {
        "close": 4108.37,
        "high": 4371.52,
        "low": 3938.77,
        "open": 4285.08,
        "time": 1503014400,
        "value": 4108.37,
        "volume": 1199.888264,
      },
      {
        "close": 4139.98,
        "high": 4184.69,
        "low": 3850,
        "open": 4108.37,
        "time": 1503100800,
        "value": 4139.98,
        "volume": 381.309763,
      },
    ]
  `)
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Aug 17, 2017"`)
  expect(formatDate((records[records.length - 1].time as number) * 1000)).toMatchInlineSnapshot(
    `"Jun 10, 2025"`
  )
})

// TODO1 coinbase no longer returns since genesis
it.skip("should fetch BTC prices using Coinbase", async () => {
  // arrange
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices(
    accountName,
    [
      {
        id: "coinbase:BTC",
        symbol: "BTC",
      },
    ],
    async (state) => updates.push(state)
  )
  const records = await getPricesForAsset(accountName, "coinbase:BTC")
  // assert
  assertTimeConsistency(records)
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Jul 20, 2015"`)
  expect(records.slice(0, 3)).toMatchInlineSnapshot(`
    [
      {
        "close": 280,
        "high": 280,
        "low": 277.37,
        "open": 277.98,
        "time": 1437350400,
        "value": 280,
        "volume": 782.88341959,
      },
      {
        "close": 277.32,
        "high": 281.27,
        "low": 276.85,
        "open": 279.96,
        "time": 1437436800,
        "value": 277.32,
        "volume": 4943.55943437,
      },
      {
        "close": 277.89,
        "high": 278.54,
        "low": 275.01,
        "open": 277.33,
        "time": 1437523200,
        "value": 277.89,
        "volume": 4687.90938331,
      },
    ]
  `)
})

it("should fetch WBTC prices using DefiLlama", async () => {
  // arrange
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices(
    accountName,
    [
      {
        id: "ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC-1",
        priceApiId: "defi-llama",
        symbol: "WBTC",
      },
    ],
    async (state) => updates.push(state)
  )
  const records = await getPricesForAsset(
    accountName,
    "ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC-1"
  )
  // assert
  expect(updates).toMatchInlineSnapshot(`
    [
      [
        0,
        "Fetching asset prices for 1 assets",
      ],
      [
        undefined,
        "Fetched WBTC-1 using DefiLlama from Dec 24, 2022 to Jun 10, 2025",
      ],
      [
        undefined,
        "Fetched WBTC-1 using DefiLlama from Jul 07, 2020 to Dec 23, 2022",
      ],
      [
        undefined,
        "Fetched WBTC-1 using DefiLlama from Jan 31, 2019 to Jul 06, 2020",
      ],
      [
        100,
      ],
    ]
  `)
  assertTimeConsistency(records)
  expect(records.slice(0, 3)).toMatchInlineSnapshot(`
    [
      {
        "time": 1548892800,
        "value": 3509.6256705662845,
      },
      {
        "time": 1548979200,
        "value": 3438.2214190869468,
      },
      {
        "time": 1549065600,
        "value": 3476.5580017564303,
      },
    ]
  `)
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Jan 31, 2019"`)
  expect(formatDate((records[records.length - 1].time as number) * 1000)).toMatchInlineSnapshot(
    `"Jun 10, 2025"`
  )
})
