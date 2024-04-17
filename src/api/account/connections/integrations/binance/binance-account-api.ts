import { BinanceConnection } from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"
import { formatDate } from "src/utils/formatting-utils"

const testEnvironment = process.env.NODE_ENV === "test"

async function generateSignature(data: Uint8Array, secret: Uint8Array) {
  if (testEnvironment) {
    const crypto = await import("crypto")
    return crypto.createHmac("sha256", secret).update(data).digest("hex")
  }

  // eslint-disable-next-line no-restricted-globals
  const cryptoKey = await self.crypto.subtle.importKey(
    "raw",
    secret,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  )
  // eslint-disable-next-line no-restricted-globals
  const signature = await self.crypto.subtle.sign("HMAC", cryptoKey, data)
  const byteArray = new Uint8Array(signature)
  const hexParts: string[] = []
  byteArray.forEach((byte) => {
    const hex = byte.toString(16).padStart(2, "0")
    hexParts.push(hex)
  })

  const finalSignature = hexParts.join("")
  return finalSignature
}

export interface BinanceDeposit {
  address: string
  addressTag: string
  amount: string
  blockNumber: string
  coin: string
  confirmTimes: string
  id: string
  insertTime: number
  network: string
  status: number
  transferType: number
  txId: string
  unlockConfirm: number
  walletType: number
}
export interface BinanceWithdraw {
  address: string
  amount: string
  applyTime: string
  blockNumber: string
  coin: string
  completeTime: string
  confirmNo: number
  id: string
  info: string
  network: string
  status: number
  transactionFee: string
  transferType: number
  txId: string
  txKey: string
  walletType: number
}
export interface BinanceTrade {
  baseAsset: string
  blockNumber: string
  commission: string
  commissionAsset: string
  id: number
  isBestMatch: boolean
  isBuyer: boolean
  isMaker: boolean
  orderId: number
  orderListId: number
  price: string
  qty: string
  quoteAsset: string
  quoteQty: string
  symbol: string
  time: number
}
export interface BinancePair {
  baseAsset: string
  quoteAsset: string
  symbol: string
}
export interface BinanceReward {
  amount?: string
  asset: string
  blockNumber: string
  lockPeriod?: string
  positionId?: string
  projectId?: string
  rewards?: string
  time: number
  type?: string
}

export interface BinanceMarginLoanRepayment {
  amount: string
  asset: string
  blockNumber: string
  interest: string
  isolatedSymbol: string
  principal: string
  status: string
  timestamp: number
  txId: number
}

export interface BinanceMarginTrade {
  baseAsset: string
  blockNumber: string
  commission: string
  commissionAsset: string
  id: number
  isBestMatch: boolean
  isBuyer: boolean
  isIsolated: boolean
  isMaker: boolean
  orderId: number
  price: string
  qty: string
  quoteAsset: string
  symbol: string
  time: number
}

export interface BinanceMarginTransfer {
  amount: string
  asset: string
  blockNumber: string
  fromSymbol: string
  status: string
  timestamp: number
  toSymbol: string
  transFrom: string
  transTo: string
  txId: number
  type: string
}
export interface BinanceMarginLiquidation {
  avgPrice: string
  blockNumber: string
  executedQty: string
  isIsolated: boolean
  orderId: number
  price: string
  qty: string
  side: string
  symbol: string
  timeInForce: string
  updatedTime: number
}

// https://binance-docs.github.io/apidocs/spot/en/#deposit-history-supporting-network-user_data
export async function getBinanceDeposit(
  connection: BinanceConnection,
  startTime: number,
  endTime: number
): Promise<Array<BinanceDeposit>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/sapi/v1/capital/deposit/hisrec"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  const data = await res.json()

  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }

  return data as BinanceDeposit[]
}

// https://binance-docs.github.io/apidocs/spot/en/#withdraw-history-supporting-network-user_data
export async function getBinanceWithdraw(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback
): Promise<Array<BinanceWithdraw>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/sapi/v1/capital/withdraw/history"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  progress([
    undefined,
    `Fetched withdrawals history for ${formatDate(startTime)} to ${formatDate(
      endTime
    )} - Weight used: ${res.headers.get("X-Sapi-Used-Uid-Weight-1s")}`,
  ])
  const data: BinanceWithdraw[] = await res.json()
  return data
}

