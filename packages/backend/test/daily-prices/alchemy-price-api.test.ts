import { getPair, mapToChartData, queryPrices } from "src/extensions/prices/alchemy-price-api"
import { ResolutionString } from "src/interfaces"
import { WETH_ASSET_ID } from "src/settings/settings"
import { ONE_DAY } from "src/utils/formatting-utils"
import { describe, expect, it } from "vitest"

describe("alchemy price api", () => {
  it("should fetch WETH prices within a range", async () => {
    // act
    const result = await queryPrices({
      limit: 3,
      pair: getPair(WETH_ASSET_ID),
      since: 1518566400000,
      timeInterval: "1d" as ResolutionString,
      until: 1518739200000 + ONE_DAY,
    })
    // assert
    expect(result.map(mapToChartData)).toMatchInlineSnapshot(`
      [
        {
          "time": 1518566400,
          "value": 839.535,
        },
        {
          "time": 1518652800,
          "value": 947.358,
        },
        {
          "time": 1518739200,
          "value": 886.961,
        },
      ]
    `)
  })

  it("should fetch WETH prices within a small range", async () => {
    // act
    const result = await queryPrices({
      limit: 1,
      pair: getPair(WETH_ASSET_ID),
      since: 1706572800000,
      timeInterval: "1d" as ResolutionString,
      until: 1706572800000 + ONE_DAY,
    })
    // assert
    expect(result.map(mapToChartData)).toMatchInlineSnapshot(`
      [
        {
          "time": 1706572800,
          "value": 2311.4839532359,
        },
      ]
    `)
  })

  it("should throw error for non-supported", async () => {
    // act
    const results = queryPrices({
      pair: "EFJAUSDT",
      timeInterval: "1d" as ResolutionString,
    })
    // assert
    await expect(results).rejects.toMatchInlineSnapshot(`[Error: Alchemy: NotFound]`)
  })
})
