import { PlatformMeta } from "src/interfaces"

export const WETH_ASSET_ID = "ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:WETH"
export const WBTC_ASSET_ID = "ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:WBTC"

export const PLATFORMS_META: Record<string, PlatformMeta> = {
  "c/abstract": {
    blockExplorer: {
      name: "AbsScan",
      url: "https://abscan.org",
    },
    chainId: 2741,
    nativeAssetId: "abstract:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/apechain": {
    blockExplorer: {
      name: "ApeScan",
      url: "https://apescan.io",
    },
    chainId: 33139,
    nativeAssetId: "apechain:0x0000000000000000000000000000000000000000:APE",
  },
  "c/arbitrum-nova": {
    blockExplorer: {
      name: "Arbitrum Nova Explorer",
      url: "https://nova.arbiscan.io",
    },
    chainId: 42170,
    nativeAssetId: "arbitrum-nova:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/arbitrum-one": {
    blockExplorer: {
      name: "ArbiScan",
      url: "https://arbiscan.io",
    },
    chainId: 42161,
    nativeAssetId: "arbitrum-one:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/avalanche": {
    blockExplorer: {
      name: "SnowScan",
      url: "https://snowscan.xyz",
    },
    chainId: 43114,
    nativeAssetId: "avalanche:0x0000000000000000000000000000000000000000:AVAX",
  },
  "c/base": {
    blockExplorer: {
      name: "BaseScan",
      url: "https://basescan.org",
    },
    chainId: 8453,
    nativeAssetId: "base:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/berachain": {
    blockExplorer: {
      name: "BeraScan",
      url: "https://berascan.com",
    },
    chainId: 80094,
    nativeAssetId: "berachain:0x0000000000000000000000000000000000000000:BERA",
  },
  "c/binance-smart-chain": {
    blockExplorer: {
      name: "BSCScan",
      url: "https://bscscan.com",
    },
    chainId: 56,
    nativeAssetId: "binance-smart-chain:0x0000000000000000000000000000000000000000:BNB",
  },
  "c/bittorrent": {
    blockExplorer: {
      name: "BTTC Scan",
      url: "https://bttcscan.com",
    },
    chainId: 199,
    nativeAssetId: "bittorrent:0x0000000000000000000000000000000000000000:BTT",
  },
  "c/blast": {
    blockExplorer: {
      name: "BlastScan",
      url: "https://blastscan.io",
    },
    chainId: 81457,
    nativeAssetId: "blast:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/celo": {
    blockExplorer: {
      name: "CeloScan",
      url: "https://celoscan.io",
    },
    chainId: 42220,
    nativeAssetId: "celo:0x0000000000000000000000000000000000000000:CELO",
  },
  "c/cronos": {
    blockExplorer: {
      name: "CronoScan",
      url: "https://cronoscan.com",
    },
    chainId: 25,
    nativeAssetId: "cronos:0x0000000000000000000000000000000000000000:CRO",
  },
  "c/ethereum": {
    blockExplorer: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
    chainId: 1,
    nativeAssetId: "ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/fraxtal": {
    blockExplorer: {
      name: "FraxScan",
      url: "https://fraxscan.com",
    },
    chainId: 252,
    nativeAssetId: "fraxtal:0x0000000000000000000000000000000000000000:frxETH",
  },
  "c/linea": {
    blockExplorer: {
      name: "LineaScan",
      url: "https://lineascan.build",
    },
    chainId: 59144,
    nativeAssetId: "linea:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/mantle": {
    blockExplorer: {
      name: "MantleScan",
      url: "https://mantlescan.xyz",
    },
    chainId: 5000,
    nativeAssetId: "mantle:0x0000000000000000000000000000000000000000:MNT",
  },
  "c/memecore": {
    blockExplorer: {
      name: "MemeScan",
      url: "https://memescan.io",
    },
    chainId: 4352,
    nativeAssetId: "memecore:0x0000000000000000000000000000000000000000:MEME",
  },
  "c/moonbeam": {
    blockExplorer: {
      name: "MoonScan",
      url: "https://moonscan.io",
    },
    chainId: 1284,
    nativeAssetId: "moonbeam:0x0000000000000000000000000000000000000000:GLMR",
  },
  "c/moonriver": {
    blockExplorer: {
      name: "MoonRiver Scan",
      url: "https://moonriver.moonscan.io",
    },
    chainId: 1285,
    nativeAssetId: "moonriver:0x0000000000000000000000000000000000000000:MOVR",
  },
  "c/opbnb": {
    blockExplorer: {
      name: "opBNB Scan",
      url: "https://opbnbscan.com",
    },
    chainId: 204,
    nativeAssetId: "opbnb:0x0000000000000000000000000000000000000000:BNB",
  },
  "c/optimistic-ethereum": {
    blockExplorer: {
      name: "Optimistic Etherscan",
      url: "https://optimistic.etherscan.io",
    },
    chainId: 10,
    nativeAssetId: "optimistic-ethereum:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/polygon-pos": {
    blockExplorer: {
      name: "PolygonScan",
      url: "https://polygonscan.com",
    },
    chainId: 137,
    nativeAssetId: "polygon-pos:0x0000000000000000000000000000000000000000:MATIC",
  },
  "c/polygon-zkevm": {
    blockExplorer: {
      name: "Polygon zkEVM Explorer",
      url: "https://zkevm.polygonscan.com",
    },
    chainId: 1101,
    nativeAssetId: "polygon-zkevm:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/scroll": {
    blockExplorer: {
      name: "ScrollScan",
      url: "https://scrollscan.com",
    },
    chainId: 534352,
    nativeAssetId: "scroll:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/sonic": {
    blockExplorer: {
      name: "SonicScan",
      url: "https://sonicscan.org",
    },
    chainId: 146,
    nativeAssetId: "sonic:0x0000000000000000000000000000000000000000:S",
  },
  "c/sophon": {
    blockExplorer: {
      name: "SophScan",
      url: "https://sophscan.xyz",
    },
    chainId: 50104,
    nativeAssetId: "sophon:0x0000000000000000000000000000000000000000:SOPH",
  },
  "c/swellchain": {
    blockExplorer: {
      name: "SwellScan",
      url: "https://swellchainscan.io",
    },
    chainId: 1923,
    nativeAssetId: "swellchain:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/taiko": {
    blockExplorer: {
      name: "TaikoScan",
      url: "https://taikoscan.io",
    },
    chainId: 167000,
    nativeAssetId: "taiko:0x0000000000000000000000000000000000000000:ETH",
  },
  "c/unichain": {
    blockExplorer: {
      name: "UniScan",
      url: "https://uniscan.xyz",
    },
    chainId: 130,
    nativeAssetId: "unichain:0x0000000000000000000000000000000000000000:UNI",
  },
  "c/wemix-network": {
    blockExplorer: {
      name: "WEMIX Scan",
      url: "https://wemixscan.com",
    },
    chainId: 1111,
    nativeAssetId: "wemix-network:0x0000000000000000000000000000000000000000:WEMIX",
  },
  "c/world-chain": {
    blockExplorer: {
      name: "WorldScan",
      url: "https://worldscan.org",
    },
    chainId: 480,
    nativeAssetId: "world-chain:0x0000000000000000000000000000000000000000:WLD",
  },
  "c/xai": {
    blockExplorer: {
      name: "XaiScan",
      url: "https://xaiscan.io",
    },
    chainId: 660279,
    nativeAssetId: "xai:0x0000000000000000000000000000000000000000:XAI",
  },
  "c/xdai": {
    blockExplorer: {
      name: "GnosisScan",
      url: "https://gnosisscan.io",
    },
    chainId: 100,
    nativeAssetId: "xdai:0x0000000000000000000000000000000000000000:xDAI",
  },
  "c/xdc-network": {
    blockExplorer: {
      name: "XDC Scan",
      url: "https://xdcscan.com",
    },
    chainId: 50,
    nativeAssetId: "xdc-network:0x0000000000000000000000000000000000000000:XDC",
  },
  "c/zksync": {
    blockExplorer: {
      name: "zkSync Era Explorer",
      url: "https://era.zksync.network",
    },
    chainId: 324,
    nativeAssetId: "zksync:0x0000000000000000000000000000000000000000:ETH",
  },
}

export function getBlockExplorerUrl(platformId: string, addr: string, type: string) {
  if (!(platformId in PLATFORMS_META)) {
    return ""
  }

  const { blockExplorer } = PLATFORMS_META[platformId]
  if (!blockExplorer) return ""

  return `${blockExplorer.url}/${type}/${addr}`
}

export function getBlockExplorerName(platformId: string) {
  if (!(platformId in PLATFORMS_META)) {
    return ""
  }

  const { blockExplorer } = PLATFORMS_META[platformId]
  if (!blockExplorer) return ""

  return blockExplorer.name
}

/**
 * RPC providers for different EVM chains.
 * Ordered by preference/reliability based on DefiLlama chainlist and other sources.
 * https://chainlist.org/
 * https://github.com/DefiLlama/chainlist/blob/main/constants/extraRpcs.js
 * https://github.com/DefiLlama/chainlist/blob/main/constants/llamaNodesRpcs.js
 */
export const RPC_PROVIDERS: Record<number, string[]> = {
  // Ethereum Mainnet (chainId: 1)
  1: [
    "https://ethereum-rpc.publicnode.com",
    "https://eth.llamarpc.com",
    "https://1rpc.io/eth",
    "https://ethereum.blockpi.network/v1/rpc/public",
    "https://eth-mainnet.public.blastapi.io",
    "https://eth-mainnet.g.alchemy.com/v2/demo",
    "https://cloudflare-eth.com",
    "https://eth.drpc.org",
  ],
  10: [
    "https://optimism-rpc.publicnode.com",
    "https://optimism.llamarpc.com",
    "https://1rpc.io/op",
    "https://optimism.blockpi.network/v1/rpc/public",
    "https://optimism-mainnet.public.blastapi.io",
    "https://opt-mainnet.g.alchemy.com/v2/demo",
  ],
  100: [
    "https://gnosis-rpc.publicnode.com",
    "https://gnosis.llamarpc.com",
    "https://rpc.gnosischain.com",
    "https://gnosis.blockpi.network/v1/rpc/public",
  ],
  1101: [
    "https://zkevm-rpc.com",
    "https://polygon-zkevm.drpc.org",
    "https://rpc.ankr.com/polygon_zkevm",
  ],
  1111: ["https://api.wemix.com", "https://wemix.drpc.org"],
  1284: [
    "https://rpc.api.moonbeam.network",
    "https://moonbeam.public.blastapi.io",
    "https://moonbeam.drpc.org",
  ],
  1285: ["https://rpc.api.moonriver.moonbeam.network", "https://moonriver.public.blastapi.io"],
  130: ["https://rpc.unichain.org"],
  137: [
    "https://polygon-rpc.com",
    "https://polygon.llamarpc.com",
    "https://1rpc.io/matic",
    "https://polygon.blockpi.network/v1/rpc/public",
    "https://polygon-mainnet.public.blastapi.io",
    "https://polygon-mainnet.g.alchemy.com/v2/demo",
  ],
  146: ["https://rpc.sonic.fantom.network"],
  167000: ["https://rpc.mainnet.taiko.xyz", "https://taiko.drpc.org"],
  1923: ["https://rpc.swell.network"],
  199: ["https://rpc.bittorrentchain.io", "https://bttc.trongrid.io"],
  204: ["https://opbnb-mainnet-rpc.bnbchain.org", "https://opbnb.publicnode.com"],
  25: [
    "https://evm.cronos.org",
    "https://cronos-rpc.elk.finance",
    "https://cronos.blockpi.network/v1/rpc/public",
  ],
  252: ["https://rpc.frax.com"],
  2741: ["https://api.mainnet.abs.xyz"],
  324: [
    "https://mainnet.era.zksync.io",
    "https://zksync-era-rpc.publicnode.com",
    "https://zksync.drpc.org",
  ],
  33139: ["https://apechain.caldera.xyz/http"],
  42161: [
    "https://arbitrum-one-rpc.publicnode.com",
    "https://arbitrum.llamarpc.com",
    "https://1rpc.io/arb",
    "https://arbitrum.blockpi.network/v1/rpc/public",
    "https://arbitrum-mainnet.public.blastapi.io",
    "https://arb-mainnet.g.alchemy.com/v2/demo",
  ],
  42170: ["https://nova.arbitrum.io/rpc", "https://arbitrum-nova.public.blastapi.io"],
  42220: ["https://forno.celo.org", "https://celo.drpc.org", "https://rpc.ankr.com/celo"],
  43114: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche-c-chain-rpc.publicnode.com",
    "https://avalanche.drpc.org",
    "https://1rpc.io/avax/c",
  ],
  4352: ["https://rpc.memecore.com"],
  480: ["https://worldchain-mainnet.g.alchemy.com/public"],
  50: ["https://rpc.xinfin.network", "https://erpc.xinfin.network", "https://rpc1.xinfin.network"],
  5000: ["https://rpc.mantle.xyz", "https://mantle-rpc.publicnode.com", "https://mantle.drpc.org"],
  50104: ["https://rpc.sophon.xyz"],
  534352: [
    "https://rpc.scroll.io",
    "https://scroll-mainnet.public.blastapi.io",
    "https://scroll.drpc.org",
  ],
  56: [
    "https://bsc-rpc.publicnode.com",
    "https://binance.llamarpc.com",
    "https://1rpc.io/bnb",
    "https://bsc.blockpi.network/v1/rpc/public",
    "https://bsc-mainnet.public.blastapi.io",
    "https://bsc-dataseed1.binance.org",
  ],
  59144: ["https://rpc.linea.build", "https://linea.drpc.org", "https://1rpc.io/linea"],
  660279: ["https://xai-chain.net/rpc"],
  80094: ["https://rpc.berachain.com"],
  81457: [
    "https://rpc.blast.io",
    "https://blast.din.dev/rpc",
    "https://blastl2-mainnet.public.blastapi.io",
  ],
  8453: [
    "https://base-rpc.publicnode.com",
    "https://base.llamarpc.com",
    "https://1rpc.io/base",
    "https://base.blockpi.network/v1/rpc/public",
    "https://base-mainnet.public.blastapi.io",
    "https://base-mainnet.g.alchemy.com/v2/demo",
  ],
}
