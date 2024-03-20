/* eslint-disable jest/no-conditional-expect */
import fs from "fs"
import { join } from "path"
import { addFileImport } from "src/api/account/file-imports/file-imports-api"
import { fetchDailyPrices, getPricesForAsset } from "src/api/core/daily-prices-api"
import { resetAccount } from "src/api/database"
import { GITHUB_CI } from "src/env"
import { ProgressUpdate } from "src/stores/task-store"
import { formatDate } from "src/utils/formatting-utils"
import { beforeAll, expect, it } from "vitest"

const accountName = "red"

beforeAll(async () => {
  //
  await resetAccount(accountName)
  //
  const fileName = "coinmama.csv"
  const filePath = join("test/files", fileName)
  const buffer = await fs.promises.readFile(filePath, "utf8")
  const file = new File([buffer], fileName, { lastModified: 0, type: "text/csv" })
  await addFileImport(file, undefined, accountName)
})

it("should fetch no prices", async () => {
  // act
  const updates: ProgressUpdate[] = []
  await fetchDailyPrices({ assetIds: [] }, (state) => updates.push(state))
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
  await fetchDailyPrices({ assetIds: ["binance:BTC"] }, (state) => updates.push(state))
  const records = await getPricesForAsset("binance:BTC")
  // assert
  // console.log(updates.join("\n"))
  let prevRecord
  for (const record of records) {
    if (prevRecord && Number(record.time) !== Number(prevRecord.time) + 86400) {
      console.log(prevRecord, record)
      throw new Error("Inconsistency error")
    }

    prevRecord = record
  }
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
})

it("should fetch BTC prices using Coinbase", async () => {
  // arrange
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices({ assetIds: ["coinbase:BTC"] }, (state) => updates.push(state))
  const records = await getPricesForAsset("coinbase:BTC")
  // assert
  // console.log(updates.join("\n"))
  let prevRecord
  for (const record of records) {
    if (prevRecord && Number(record.time) !== Number(prevRecord.time) + 86400) {
      console.log(prevRecord, record)
      throw new Error("Inconsistency error")
    }

    prevRecord = record
  }
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

it.skip("should fetch WBTC prices using DefiLlama", async () => {
  // arrange
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices(
    { assetIds: ["ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC"] },
    (state) => updates.push(state)
  )
  const records = await getPricesForAsset(
    "ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC"
  )
  // assert
  // console.log(updates.join("\n"))
  let prevRecord
  for (const record of records) {
    if (prevRecord && Number(record.time) !== Number(prevRecord.time) + 86400) {
      console.log(prevRecord, record)
      throw new Error("Inconsistency error")
    }

    prevRecord = record
  }
  expect(records.slice(0, 1800)).toMatchSnapshot()
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Jan 31, 2019"`)
})
