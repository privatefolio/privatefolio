import { getPair, mapToChartData, queryPrices } from "src/extensions/prices/binance-price-api"
import { ResolutionString, Timestamp } from "src/interfaces"
import { GITHUB_CI } from "src/server-env"
import { PRICE_API_PAGINATION } from "src/settings/settings"
import { expect, it } from "vitest"

it("should fetch BTC prices within a range", async (test) => {
  if (GITHUB_CI) {
    test.skip()
  }
  // act
  const result = await queryPrices({
    limit: 3,
    pair: getPair("binance:BTC"),
    since: 1502928000000,
    timeInterval: "1d" as ResolutionString,
    until: 1503100800000,
  })
  // assert
  expect(result.map(mapToChartData)).toMatchInlineSnapshot(`
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

it("should throw an error", async (test) => {
  if (GITHUB_CI) {
    test.skip()
  }
  // act
  const promise = queryPrices({
    pair: getPair("binance:EFJA"),
    since: 0,
    timeInterval: "1d" as ResolutionString,
    // until: 0,
  })
  // assert
  await expect(promise).rejects.toMatchInlineSnapshot(`[Error: Binance: Invalid symbol. (-1121)]`)
})

it("should fetch ETH prices within a range", async (test) => {
  if (GITHUB_CI) {
    test.skip()
  }
  // act
  const result = await queryPrices({
    limit: 3,
    pair: getPair("binance:ETH"),
    since: 1518566400000,
    timeInterval: "1d" as ResolutionString,
    until: 1518739200000,
  })
  // assert
  expect(result.map(mapToChartData)).toMatchInlineSnapshot(`
    [
      {
        "close": 919.09,
        "high": 924.99,
        "low": 841.3,
        "open": 841.57,
        "time": 1518566400,
        "value": 919.09,
        "volume": 150342.85558,
      },
      {
        "close": 924.55,
        "high": 946.66,
        "low": 895.59,
        "open": 919.09,
        "time": 1518652800,
        "value": 924.55,
        "volume": 155637.78524,
      },
      {
        "close": 938.67,
        "high": 948.48,
        "low": 901.36,
        "open": 924.55,
        "time": 1518739200,
        "value": 938.67,
        "volume": 115540.16349,
      },
    ]
  `)
})

it("should include today when limit is reached", async (test) => {
  if (GITHUB_CI) {
    test.skip()
  }
  const now = Date.now()
  const today: Timestamp = now - (now % 86400000)
  const since = today - 86400000 * (PRICE_API_PAGINATION - 1)

  // act
  const result = await queryPrices({
    pair: getPair("binance:ETH"),
    since,
    timeInterval: "1d" as ResolutionString,
    until: today,
  })
  // assert
  const lastCandle = mapToChartData(result.slice(-1)[0])
  expect(result.length).toMatchInlineSnapshot(`900`)
  expect(lastCandle.time).toBe(today / 1000)
})
