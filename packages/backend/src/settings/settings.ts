import { isServer } from "../utils/environment-utils"

const DEFAULT_DATA_LOCATION = "./data"
export const DATA_LOCATION =
  isServer && process.env.DATA_LOCATION ? process.env.DATA_LOCATION : DEFAULT_DATA_LOCATION

export const DATABASES_LOCATION = `${DATA_LOCATION}/databases`
export const TASK_LOGS_LOCATION = `${DATA_LOCATION}/logs`
export const FILES_LOCATION = `${DATA_LOCATION}/files`
export const SERVER_LOGS_LOCATION = `${DATA_LOCATION}/server-logs`
export const AUTH_DATA_DIR = `${DATA_LOCATION}/auth`
export const CACHE_LOCATION = `${DATA_LOCATION}/cache`

export const SALT_FILE = `${AUTH_DATA_DIR}/.salt`
export const HASH_FILE = `${AUTH_DATA_DIR}/.hash`
export const JWT_SECRET_FILE = `${AUTH_DATA_DIR}/.jwtsecret`
export const VAPID_PUBLIC_KEY_FILE = `${AUTH_DATA_DIR}/.vapid_public`
export const VAPID_PRIVATE_KEY_FILE = `${AUTH_DATA_DIR}/.vapid_private`
export const SERVER_ID_FILENAME = ".server-id"
export const SERVER_DB_FILENAME = `server.sqlite`

export const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Max-Age": "86400", // Cache preflight for 1 day
}

export const GITHUB_CACHE_URL =
  "https://raw.githubusercontent.com/privatefolio/coingecko/refs/heads/main/public"

export const SHORT_THROTTLE_DURATION = 1_000
export const MEDIUM_THROTTLE_DURATION = 2_500
export const LONG_THROTTLE_DURATION = 5_000

export const INPUT_DEBOUNCE_DURATION = 300
export const INPUT_MAX_DEBOUNCE_DURATION = 2_000

export const SHORT_DEBOUNCE_DURATION = 1_500
export const MAX_DEBOUNCE_DURATION = 10_000

export const DB_OPERATION_PAGE_SIZE = 1000
export const PRICE_API_PAGINATION = 900 // coinbase limit is 300, binance is 1000

export {
  getBlockExplorerName,
  getBlockExplorerUrl,
  PLATFORMS_META,
  WETH_ASSET_ID,
} from "./platforms"
export { PRICE_APIS_META, type PriceApiId } from "./price-apis"

export interface Settings {
  assistantModel: string
  kioskMode: boolean
  metadataRefreshInterval: number
  networthRefreshInterval: number
}

export const DEFAULT_SETTINGS: Settings = {
  assistantModel: "gpt-4.1-mini",
  kioskMode: false,
  metadataRefreshInterval: 7 * 24 * 60, // 7 days
  networthRefreshInterval: 60, // 1 hour
}

export const TASK_LOG_CHAR_LIMIT = 50_000
export const TASK_LOG_LINE_LIMIT = 1000

export { PlatformPrefix } from "./platforms"

export const PAYMENT_PLANS_IDS = ["premium", "free"] as const

export type PaymentPlanId = (typeof PAYMENT_PLANS_IDS)[number]

/* eslint-disable sort-keys-fix/sort-keys-fix */
export const PAYMENT_PLANS: Record<PaymentPlanId, string> = {
  free: "Free",
  premium: "Premium",
}
/* eslint-enable */
