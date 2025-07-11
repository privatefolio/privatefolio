import { mapToChartData, queryPrices } from "src/extensions/prices/coinbase-price-api"
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
        "close": 4280.01,
        "high": 4469,
        "low": 4180,
        "open": 4370.01,
        "time": 1502928000,
        "value": 4280.01,
        "volume": 19980.89160504,
      },
      {
        "close": 4101.72,
        "high": 4350,
        "low": 3960.47,
        "open": 4280.01,
        "time": 1503014400,
        "value": 4101.72,
        "volume": 20823.05141554,
      },
      {
        "close": 4157.41,
        "high": 4186.1,
        "low": 4000,
        "open": 4101.72,
        "time": 1503100800,
        "value": 4157.41,
        "volume": 10502.74082464,
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
  await expect(promise).rejects.toMatchInlineSnapshot(`[Error: Coinbase: NotFound]`)
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
