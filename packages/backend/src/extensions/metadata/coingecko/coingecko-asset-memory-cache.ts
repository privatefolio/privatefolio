import { AssetMetadata } from "src/interfaces"
import { PLATFORMS_META, WETH_ASSET_ID } from "src/settings/platforms"

const ETH: AssetMetadata = {
  coingeckoId: "ethereum",
  logoUrl: `https://assets.coingecko.com/coins/images/279/large/ethereum.png`,
  name: "Ether",
  symbol: "ETH",
}

export const memoryCacheMap: Record<string, AssetMetadata> = {
  [PLATFORMS_META.base.nativeAssetId as string]: ETH,
  [PLATFORMS_META["arbitrum-one"].nativeAssetId as string]: ETH,
  [PLATFORMS_META.ethereum.nativeAssetId as string]: ETH,
  [WETH_ASSET_ID]: {
    coingeckoId: "weth",
    logoUrl: `https://assets.coingecko.com/coins/images/2518/standard/weth.png`,
    name: "Wrapped ETH",
    symbol: "WETH",
  },
  // TODO0
  // "binance:BUSD": {
  //   coingeckoId: "busd",
  //   logoUrl: `/${ASSET_FILES_LOCATION}/overrides/BUSD.svg`,
  //   name: "Binance USD",
  //   symbol: "BUSD",
  // },
  // "binance:EUR": {
  //   logoUrl: `/${ASSET_FILES_LOCATION}/overrides/EUR.png`,
  //   name: "Euro",
  //   symbol: "EUR",
  // },
}
