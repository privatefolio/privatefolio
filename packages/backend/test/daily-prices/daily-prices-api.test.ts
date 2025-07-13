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
})

it("should fetch no prices", async () => {
  // act
  const updates: ProgressUpdate[] = []
  await fetchDailyPrices(accountName, [], async (state) => updates.push(state))
  // assert
  expect(updates.join("\n")).toMatchInlineSnapshot(`
    "1,Fetching asset prices for 0 assets
    2,Fetching asset prices in batches of 10"
  `)
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
    [{ coingeckoId: "test", id: "binance:BTC", priceApiId: "binance", symbol: "BTC" }],
    async (state) => updates.push(state),
    undefined,
    { until: 1735682400000 }
  )
  const records = await getPricesForAsset(accountName, "binance:BTC")
  // assert
  expect(updates).toMatchInlineSnapshot(`
    [
      [
        1,
        "Fetching asset prices for 1 assets",
      ],
      [
        2,
        "Fetching asset prices in batches of 10",
      ],
      [
        undefined,
        "Fetched BTC using Binance from Jul 16, 2022 to Dec 31, 2024",
      ],
      [
        undefined,
        "Fetched BTC using Binance from Jan 28, 2020 to Jul 15, 2022",
      ],
      [
        undefined,
        "Fetched BTC using Binance from Aug 17, 2017 to Jan 27, 2020",
      ],
      [
        100,
      ],
    ]
  `)
  assertTimeConsistency(records)
  expect(records.slice(-3)).toMatchInlineSnapshot(`
    [
      {
        "close": 93738.2,
        "high": 95340,
        "low": 93009.52,
        "open": 95300,
        "time": 1735430400,
        "value": 93738.2,
        "volume": 13576.00578,
      },
      {
        "close": 92792.05,
        "high": 95024.5,
        "low": 91530.45,
        "open": 93738.19,
        "time": 1735516800,
        "value": 92792.05,
        "volume": 27619.4225,
      },
      {
        "close": 93576,
        "high": 96250,
        "low": 92033.73,
        "open": 92792.05,
        "time": 1735603200,
        "value": 93576,
        "volume": 19612.03389,
      },
    ]
  `)
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Aug 17, 2017"`)
  expect(formatDate((records[records.length - 1].time as number) * 1000)).toMatchInlineSnapshot(
    `"Dec 31, 2024"`
  )
})

it("should fetch BTC prices using Coinbase", async () => {
  // arrange
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices(
    accountName,
    [
      {
        coingeckoId: "test",
        id: "coinbase:BTC",
        priceApiId: "coinbase",
        symbol: "BTC",
      },
    ],
    async (state) => updates.push(state),
    undefined,
    { until: 1735682400000 }
  )
  const records = await getPricesForAsset(accountName, "coinbase:BTC")
  // assert
  expect(updates).toMatchInlineSnapshot(`
    [
      [
        1,
        "Fetching asset prices for 1 assets",
      ],
      [
        2,
        "Fetching asset prices in batches of 10",
      ],
      [
        undefined,
        "Fetched BTC using Coinbase from Jul 16, 2022 to Dec 31, 2024",
      ],
      [
        undefined,
        "Fetched BTC using Coinbase from Jan 30, 2020 to Jul 15, 2022",
      ],
      [
        undefined,
        "Fetched BTC using Coinbase from Aug 15, 2017 to Jan 29, 2020",
      ],
      [
        undefined,
        "Fetched BTC using Coinbase from Jul 20, 2015 to Aug 14, 2017",
      ],
      [
        100,
      ],
    ]
  `)
  assertTimeConsistency(records)
  expect(records.slice(-3)).toMatchInlineSnapshot(`
    [
      {
        "close": 93563.35,
        "high": 95170.06,
        "low": 92841.48,
        "open": 95125.59,
        "time": 1735430400,
        "value": 93563.35,
        "volume": 3417.52751094,
      },
      {
        "close": 92620.71,
        "high": 94910.48,
        "low": 91271.19,
        "open": 93563.35,
        "time": 1735516800,
        "value": 92620.71,
        "volume": 15271.24432744,
      },
      {
        "close": 93354.22,
        "high": 96148.94,
        "low": 91887.13,
        "open": 92620.7,
        "time": 1735603200,
        "value": 93354.22,
        "volume": 10348.6325655,
      },
    ]
  `)
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Jul 20, 2015"`)
  expect(formatDate((records[records.length - 1].time as number) * 1000)).toMatchInlineSnapshot(
    `"Dec 31, 2024"`
  )
})

