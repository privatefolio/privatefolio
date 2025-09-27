import { mapToChartData, queryPrices } from "src/extensions/prices/yahoo-price-api"
import { ResolutionString, Timestamp } from "src/interfaces"
import { PRICE_API_PAGINATION } from "src/settings/settings"
import { ONE_DAY } from "src/utils/formatting-utils"
import { assertTimeConsistency } from "src/utils/test-utils"
import { expect, it } from "vitest"

it("should fetch BTC prices within a range", async () => {
  // act
  const result = await queryPrices({
    limit: 3,
    pair: "BTC-USD",
    since: 1502928000000,
    timeInterval: "1d" as ResolutionString,
    until: 1503100800000,
  })
  // assert
  expect(result.map(mapToChartData)).toMatchInlineSnapshot(`
    [
      {
        "close": 4331.68994140625,
        "high": 4484.7001953125,
        "low": 4243.7099609375,
        "open": 4384.43994140625,
        "time": 1502928000,
        "value": 4331.68994140625,
        "volume": 2553359872,
      },
      {
        "close": 4160.6201171875,
        "high": 4370.1298828125,
        "low": 4015.39990234375,
        "open": 4324.33984375,
        "time": 1503014400,
        "value": 4160.6201171875,
        "volume": 2941710080,
      },
      {
        "close": 4193.7001953125,
        "high": 4243.259765625,
        "low": 3970.550048828125,
        "open": 4137.75,
        "time": 1503100800,
        "value": 4193.7001953125,
        "volume": 2975820032,
      },
    ]
  `)
})

it("should fetch BTC prices in correct order", async () => {
  const results = await queryPrices({
    pair: "BTC-USD",
    timeInterval: "1d" as ResolutionString,
  })
  const records = results.map(mapToChartData)
  assertTimeConsistency(records)
})

it("should throw an error", async () => {
  // act
  const promise = queryPrices({
    pair: "EFJAUSDT",
    since: 0,
    timeInterval: "1d" as ResolutionString,
    // until: 0,
  })
  // assert
  await expect(promise).rejects.toMatchInlineSnapshot(`[Error: Yahoo: Not Found]`)
})

it("should include today when limit is reached", async () => {
  const now = Date.now()
  const today: Timestamp = now - (now % ONE_DAY)
  const since = today - ONE_DAY * (PRICE_API_PAGINATION - 1)

  // act
  const result = await queryPrices({
    limit: 900,
    pair: "ETH-USD",
    since,
    timeInterval: "1d" as ResolutionString,
    until: today,
  })
  // assert
  const lastCandle = mapToChartData(result.slice(-1)[0])
  expect(result.length).toMatchInlineSnapshot(`900`)
  expect(lastCandle.time).toBe(today / 1000)
})
