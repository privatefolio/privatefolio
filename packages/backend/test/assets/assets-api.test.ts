import { getAsset, patchAsset, upsertAsset } from "src/api/account/assets-api" // Adjust the path if necessary
import { upsertAuditLog } from "src/api/account/audit-logs-api"
import { getAssetTicker } from "src/utils/assets-utils"
import { describe, expect, it } from "vitest"

const accountName = Math.random().toString(36).substring(7)

describe("assets", () => {
  it("should add an asset", async () => {
    // arrange
    const assetId = "chain.ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC"
    // act
    await upsertAuditLog(accountName, {
      assetId,
      change: "1",
      id: "",
      importIndex: 0,
      operation: "Deposit",
      platformId: "chain.ethereum",
      timestamp: 0,
      wallet: "",
    })
    await upsertAsset(accountName, {
      id: assetId,
      logoUrl: "https://example.com/logo.png",
      name: "Wrapped Bitcoin",
      symbol: getAssetTicker(assetId),
    })
    // assert
    const asset = await getAsset(accountName, assetId)
    expect(asset).toMatchInlineSnapshot(`
      {
        "coingeckoId": "wrapped-bitcoin",
        "id": "chain.ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC",
        "logoUrl": "https://example.com/logo.png",
        "marketCapRank": 12,
        "name": "Wrapped Bitcoin",
        "platforms": {
          "ethereum": "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
          "osmosis": "factory/osmo1z0qrq605sjgcqpylfl4aa6s90x738j7m58wyatt0tdzflg2ha26q67k743/wbtc",
          "solana": "5XZw2LKTyrfvfiskJ78AMpackRjPcyCif1WhUsPDuVqQ",
        },
        "symbol": "WBTC",
      }
    `)
  })

  it("should update an asset", async () => {
    // arrange
    const assetId = "ethereum:0x0000000000000000000000000000000000000000:ETH"
    await upsertAuditLog(accountName, {
      assetId,
      change: "1",
      id: "",
      importIndex: 0,
      operation: "Deposit",
      platformId: "chain.ethereum",
      timestamp: 0,
      wallet: "",
    })
    await upsertAsset(accountName, {
      coingeckoId: "ethereum",
      id: assetId,
      logoUrl: "https://example.com/logo.png",
      name: "Ether",
      priceApiId: "coinbase",
      symbol: getAssetTicker(assetId),
    })
    // act
    await patchAsset(accountName, assetId, {
      logoUrl: "logo.svg",
    })
    // assert
    const asset = await getAsset(accountName, assetId)
    expect(asset).toMatchInlineSnapshot(`
      {
        "coingeckoId": "ethereum",
        "id": "ethereum:0x0000000000000000000000000000000000000000:ETH",
        "logoUrl": "logo.svg",
        "marketCapRank": 2,
        "name": "Ether",
        "platforms": {},
        "priceApiId": "coinbase",
        "symbol": "ETH",
      }
    `)
  })

  it("should fetch asset infos", async () => {
    // arrange
    const assetId = "ethereum:0x0000000000000000000000000000000000000000:ETH"
    await upsertAsset(accountName, {
      coingeckoId: "ethereum",
      id: assetId,
      logoUrl: "https://example.com/logo.png",
      name: "Ether",
      priceApiId: "coinbase",
      symbol: getAssetTicker(assetId),
    })
    // act
    await patchAsset(accountName, assetId, {
      logoUrl: "logo.svg",
    })
    // assert
    const asset = await getAsset(accountName, assetId)
    expect(asset).toMatchInlineSnapshot(`
      {
        "coingeckoId": "ethereum",
        "id": "ethereum:0x0000000000000000000000000000000000000000:ETH",
        "logoUrl": "logo.svg",
        "marketCapRank": 2,
        "name": "Ether",
        "platforms": {},
        "priceApiId": "coinbase",
        "symbol": "ETH",
      }
    `)
  })
})
