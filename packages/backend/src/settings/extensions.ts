import { extensionId as binanceConnectionId } from "src/extensions/connections/binance/binance-connector"
import { extensionId as etherscanConnectionId } from "src/extensions/connections/etherscan/etherscan-connector"
import { SUPPORTED_PLATFORMS as etherscanPlatforms } from "src/extensions/connections/etherscan/etherscan-settings"
import {
  extensionId as binanceFileImportId,
  platformId as binanceFileImportPlatform,
} from "src/extensions/file-imports/binance"
import {
  extensionId as blockpitFileImportId,
  platformId as blockpitFileImportPlatform,
} from "src/extensions/file-imports/blockpit"
import {
  extensionId as coinmamaFileImportId,
  platformId as coinmamaFileImportPlatform,
} from "src/extensions/file-imports/coinmama"
import { extensionId as etherscanFileImportId } from "src/extensions/file-imports/etherscan"
import {
  extensionId as mexcFileImportId,
  platformId as mexcFileImportPlatform,
} from "src/extensions/file-imports/mexc"
import {
  extensionId as privatefolioFileImportId,
  platformId as privatefolioFileImportPlatform,
} from "src/extensions/file-imports/privatefolio-transactions"
import { BINANCE_PLATFORM_ID } from "src/extensions/utils/binance-utils"
import { Extension } from "src/interfaces"

export const extensions: Extension[] = [
  {
    authorGithub: "kernelwhisperer",
    description: "Get assets, exchanges and blockchain data from CoinGecko.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/coingecko.svg",
    extensionName: "CoinGecko",
    extensionType: "metadata",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: "coingecko-metadata",
    platformIds: [],
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["assets"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/api/account/assets-api.ts",
      },
      {
        tags: ["platforms"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/api/account/platforms-api.ts",
      },
      {
        tags: ["cache"],
        url: "https://github.com/privatefolio/coingecko",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description: "Import your Binance account statement.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/binance.svg",
    extensionName: "Binance",
    extensionType: "file-import",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    howTo: "BinanceHelp",
    id: binanceFileImportId,
    platformIds: [binanceFileImportPlatform],
    publishedAt: new Date("2023-11-15").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/binance.ts",
      },
      {
        tags: ["utils"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/utils/binance-utils.ts",
      },
      {
        tags: ["how-to"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/frontend/src/extensions/BinanceHelp.tsx",
      },
    ],
    updatedAt: new Date("2025-06-04").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description: "This extension allows you to import your MEXC trades.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/mexc.svg",
    extensionName: "MEXC",
    extensionType: "file-import",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: mexcFileImportId,
    platformIds: [mexcFileImportPlatform],
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/mexc.ts",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description: "Import transaction data from Blockpit exports.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/blockpit.png",
    extensionName: "Blockpit",
    extensionType: "file-import",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: blockpitFileImportId,
    platformIds: [blockpitFileImportPlatform],
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/blockpit.ts",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description: "Import your Coinmama purchase history.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/coinmama.png",
    extensionName: "Coinmama",
    extensionType: "file-import",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: coinmamaFileImportId,
    platformIds: [coinmamaFileImportPlatform],
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/coinmama.ts",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description:
      "Import Ethereum transactions, ERC-20 transfers, internal transactions, block rewards, and beacon chain withdrawals from Etherscan and other EVM explorers.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/etherscan.svg",
    extensionName: "Etherscan",
    extensionType: "file-import",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    howTo: "EtherscanHelp",
    id: etherscanFileImportId,
    platformIds: etherscanPlatforms,
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/etherscan.ts",
      },
      {
        tags: ["erc20"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/etherscan-erc20.ts",
      },
      {
        tags: ["beacon-withdrawals"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/etherscan-beacon-withdrawals.ts",
      },
      {
        tags: ["block-reward"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/etherscan-block-reward.ts",
      },
      {
        tags: ["internal-transactions"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/etherscan-internal.ts",
      },
      {
        tags: ["utils"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/utils/etherscan-utils.ts",
      },
      {
        tags: ["how-to"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/frontend/src/extensions/EtherscanHelp.tsx",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description: "Import Privatefolio transaction exports.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/privatefolio.svg",
    extensionName: "Privatefolio",
    extensionType: "file-import",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    howTo: "PrivatefolioHelp",
    id: privatefolioFileImportId,
    platformIds: [privatefolioFileImportPlatform],
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/file-imports/privatefolio-transactions.ts",
      },
      {
        tags: ["how-to"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/frontend/src/extensions/PrivatefolioHelp.tsx",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description:
      "Connect to your Binance account to automatically sync spot, margin, and futures transactions.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/binance.svg",
    extensionName: "Binance",
    extensionType: "connection",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: binanceConnectionId,
    platformIds: [BINANCE_PLATFORM_ID],
    priceUsd: 20,
    publishedAt: new Date("2025-06-01").getTime(),
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description:
      "Connect to EVM-compatible blockchains to automatically sync transactions and balances.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/etherscan.svg",
    extensionName: "Etherscan",
    extensionType: "connection",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: etherscanConnectionId,
    platformIds: etherscanPlatforms,
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/connections/etherscan/etherscan.ts",
      },
      {
        tags: ["utils"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/utils/etherscan-utils.ts",
      },
      {
        tags: ["rpc"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/connections/etherscan-rpc.ts",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description: "Get real-time and historical price data from Binance exchange.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/binance.svg",
    extensionName: "Binance",
    extensionType: "price-api",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: "binance-price-api",
    platformIds: [BINANCE_PLATFORM_ID],
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/prices/binance-price-api.ts",
      },
      {
        tags: ["config"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/settings/price-apis.ts",
      },
      {
        tags: ["tests"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/test/daily-prices/binance-price-api.test.ts",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description: "Get real-time and historical price data from Coinbase exchange.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/coinbase.svg",
    extensionName: "Coinbase",
    extensionType: "price-api",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: "coinbase-price-api",
    platformIds: ["e;gdax"],
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/prices/coinbase-price-api.ts",
      },
      {
        tags: ["config"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/settings/price-apis.ts",
      },
      {
        tags: ["tests"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/test/daily-prices/coinbase-price-api.test.ts",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description: "Get DeFi token prices and historical data from DefiLlama.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/defi-llama.png",
    extensionName: "DefiLlama",
    extensionType: "price-api",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: "defi-llama-price-api",
    platformIds: [],
    publishedAt: new Date("2025-06-01").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/prices/llama-price-api.ts",
      },
      {
        tags: ["config"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/settings/price-apis.ts",
      },
      {
        tags: ["tests"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/test/daily-prices/llama-price-api.test.ts",
      },
    ],
    updatedAt: new Date("2025-06-01").getTime(),
  },
  {
    authorGithub: "kernelwhisperer",
    description:
      "Get historical asset prices, aggregated from decentralized & centralized exchanges by Alchemy.",
    extensionLogoUrl: "$STATIC_ASSETS/extensions/alchemy.svg",
    extensionName: "Alchemy",
    extensionType: "price-api",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: "alchemy-price-api",
    platformIds: [],
    publishedAt: new Date("2025-06-11").getTime(),
    sources: [
      {
        tags: ["root"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/extensions/prices/alchemy-price-api.ts",
      },
      {
        tags: ["config"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/src/settings/price-apis.ts",
      },
      {
        tags: ["tests"],
        url: "https://github.com/privatefolio/privatefolio/tree/main/packages/backend/test/daily-prices/alchemy-price-api.test.ts",
      },
    ],
    updatedAt: new Date("2025-06-11").getTime(),
  },
]