// https://binance-docs.github.io/apidocs/spot/en/#exchange-information
export async function getBinanceSymbols(
  connection: BinanceConnection
): Promise<Array<BinancePair>> {
  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/api/v3/exchangeInfo"
  const url = `${BASE_URL}${endpoint}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  const data = await res.json()
  const symbols: BinancePair[] = data.symbols.map((x) => ({
    baseAsset: x.baseAsset,
    quoteAsset: x.quoteAsset,
    symbol: x.symbol,
  }))
  return symbols
}

// https://binance-docs.github.io/apidocs/spot/en/#account-trade-list-user_data
export async function getBinanceTradesForSymbol(
  connection: BinanceConnection,
  symbol: BinancePair,
  progress: ProgressCallback
): Promise<Array<BinanceTrade>> {
  const timestamp = Date.now()
  const queryString = `symbol=${symbol.symbol}&timestamp=${timestamp}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)
  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/api/v3/myTrades"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  const data: BinanceTrade[] = await res.json()

  progress([undefined, `Weight used: ${res.headers.get("X-Mbx-Used-Weight")}`])
  // check if status is 429
  if (res.status === 429) {
    // wait()
    throw new Error("429: Rate limited")

    // return getBinanceTradesForSymbol(connection, symbol)
  }

  return data.map((x) => ({ ...x, baseAsset: symbol.baseAsset, quoteAsset: symbol.quoteAsset }))
}

export async function getBinanceFlexibleRewards(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback,
  type: string
): Promise<Array<BinanceReward>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&type=${type}&startTime=${startTime}&endTime=${endTime}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/sapi/v1/simple-earn/flexible/history/rewardsRecord"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  progress([
    undefined,
    `Fetched flexible rewards - ${type} from ${formatDate(startTime)} to ${formatDate(
      endTime
    )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
  ])
  const data = await res.json()
  return data.rows as BinanceReward[]
}

export async function getBinanceLockedRewards(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback
): Promise<Array<BinanceReward>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/sapi/v1/simple-earn/locked/history/rewardsRecord"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  progress([
    undefined,
    `Fetched locked rewards from ${formatDate(startTime)} to ${formatDate(
      endTime
    )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
  ])
  const data = await res.json()
  return data.rows as BinanceReward[]
}

export async function getBinanceMarginLoanRepayment(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  type: string,
  progress: ProgressCallback
): Promise<Array<BinanceMarginLoanRepayment>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&type=${type}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/sapi/v1/margin/borrow-repay"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  progress([
    undefined,
    `Fetched margin account rewards from ${formatDate(startTime)} to ${formatDate(
      endTime
    )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
  ])
  const data = await res.json()
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }
  return data.rows as BinanceMarginLoanRepayment[]
}

export async function getBinanceMarginTrades(
  connection: BinanceConnection,
  symbol: BinancePair,
  isIsolated: boolean,
  progress: ProgressCallback
): Promise<Array<BinanceMarginTrade>> {
  const timestamp = Date.now()
  const queryString = `symbol=${symbol.symbol}&isIsolated=${isIsolated}&timestamp=${timestamp}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/sapi/v1/margin/myTrades"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  progress([
    undefined,
    `Fetched margin account rewards for ${symbol.symbol} - Weight used: ${res.headers.get(
      "X-Sapi-Used-Ip-Weight-1m"
    )}`,
  ])
  const data = await res.json()
  if (res.status !== 200) {
    throw new Error(data.msg)
  }
  return data.map((x) => ({
    ...x,
    baseAsset: symbol.baseAsset,
    quoteAsset: symbol.quoteAsset,
  })) as BinanceMarginTrade[]
}

export async function getBinanceMarginTransfer(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback
): Promise<Array<BinanceMarginTransfer>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/sapi/v1/margin/transfer"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  progress([
    undefined,
    `Fetched margin transfers from ${formatDate(startTime)} to ${formatDate(
      endTime
    )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
  ])
  const data = await res.json()
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }
  return data.rows as BinanceMarginTransfer[]
}

export async function getBinanceMarginLiquidation(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback
): Promise<Array<BinanceMarginLiquidation>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "http://localhost:8080/api.binance.com"
  const endpoint = "/sapi/v1/margin/forceLiquidationRec"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  progress([
    undefined,
    `Fetched margin liquidation record from ${formatDate(startTime)} to ${formatDate(
      endTime
    )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
  ])
  const data = await res.json()
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }
  return data.rows as BinanceMarginLiquidation[]
}
