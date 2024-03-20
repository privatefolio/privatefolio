import { getPair, mapToChartData, queryPrices } from "src/api/core/prices/redstone-price-api"
import { GITHUB_CI } from "src/env"
import { ResolutionString } from "src/interfaces"
import { PLATFORMS_META } from "src/settings"
import { expect, it } from "vitest"

it("should fetch WETH prices within a range", async () => {
  // act
  const result = await queryPrices({
    limit: 3,
    pair: getPair(PLATFORMS_META.ethereum.nativeAssetId as string),
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

it("should return 0 for non-supported", async () => {
  // act
  const results = await queryPrices({
    pair: "EFJA",
    timeInterval: "1d" as ResolutionString,
  })
  // assert
  expect(results.length).toBe(0)
})

it("should fetch WETH prices within a small range", async (test) => {
  if (GITHUB_CI) {
    test.skip()
  }
  // act
  const result = await queryPrices({
    limit: 1,
    pair: getPair(PLATFORMS_META.ethereum.nativeAssetId as string),
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