// skipped because it's slow, but it works
it.skip("should fetch WBTC prices using DefiLlama", async () => {
  // arrange
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices(
    accountName,
    [
      {
        coingeckoId: "test",
        id: "chain.ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC-1",
        priceApiId: "defi-llama",
        symbol: "WBTC",
      },
    ],
    async (state) => updates.push(state),
    undefined,
    { until: 1735682400000 }
  )
  const records = await getPricesForAsset(
    accountName,
    "chain.ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC-1"
  )
  // assert
  expect(updates).toMatchInlineSnapshot(`
    [
      [
        1,
        "Fetching asset prices for 1 assets",
      ],
      [
        2,
        "Fetching asset prices in batches of 10",
      ],
      [
        undefined,
        "Fetched WBTC-1 using DefiLlama from Jul 16, 2022 to Dec 31, 2024",
      ],
      [
        undefined,
        "Fetched WBTC-1 using DefiLlama from Jan 28, 2020 to Jul 15, 2022",
      ],
      [
        undefined,
        "Fetched WBTC-1 using DefiLlama from Jan 31, 2019 to Jan 27, 2020",
      ],
      [
        100,
      ],
    ]
  `)
  assertTimeConsistency(records)
  expect(records.slice(-3)).toMatchInlineSnapshot(`
    [
      {
        "time": 1735430400,
        "value": 94848,
      },
      {
        "time": 1735516800,
        "value": 93345,
      },
      {
        "time": 1735603200,
        "value": 92234,
      },
    ]
  `)
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Jan 31, 2019"`)
  expect(formatDate((records[records.length - 1].time as number) * 1000)).toMatchInlineSnapshot(
    `"Dec 31, 2024"`
  )
})

it("should fetch WBTC prices using Alchemy", async () => {
  // arrange
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices(
    accountName,
    [
      {
        coingeckoId: "test",
        id: "chain.ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC-2",
        priceApiId: "alchemy",
        symbol: "WBTC",
      },
    ],
    async (state) => updates.push(state),
    undefined,
    { until: 1735682400000 }
  )
  const records = await getPricesForAsset(
    accountName,
    "chain.ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC-2"
  )
  // assert
  expect(updates).toMatchInlineSnapshot(`
    [
      [
        1,
        "Fetching asset prices for 1 assets",
      ],
      [
        2,
        "Fetching asset prices in batches of 10",
      ],
      [
        undefined,
        "Fetched WBTC-2 using Alchemy from Jul 16, 2022 to Dec 31, 2024",
      ],
      [
        undefined,
        "Fetched WBTC-2 using Alchemy from Jan 28, 2020 to Jul 15, 2022",
      ],
      [
        undefined,
        "Fetched WBTC-2 using Alchemy from Feb 01, 2019 to Jan 27, 2020",
      ],
      [
        100,
      ],
    ]
  `)
  assertTimeConsistency(records)
  expect(records.slice(-3)).toMatchInlineSnapshot(`
    [
      {
        "time": 1735430400,
        "value": 94990.9075141471,
      },
      {
        "time": 1735516800,
        "value": 93856.9343126552,
      },
      {
        "time": 1735603200,
        "value": 92423.6634782479,
      },
    ]
  `)
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Feb 01, 2019"`)
  expect(formatDate((records[records.length - 1].time as number) * 1000)).toMatchInlineSnapshot(
    `"Dec 31, 2024"`
  )
})
