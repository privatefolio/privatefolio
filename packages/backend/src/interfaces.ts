import type { BinancePair } from "./extensions/connections/binance/binance-api"
import { BinanceWalletId } from "./extensions/connections/binance/binance-settings"
import type {
  Erc20Transaction,
  InternalTransaction,
  NormalTransaction,
} from "./extensions/connections/etherscan/etherscan-rpc"
import { ModelCapability, ModelFamily } from "./settings/assistant-models"
import type { PriceApiId } from "./settings/settings"

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
  "Approve",
  "Other",
] as const
export type TransactionType = (typeof TRANSACTIONS_TYPES)[number]

export const MANUAL_TX_TYPES: TransactionType[] = ["Swap", "Deposit", "Withdraw", "Other"]

export const TRADE_TYPES = [
  "Long",
  "Short",
  // "Borrow"
] as const
export type TradeType = (typeof TRADE_TYPES)[number]
export type TradeStatus = "open" | "closed"

// type ExchangeId = "mexc" | "binance"

/**
 * Timestamp in milliseconds
 *
 * @example 1612137600000
 * @example asUTC(Date.now())
 */
export type Timestamp = number // Nominal<number, "Timestamp">

/**
 * Timestamp in seconds, used in lightweight-charts
 *
 * @example 161213760
 * @example asUTC(Date.now()) / 1000
 */
export type Time = number

export interface EtherscanMetadata {
  contractAddress?: string
  failed?: boolean
  from?: string // TODO8 TESTME
  method?: string
  txHash: string
}

export interface Transaction {
  connectionId?: string
  fee?: string
  feeAsset?: string
  fileImportId?: string
  id: string
  importIndex: number
  incoming?: string
  incomingAsset?: string
  metadata: Record<string, unknown> | EtherscanMetadata
  notes?: string
  outgoing?: string
  outgoingAsset?: string
  platformId: string
  /**
   * outgoing / incoming
   */
  price?: string
  role?: TransactionRole
  tags?: number[]
  timestamp: Timestamp
  type: TransactionType
  wallet: string
}

