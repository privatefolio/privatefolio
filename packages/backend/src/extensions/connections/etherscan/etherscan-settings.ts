// https://api.etherscan.io/v2/chainlist

import { PlatformPrefix } from "src/settings/settings"

export const ETHEREUM_PLATFORM_ID = `${PlatformPrefix.Chain}ethereum`

export const SUPPORTED_PLATFORMS = [
  ETHEREUM_PLATFORM_ID,
  `${PlatformPrefix.Chain}abstract`,
  `${PlatformPrefix.Chain}apechain`,
  `${PlatformPrefix.Chain}arbitrum-nova`,
  `${PlatformPrefix.Chain}arbitrum-one`,
  `${PlatformPrefix.Chain}avalanche`,
  `${PlatformPrefix.Chain}base`,
  `${PlatformPrefix.Chain}berachain`,
  `${PlatformPrefix.Chain}bittorrent`,
  `${PlatformPrefix.Chain}blast`,
  `${PlatformPrefix.Chain}binance-smart-chain`,
  `${PlatformPrefix.Chain}celo`,
  `${PlatformPrefix.Chain}cronos`,
  `${PlatformPrefix.Chain}fraxtal`,
  `${PlatformPrefix.Chain}xdai`,
  `${PlatformPrefix.Chain}linea`,
  `${PlatformPrefix.Chain}mantle`,
  `${PlatformPrefix.Chain}memecore`,
  `${PlatformPrefix.Chain}moonbeam`,
  `${PlatformPrefix.Chain}moonriver`,
  `${PlatformPrefix.Chain}optimistic-ethereum`,
  `${PlatformPrefix.Chain}polygon-pos`,
  `${PlatformPrefix.Chain}polygon-zkevm`,
  `${PlatformPrefix.Chain}scroll`,
  `${PlatformPrefix.Chain}sonic`,
  `${PlatformPrefix.Chain}sophon`,
  `${PlatformPrefix.Chain}swellchain`,
  `${PlatformPrefix.Chain}taiko`,
  `${PlatformPrefix.Chain}unichain`,
  `${PlatformPrefix.Chain}wemix-network`,
  `${PlatformPrefix.Chain}world-chain`,
  `${PlatformPrefix.Chain}xai`,
  `${PlatformPrefix.Chain}xdc-network`,
  `${PlatformPrefix.Chain}zksync`,
  `${PlatformPrefix.Chain}opbnb`,
]

export const ETHERSCAN_API_KEY_V2 = "3JHR8S44XRG5VAN774EGSBY175A1QE2EZA"

export const etherscanConnExtension = "etherscan-connection"
