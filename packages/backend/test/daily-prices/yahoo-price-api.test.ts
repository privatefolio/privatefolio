import { mapToChartData, queryPrices } from "src/extensions/prices/yahoo-price-api"
import { ResolutionString, Timestamp } from "src/interfaces"
import { PRICE_API_PAGINATION } from "src/settings/settings"
import { formatDate, formatDateWithHour, ONE_DAY } from "src/utils/formatting-utils"
import { assertTimeConsistency } from "src/utils/test-utils"
import { expect, it } from "vitest"

it("should fetch BTC prices within a range", async () => {
  // act
  let result = await queryPrices({
    limit: 3,
    pair: "BTC-USD",
    since: Date.UTC(2017, 7, 17, 0, 0, 0, 0),
    timeInterval: "1d" as ResolutionString,
    until: Date.UTC(2017, 7, 19, 0, 0, 0, 0),
  })
  // assert
  result = result.map(mapToChartData)
  expect(result).toMatchInlineSnapshot(`
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
  expect(formatDateWithHour(result[0].time * 1000, { timeZone: "UTC" })).toMatchInlineSnapshot(
    `"August 17, 2017 at 00:00"`
  )
  expect(
    formatDateWithHour(result[result.length - 1].time * 1000, { timeZone: "UTC" })
  ).toMatchInlineSnapshot(`"August 19, 2017 at 00:00"`)
})

it("should fetch AMD prices within a range", async () => {
  // act
  let result = await queryPrices({
    limit: 3,
    pair: "AMD",
    since: Date.UTC(2017, 7, 17, 0, 0, 0, 0),
    timeInterval: "1d" as ResolutionString,
    until: Date.UTC(2017, 7, 19, 0, 0, 0, 0),
  })
  // assert
  result = result.map(mapToChartData)
  expect(result).toMatchInlineSnapshot(`
    [
      {
        "close": 12.34000015258789,
        "high": 12.649999618530273,
        "low": 12.319999694824219,
        "open": 12.460000038146973,
        "time": 1502928000,
        "value": 12.34000015258789,
        "volume": 47371000,
      },
      {
        "close": 12.369999885559082,
        "high": 12.5600004196167,
        "low": 12.25,
        "open": 12.430000305175781,
        "time": 1503014400,
        "value": 12.369999885559082,
        "volume": 37521700,
      },
    ]
  `)
  expect(formatDateWithHour(result[0].time * 1000)).toMatchInlineSnapshot(
    `"August 17, 2017 at 03:00"`
  )
  expect(formatDateWithHour(result[result.length - 1].time * 1000)).toMatchInlineSnapshot(
    `"August 18, 2017 at 03:00"`
  )
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
  await expect(promise).rejects.toMatchInlineSnapshot(
    `[Error: Yahoo: Not Found No data found, symbol may be delisted]`
  )
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

it("should fetch last 7 records", async () => {
  // act
  const result = await queryPrices({
    limit: 7,
    pair: "AMD",
    timeInterval: "1d" as ResolutionString,
  })
  // assert
  expect(result.length).toBeGreaterThanOrEqual(5)
  expect(result.length).toBeLessThanOrEqual(7)
})

it("should fetch last 7 records with until", async () => {
  // act
  const result = await queryPrices({
    limit: 7,
    pair: "AMD",
    timeInterval: "1d" as ResolutionString,
    until: Date.UTC(2025, 8, 16, 0, 0, 0, 0), // 16 Sep 2025
  })
  expect(result.length).toBe(7)
  expect(formatDate(result[0].time * 1000)).toMatchInlineSnapshot(`"Sep 10, 2025"`)
  expect(formatDate(result[result.length - 1].time * 1000)).toMatchInlineSnapshot(`"Sep 16, 2025"`)
})

it("should fetch last 7 records with since", async () => {
  // act
  const result = await queryPrices({
    limit: 7,
    pair: "AMD",
    since: Date.UTC(2025, 8, 9, 0, 0, 0, 0), // 9 Sep 2025
    timeInterval: "1d" as ResolutionString,
  })
  // assert
  expect(formatDate(result[0].time * 1000)).toMatchInlineSnapshot(`"Sep 10, 2025"`)
  expect(formatDate(result[result.length - 1].time * 1000)).toMatchInlineSnapshot(`"Sep 16, 2025"`)
  expect(result.length).toBeGreaterThanOrEqual(5)
  expect(result.length).toBeLessThanOrEqual(7)
})

it("should fetch early amd history", async () => {
  // act
  const result = await queryPrices({
    limit: 7,
    pair: "AMD",
    since: Date.UTC(2000, 0, 1, 0, 0, 0, 0),
    timeInterval: "1d" as ResolutionString,
  })
  expect(formatDate(result[0].time * 1000)).toMatchInlineSnapshot(`"Jan 03, 2000"`)
  expect(formatDate(result[result.length - 1].time * 1000)).toMatchInlineSnapshot(`"Jan 07, 2000"`)
  expect(result.map(mapToChartData)).toMatchInlineSnapshot(`
    [
      {
        "close": 15.5,
        "high": 15.59375,
        "low": 14.6875,
        "open": 14.96875,
        "time": 946857600,
        "value": 15.5,
        "volume": 7843200,
      },
      {
        "close": 14.625,
        "high": 15.5,
        "low": 14.59375,
        "open": 15.125,
        "time": 946944000,
        "value": 14.625,
        "volume": 6290200,
      },
      {
        "close": 15,
        "high": 15.0625,
        "low": 14,
        "open": 14.53125,
        "time": 947030400,
        "value": 15,
        "volume": 8204600,
      },
      {
        "close": 16,
        "high": 16,
        "low": 15.25,
        "open": 15.5,
        "time": 947116800,
        "value": 16,
        "volume": 11489400,
      },
      {
        "close": 16.25,
        "high": 16.40625,
        "low": 15.375,
        "open": 15.40625,
        "time": 947203200,
        "value": 16.25,
        "volume": 8543400,
      },
    ]
  `)
})