export type EtherscanTransaction = Transaction & {
  metadata: EtherscanMetadata
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
  | "Margin Loan"
  | "Margin Repayment"
  | "Liquidation Repayment"
  | "API Rebate"
  | "Delivered Settelment"
  | "Referrer Rebates"
  | "Commission Rebate"
  | "Options Fee"
  | "Options Purchase"
  | "Auto Exchange"
  | "Increase Fee"
  | "Unknown"
  | "Mint"
  | "Wrap"

export interface Exchange {
  coingeckoTrustRank?: number
  /**
   * 0-10
   */
  coingeckoTrustScore: number
  country?: string
  extensionsIds?: string[]
  id: string
  image: string
  name: string
  supported?: boolean
  url: string
  year: number
}

export interface Blockchain {
  /**
   * EVM chainId
   */
  chainId: number
  extensionsIds?: string[]
  id: string
  image: string
  name: string
  /**
   * coingeckoId of the native coin
   */
  nativeCoinId: string
  supported?: boolean
}

export type Platform = Exchange | Blockchain

export interface AuditLog {
  assetId: string
  /**
   * Cumulative balance of all wallets
   */
  balance?: string
  /**
   * Balance of the wallet
   */
  balanceWallet?: string
  change: string
  connectionId?: string
  fileImportId?: string
  id: string
  importIndex: number
  operation: AuditLogOperation
  platformId: string
  tags?: number[]
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
  id: string
  lastModified: number
  meta?: {
    assetIds: string[]
    extensionId: string
    logs: number
    operations: AuditLogOperation[]
    parserId: string
    platformId: string
    rows: number
    transactions: number
    wallets: string[]
  }
  name: string
  size: number
  timestamp?: Timestamp
}

export type ChartData = {
  close?: number
  high?: number
  low?: number
  open?: number
  time: Time
  value: number
  volume?: number
}

export type StackedAreaData = {
  assets: string[]
  time: Time
  values: number[]
}

export interface Balance {
  assetId: string
  balance: string
  balanceN: number
  id: string // `${timestamp}_${x.assetId}`
  price?: ChartData
  value?: number
}

export type TradeCost = [
  assetId: string,
  amount: string,
  usdValue: string,
  exposure: string,
  txId: string,
  timestamp: Timestamp,
]

export type TradeProceeds = [
  assetId: string,
  amount: string,
  usdValue: string,
  cost: string,
  txId: string,
  timestamp: Timestamp,
]

export type TradeValue = [
  assetId: string,
  amount: string,
  usdValue: string,
  txId: string,
  timestamp: Timestamp,
]

export interface Trade {
  amount: number
  assetId: string
  auditLogIds?: string[]
  balance: number
  closedAt?: Timestamp
  cost: TradeCost[]
  createdAt: Timestamp
  deposits: TradeValue[]
  duration?: number
  fees: TradeValue[]
  id: string
  proceeds: TradeProceeds[]
  tags?: number[]
  tradeNumber: number
  tradeStatus: "open" | "closed"
  tradeType: TradeType
  txIds?: string[]
}

export interface BalanceMap {
  /**
   * always a string, only timestamp is a number
   */
  [assetId: string]: string | number
  timestamp: Timestamp
}

export interface Networth {
  change: number
  changePercentage: number
  time: Time
  timestamp: Timestamp
  value: number
}

export interface DailyPrice {
  assetId: string
  id: string
  pair?: string
  price: ChartData
  priceApiId?: PriceApiId
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
  string, // volume
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
  number, // volume
]

export type LlamaPrice = {
  price: number
  timestamp: Time
}

/**
 * @example
 * {
 *   "value": "105384.7422814993",
 *   "timestamp": "2025-06-14T02:50:30Z"
 * }
 */
export type AlchemyPrice = {
  timestamp: string
  value: string
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

export type ConnectionOptions = {
  sinceLimit?: Timestamp
  untilLimit?: Timestamp
}

export type BinanceConnectionOptions = ConnectionOptions & {
  symbols?: BinancePair[] // useful in testing
  wallets: Record<BinanceWalletId, boolean>
}

export interface Connection {
  address?: string
  apiKey?: string
  apiSecret?: string
  connectionNumber: number
  extensionId: string
  id: string
  meta?: {
    assetIds: string[]
    logs: number
    operations: AuditLogOperation[]
    rows: number
    transactions: number
    wallets: string[]
  }
  options?: BinanceConnectionOptions | ConnectionOptions
  platformId: string
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
  options: BinanceConnectionOptions
  secret: string
}

export type ParserResult = { logs: AuditLog[]; txns?: Transaction[] }

export type CsvParseFn = (
  csvRow: string,
  index: number,
  fileImportId: string,
  parserContext: Record<string, unknown>,
  header: string
) => ParserResult

export type CsvParser = {
  extensionId: string
  parse: CsvParseFn
  parserId: string
  platformId: string
  requirements?: string[]
}

export type EvmParser = (
  row: NormalTransaction | InternalTransaction | Erc20Transaction,
  index: number,
  connectionId: string
) => ParserResult

export type SyncResult = {
  assetMap: Record<string, boolean>
  logMap: Record<string, AuditLog>
  /**
   * blockNumber or timestamp
   */
  newCursor: number
  operationMap: Partial<Record<AuditLogOperation, boolean>>
  rows: number
  txMap: Record<string, Transaction>
  walletMap: Record<string, boolean>
}

type Language = string

export type CoingeckoTickerData = {
  base: string
  bid_ask_spread_percentage?: number
  coin_id: string
  converted_last: Record<string, number>
  converted_volume: Record<string, number>
  is_anomaly: boolean
  is_stale: boolean
  last: number
  last_fetch_at?: string
  last_traded_at?: string
  market: {
    has_trading_incentive: boolean
    identifier: string
    name: string
  }
  target: string
  target_coin_id?: string
  timestamp?: string
  token_info_url?: string | null
  trade_url?: string
  trust_score?: "green" | "yellow" | "red"
}

export interface CoingeckoMetadataFull {
  additional_notices?: string[]
  asset_platform_id?: string | null
  block_time_in_minutes: number
  categories: string[]
  community_data?: {
    facebook_likes?: number | null
    reddit_accounts_active_48h?: number
    reddit_average_comments_48h?: number
    reddit_average_posts_48h?: number
    reddit_subscribers?: number
    telegram_channel_user_count?: number
    twitter_followers?: number
  }
  country_origin: string
  description: Record<Language, string>
  detail_platforms: Record<
    string,
    {
      contract_address: string
      decimal_place: number | null
    }
  >
  developer_data?: {
    closed_issues: number
    code_additions_deletions_4_weeks: {
      additions: number | null
      deletions: number | null
    }
    commit_count_4_weeks: number
    forks: number
    last_4_weeks_commit_activity_series: number[]
    pull_request_contributors: number
    pull_requests_merged: number
    stars: number
    subscribers: number
    total_issues: number
  }
  genesis_date?: string | null
  hashing_algorithm: string | null
  ico_data?: {
    accepting_currencies?: string
    amount_for_sale?: number | null
    base_pre_sale_amount?: number | null
    base_public_sale_amount?: number | null
    bounty_detail_url?: string
    hardcap_amount?: number | null
    hardcap_currency?: string
    ico_start_date?: string
    kyc_required?: boolean
    pre_sale_available?: boolean | null
    pre_sale_ended?: boolean
    quote_pre_sale_amount?: number | null
    quote_pre_sale_currency?: string
    quote_public_sale_currency?: string
    short_description?: string
    softcap_amount?: number | null
    softcap_currency?: string
    total_raised?: number | null
    total_raised_currency?: string
    whitelist_available?: boolean | null
    whitelist_end_date?: string | null
    whitelist_start_date?: string | null
  }
  id: string
  image: {
    large: string
    small: string
    thumb: string
  }
  last_updated: string
  links: {
    announcement_url: string[]
    bitcointalk_thread_identifier?: number | null
    blockchain_site: string[]
    chat_url: string[]
    facebook_username?: string
    homepage: string[]
    official_forum_url: string[]
    repos_url: {
      bitbucket: string[]
      github: string[]
    }
    snapshot_url?: string | null
    subreddit_url?: string
    telegram_channel_identifier?: string
    twitter_screen_name?: string
    whitepaper?: string
  }
  market_cap_rank?: number | null
  market_data?: {
    ath?: Record<string, number>
    ath_change_percentage?: Record<string, number>
    ath_date?: Record<string, string>
    atl?: Record<string, number>
    atl_change_percentage?: Record<string, number>
    atl_date?: Record<string, string>
    circulating_supply?: number
    current_price?: Record<string, number>
    fdv_to_tvl_ratio?: number | null
    fully_diluted_valuation?: Record<string, number>
    high_24h?: Record<string, number>
    last_updated?: string
    low_24h?: Record<string, number>
    market_cap?: Record<string, number>
    market_cap_change_24h?: number
    market_cap_change_24h_in_currency?: Record<string, number>
    market_cap_change_percentage_24h?: number
    market_cap_change_percentage_24h_in_currency?: Record<string, number>
    market_cap_fdv_ratio?: number
    market_cap_rank?: number
    max_supply?: number | null
    max_supply_infinite?: boolean
    mcap_to_tvl_ratio?: number | null
    price_change_24h?: number
    price_change_24h_in_currency?: Record<string, number>
    price_change_percentage_14d?: number
    price_change_percentage_14d_in_currency?: Record<string, number>
    price_change_percentage_1h_in_currency?: Record<string, number>
    price_change_percentage_1y?: number
    price_change_percentage_1y_in_currency?: Record<string, number>
    price_change_percentage_200d?: number
    price_change_percentage_200d_in_currency?: Record<string, number>
    price_change_percentage_24h?: number
    price_change_percentage_24h_in_currency?: Record<string, number>
    price_change_percentage_30d?: number
    price_change_percentage_30d_in_currency?: Record<string, number>
    price_change_percentage_60d?: number
    price_change_percentage_60d_in_currency?: Record<string, number>
    price_change_percentage_7d?: number
    price_change_percentage_7d_in_currency?: Record<string, number>
    roi?: Record<string, unknown> | null
    total_supply?: number
    total_value_locked?: number | null
    total_volume?: Record<string, number>
  }
  name: string
  platforms: Record<string, string>
  preview_listing: boolean
  public_notice?: string | null
  sentiment_votes_down_percentage?: number
  sentiment_votes_up_percentage?: number
  status_updates?: unknown[]
  symbol: string
  tickers?: CoingeckoTickerData[]
  watchlist_portfolio_users?: number
  web_slug: string
}

export interface AssetMetadata {
  coingeckoId?: string
  logoUrl: string
  marketCapRank?: number
  name: string
  platforms?: Record<string, string>
  symbol?: string
}

export interface Asset extends Partial<AssetMetadata> {
  id: string
  symbol: string
}

export interface MyAsset extends Asset {
  firstOwnedAt?: Timestamp
  lastOwnedAt?: Timestamp
  priceApiId?: PriceApiId
}

export interface AssetWithPrice extends MyAsset {
  price?: ChartData | null
}

/**
 * Example: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` (WETH)
 */
export type Web3Address = string

export type CsvData = (string | number | undefined | boolean | object)[][]

export enum TaskStatus {
  Queued = "queued",
  Running = "running",
  Completed = "completed",
  Aborted = "aborted",
  Cancelled = "cancelled",
  Failed = "failed",
}

export type FilterOptionsMap = {
  assetId: string[]
  capabilities: ModelCapability[]
  createdBy: string[]
  exchangeType: string[]
  extensionType: string[]
  family: ModelFamily[]
  feeAsset: string[]
  incomingAsset: string[]
  operation: AuditLogOperation[]
  outgoingAsset: string[]
  platformId: string[]
  status: TaskStatus[]
  tags: number[]
  tradeStatus: string[]
  tradeType: readonly TradeType[]
  trigger: string[]
  type: readonly TransactionType[]
  wallet: string[]
}

export type AssetId = string

export type SubscriptionId = string

export enum SubscriptionChannel {
  Accounts = "accounts",
  ServerTasks = "server-tasks",
  ServerTaskProgress = "server-task-progress",
  ServerFiles = "server-files",
  KeyValue = "key-value",
  AuditLogs = "audit-logs",
  ChatHistory = "chat-history",
  Networth = "networth",
  DailyPrices = "daily-prices",
  FileImports = "file-imports",
  Connections = "connections",
  Metadata = "metadata",
  Balances = "balances",
  Transactions = "transactions",
  ServerLog = "server-logs",
  Tags = "tags",
  Trades = "trades",
  TradePnl = "trade-pnl",
}

export type SubscriptionListener = (...args: unknown[]) => void

export interface Subscription {
  accountName?: string
  channel: SubscriptionChannel
  listener: SubscriptionListener
}

export enum EventCause {
  Created = "created",
  Updated = "updated",
  Deleted = "deleted",
  Reset = "reset",
}

export type TaskTrigger = "system" | "user" | "cron" | "side-effect"
export enum TaskPriority {
  Lowest = 1,
  VeryLow = 2,
  Low = 3,
  MediumLow = 4,
  Medium = 5,
  MediumHigh = 6,
  High = 7,
  VeryHigh = 8,
  Highest = 9,
}

export interface ServerFile {
  completedAt?: number
  createdBy: "user" | "system"
  deletedAt?: number
  description?: string
  id: number
  metadata: {
    lastModified: number
    size: number
    type: string
  }
  name: string
  /**
   * From 0 to 100
   */
  progress?: number
  scheduledAt: number
  startedAt?: number
  status: "scheduled" | "uploading" | "creating" | "completed" | "deleted" | "aborted"
}

export interface NewServerFile extends Omit<ServerFile, "id"> {
  id?: number
}

export interface ServerTask {
  completedAt?: number
  createdAt: number
  description: string
  /**
   * @default false
   */
  determinate?: boolean
  /**
   * In milliseconds
   */
  duration?: number
  errorMessage?: string
  id: number
  name: string
  priority: TaskPriority
  startedAt?: number
  status: TaskStatus
  trigger: TaskTrigger
}

export interface NewServerTask extends Omit<ServerTask, "id"> {
  id?: number
}

export type TaskCompletionCallback = (error: string | undefined) => void

/**
 * First value represents a percentage (0-100), second value is a message
 */
export type ProgressUpdate = [] | [number] | [number | undefined, string]
export type ProgressCallback = (state: ProgressUpdate) => Promise<unknown>

export type ProgressLog = [Timestamp, ProgressUpdate]

export type SqlParam = boolean | string | number | null | Uint8Array

export type ConnectionStatusCallback = (
  status: "closed" | "connected",
  errorMessage?: string
) => void

export type LabeledAddress = {
  id: string
  label: string
}

export type AddressBook = LabeledAddress[]

export interface Tag {
  id: number
  name: string
}

export type ExtensionType = "file-import" | "connection" | "price-api" | "metadata"

export type SourceCode = {
  tags: string[]
  url: string
}

export interface Extension {
  authorGithub: string
  description: string
  extensionLogoUrl: string
  extensionName: string
  extensionType: ExtensionType
  extensionVersion: string
  githubUrl: string
  howTo?: string
  id: string
  platformIds?: string[]
  priceUsd?: number
  publishedAt: Timestamp
  sources?: SourceCode[]
  updatedAt: Timestamp
}

export interface RichExtension extends Extension {
  platforms?: Platform[]
}

export type FindPlatformsResult = {
  blockchains: Blockchain[]
  exchanges: Exchange[]
}

export type PlatformMeta = {
  blockExplorer?: {
    name: string
    url: string
  }
  chainId?: number
  nativeAssetId?: string
}

export interface TradePnL {
  cost: string
  deposits: string
  fees: string
  id: string
  /**
   * Formula: positionValue + cost + proceeds + fees - deposits
   */
  pnl: string
  positionValue: string
  proceeds: string
  timestamp: number
  tradeId: string
}

export interface AccountPnL {
  cost: string
  deposits: string
  fees: string
  pnl: string
  positionValue: string
  proceeds: string
  timestamp: number
}

export interface ChatMessage {
  conversationId: string
  id: string
  message: string
  metadata?: string
  parts?: string // JSON string of message parts array
  role: "user" | "assistant" | "system"
  timestamp: number
  tokens?: number
}

export interface ChatConversation {
  firstMessage: string
  id: string
  lastTime: number
  messageCount: number
  model?: string
  startTime: number
}

export type BlockNumber = number
