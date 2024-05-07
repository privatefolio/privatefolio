import { OhlcData, SingleValueData, UTCTimestamp } from "lightweight-charts"

import {
  Erc20Transaction,
  InternalTransaction,
  NormalTransaction,
} from "./api/account/connections/integrations/etherscan-rpc"
import { ParserId, PlatformId, PriceApiId } from "./settings"

export type { PlatformId } from "./settings"

export type TransactionRole = "Maker" | "Taker"
export type TransactionSide = "BUY" | "SELL"
export const TRANSACTIONS_TYPES = [
  "Buy",
  "Sell",
  "Swap",
  "Deposit",
  "Withdraw",
  "Unknown",
  "Reward",
  "Unwrap",
  "Wrap",
] as const
export type TransactionType = (typeof TRANSACTIONS_TYPES)[number]

// type ExchangeId = "mexc" | "binance"

/**
 * Timestamp in milliseconds
 *
 * @example 1612137600000
 * @example asUTC(Date.now())
 */
export type Timestamp = number // Nominal<number, "Timestamp">

/**
 * Timestamp in seconds
 *
 * @example 161213760
 * @example asUTC(Date.now()) / 1000
 */
export type Time = UTCTimestamp

export interface Transaction {
  _id: string
  _rev?: string
  fee?: string
  feeAsset?: string
  feeN?: number
  importId: string
  importIndex: number
  incoming?: string
  incomingAsset?: string
  incomingN?: number
  notes?: string
  outgoing?: string
  outgoingAsset?: string
  outgoingN?: number
  platform: PlatformId
  price?: string
  priceN?: number
  role?: TransactionRole
  timestamp: Timestamp
  txHash?: string
  type: TransactionType
  wallet: string
}

export interface EtherscanTransaction extends Transaction {
  contractAddress?: string
  failed?: boolean
  // from?: string // TODO
  method?: string
  txHash: string
}

export type AuditLogOperation =
  | "Deposit"
  | "Buy"
  | "Buy with Credit Card"
  | "Sell"
  | "Fee"
  | "Withdraw"
  | "Funding Fee"
  | "Commission"
  | "Conversion"
  | "Insurance Fund"
  | "Transfer"
  | "Smart Contract"
  | "Realized Profit and Loss"
  | "Reward"
  | "Loan"
  | "Loan Repayment"
  | "Liquidation Repayment"
  | "API Rebate"
  | "Delivered Settelment"
  | "Referrer Rebates"
  | "Commission Rebate"
  | "Options Fee"
  | "Options Purchase"
  | "Auto Exchange"
  | "Increase Fee"

export interface Exchange {
  coingeckoId: string
  coingeckoTrustScore: number
  coingeckoTrustScoreRank: number
  country: string
  image: string
  name: string
  url: string
  year: number
}

export interface Blockchain {
  /**
   * EVM chainId
   */
  chainId: number
  coingeckoId: string
  image: string
  name: string
  /**
   * coingeckoId of the native coin
   */
  nativeCoinId: string
  shortName: string
}

export type PlatformMetadata = Exchange | Blockchain

export interface AuditLog {
  _id: string
  _rev?: string
  assetId: string
  balance?: string
  balanceN?: number
  change: string
  changeN: number
  importId: string
  importIndex: number
  operation: AuditLogOperation
  platform: PlatformId
  timestamp: Timestamp
  txId?: string
  wallet: string
}

export interface BinanceAuditLog extends AuditLog {
  account: string
  coin: string
  remark: string
  userId: string
  utcTime: string
}

export interface FileImport {
  _id: string
  _rev: string
  lastModified: number
  meta?: {
    assetIds: string[]
    integration: ParserId
    logs: number
    operations: AuditLogOperation[]
    platform: PlatformId
    rows: number
    transactions: number
    wallets: string[]
  }
  name: string
  size: number
  timestamp?: Timestamp
}

export interface Balance {
  _id: string // `${timestamp}_${x.assetId}`
  assetId: string
  balance: string
  balanceN: number
  price?: ChartData
  value?: number
}

export interface BalanceMap {
  _id: string // Timestamp as string
  /**
   * always a string, only timestamp is a number
   */
  [assetId: string]: string | number
  timestamp: Timestamp
}

export interface Networth {
  _id: string // Timestamp as string
  change: number
  changePercentage: number
  time: Time
  value: number
}

export type ChartData = SingleValueData &
  Partial<OhlcData> & {
    volume?: number
  }

export interface SavedPrice {
  _id: string
  assetId: string
  pair: string
  price: ChartData
  timestamp: number
}

/**
 * This is the generic type useful for declaring a nominal type,
 * which does not structurally matches with the base type and
 * the other types declared over the same base type
 *
 * Usage:
 * @example
 * type Index = Nominal<number, 'Index'>;
 * // let i: Index = 42; // this fails to compile
 * let i: Index = 42 as Index; // OK
 * @example
 * type TagName = Nominal<string, 'TagName'>;
 */
export declare type Nominal<T, Name extends string> = T & {
  [Symbol.species]: Name
}
/**
 * Resolution or time interval is a time period of one bar. Advanced Charts supports tick, intraday (seconds, minutes, hours), and DWM (daily, weekly, monthly) resolutions. The table below describes how to specify different types of resolutions:
 *
 * Resolution | Format | Example
 * ---------|----------|---------
 * Ticks | `xT` | `1T` — one tick
 * Seconds | `xS` | `1S` — one second
 * Minutes | `x` | `1` — one minute
 * Hours | `x` minutes | `60` — one hour
 * Days | `xD` | `1D` — one day
 * Weeks | `xW` | `1W` — one week
 * Months | `xM` | `1M` — one month
 * Years | `xM` months | `12M` — one year
 *
 * Refer to [Resolution](https://www.tradingview.com/charting-library-docs/latest/core_concepts/Resolution) for more information.
 */
