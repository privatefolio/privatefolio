import { getPair, mapToChartData, queryPrices } from "src/api/core/prices/redstone-price-api"
import { ResolutionString } from "src/interfaces"
import { expect, it } from "vitest"

it("should fetch WETH prices within a range", async () => {
  // act
  const result = await queryPrices({
    limit: 3,
    pair: getPair("ethereum:0x0000000000000000000000000000000000000000:ETH"),
    since: 1678492800000,
    timeInterval: "1d" as ResolutionString,
    until: 1678665600000,
  })
  // assert
  expect(result.map(mapToChartData)).toMatchInlineSnapshot(`
    [
      {
        "time": 1678492800,
        "value": 1412.7996984656315,
      },
      {
        "time": 1678579200,
        "value": 1454.6308739353958,
      },
      {
        "time": 1678665600,
        "value": 1496.8217721054866,
      },
    ]
  `)
})

it("should fetch WETH prices within a small range", async () => {
  // act
  const result = await queryPrices({
    limit: 1,
    pair: getPair("ethereum:0x0000000000000000000000000000000000000000:ETH"),
    since: 1706572800000,
    timeInterval: "1d" as ResolutionString,
    until: 1706572800000,
  })
  // assert
  expect(result.map(mapToChartData)).toMatchInlineSnapshot(`
    [
      {
        "time": 1706572800,
        "value": 2317.396413824004,
      },
    ]
  `)
})

it("should return 0 for non-supported", async () => {
  // act
  const results = await queryPrices({
    pair: "EFJA",
    timeInterval: "1d" as ResolutionString,
  })
  // assert
  expect(results.length).toBe(0)
})