export type ResolutionString = Nominal<string, "ResolutionString">

/**
 * [
 *   1499040000000,      // Kline open time
 *   "0.01634790",       // Open price
 *   "0.80000000",       // High price
 *   "0.01575800",       // Low price
 *   "0.01577100",       // Close price
 *   "148976.11427815",  // Volume
 *   1499644799999,      // Kline Close time
 *   "2434.19055334",    // Quote asset volume
 *   308,                // Number of trades
 *   "1756.87402397",    // Taker buy base asset volume
 *   "28.46694368",      // Taker buy quote asset volume
 *   "0"                 // Unused field, ignore.
 * ]
 */
export type BinanceKline = [
  Timestamp, // timestamp
  string, // open
  string, // high
  string, // low
  string, // close
  string // volume
]

/**
 * [
 *   1696564320,  // time - bucket start time
 *   27557.89,    // low - lowest price during the bucket interval
 *   27567.36,    // high - highest price during the bucket interval
 *   27566.42,    // open - opening price (first trade) in the bucket interval
 *   27562.16,    // close - closing price (last trade) in the bucket interval
 *   4.15468916   // volume - volume of trading activity during the bucket interval
 * ]
 */
export type CoinbaseBucket = [
  Time, // time
  number, // low
  number, // high
  number, // open
  number, // close
  number // volume
]

export type LlamaPrice = {
  price: number
  timestamp: Time
}

export type QueryRequest = {
  /**
   * @default 900 (PRICE_API_PAGINATION)
   */
  limit?: number
  pair: string
  /**
   * @warning If `until` is undefined, this is ignored too
   */
  since?: Timestamp
  timeInterval: ResolutionString
  /**
   * @warning If `since` is undefined, this is ignored too
   */
  until?: Timestamp
}
export const DEFAULT_POLLING_INTERVAL = 2_000

export interface Connection {
  _id: string
  _rev: string
  address?: string
  binanceWallets?: {
    coin: boolean
    cross: boolean
    isolated: boolean
    spot: boolean
    usd: boolean
  }
  key?: string
  label: string
  meta?: {
    assetIds: string[]
    logs: number
    operations: AuditLogOperation[]
    rows: number
    transactions: number
    wallets: string[]
  }
  platform: PlatformId
  secret?: string
  syncedAt?: number
  /**
   * createdAt
   */
  timestamp: Timestamp
}

export type EtherscanConnection = Connection & {
  address: string
}
export type BinanceConnection = Connection & {
  key: string
  secret: string
}

export type ParserResult = { logs: AuditLog[]; txns?: Transaction[] }
export type CsvParser = (
  csvRow: string,
  index: number,
  fileImportId: string,
  parserContext: Record<string, unknown>
) => ParserResult
export type EvmParser = (
  row: NormalTransaction | InternalTransaction | Erc20Transaction,
  index: number,
  connectionId: string
) => ParserResult

export type ParserContextFn = (req: string[]) => Promise<Record<string, unknown>>

export type SyncResult = {
  assetMap: Record<string, boolean>
  logMap: Record<string, AuditLog>
  /**
   * blockNumber or timestamp
   */
  newCursor: string
  operationMap: Partial<Record<AuditLogOperation, boolean>>
  rows: number
  txMap: Record<string, Transaction>
  walletMap: Record<string, boolean>
}

export interface CoingeckoMetadataFull {
  // additional_notices: any[]
  asset_platform_id: string
  block_time_in_minutes: number
  categories: string[]
  contract_address: string
  country_origin: string
  description: {
    en: string
  }
  detail_platforms: {
    [key: string]: {
      contract_address: string
      decimal_place: number
    }
  }
  genesis_date: null | string
  hashing_algorithm: null | string
  id: string
  image: {
    large: string
    small: string
    thumb: string
  }
  last_updated: string
  links: {
    announcement_url: string[]
    bitcointalk_thread_identifier: null | string
    blockchain_site: string[]
    chat_url: string[]
    facebook_username: string
    homepage: string[]
    official_forum_url: string[]
    repos_url: {
      bitbucket: string[]
      github: string[]
    }
    subreddit_url: string
    telegram_channel_identifier: string
    twitter_screen_name: string
    whitepaper: string
  }
  market_cap_rank: number
  name: string
  platforms: {
    [key: string]: string
  }
  preview_listing: boolean
  public_notice: null | string
  sentiment_votes_down_percentage: number
  sentiment_votes_up_percentage: number
  // status_updates: any[]
  symbol: string
  watchlist_portfolio_users: number
  web_slug: string
}

export interface CoingeckoMetadataShort {
  logoUrl: string
  name: string
}

export interface AssetMetadata {
  coingeckoId?: string
  logoUrl: string
  name: string
  symbol: string
}

export interface Asset extends Partial<AssetMetadata> {
  _id: string
  priceApiId?: PriceApiId
  symbol: string
}

export interface FullAsset extends Asset {
  price?: ChartData | null
}

/**
 * Example: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` (WETH)
 */
export type Web3Address = string

export type CsvData = (string | number | undefined)[][]

export type FilterOptionsMap = {
  assetId: string[]
  feeAsset: string[]
  incomingAsset: string[]
  operation: AuditLogOperation[]
  outgoingAsset: string[]
  platform: string[]
  type: readonly TransactionType[]
  wallet: string[]
}

export type AssetId = string
