import { BinanceConnection, ProgressCallback } from "src/interfaces"
import { formatDate } from "src/utils/formatting-utils"
import { isTestEnvironment } from "src/utils/utils"

import { BASE_URL } from "./binance-settings"

async function generateSignature(data: Uint8Array, secret: Uint8Array) {
  if (isTestEnvironment) {
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
export interface BinanceWithdrawal {
  address: string
  amount: string
  applyTime: string
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
  interest: string
  isolatedSymbol: string
  principal: string
  status: string
  timestamp: number
  txId: number
}

export interface BinanceMarginTrade {
  baseAsset: string
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

export interface BinanceFuturesUSDTrades {
  baseAsset: string
  buyer: boolean
  commission: string
  commissionAsset: string
  id: number
  maker: boolean
  orderId: number
  positionSide: string
  price: string
  qty: string
  quoteAsset: string
  quoteQty: string
  realizedPnl: string
  side: string
  symbol: string
  time: number
}

export interface BinanceFuturesCOINTrades {
  baseAsset: string
  baseQty: string
  buyer: boolean
  commission: string
  commissionAsset: string
  id: number
  maker: boolean
  marginAsset: string
  orderId: number
  pair: string
  positionSide: string
  price: string
  qty: string
  quoteAsset: string
  realizedPnl: string
  side: string
  symbol: string
  time: number
}

export interface BinanceFuturesCOINIncome {
  asset: string
  income: string
  incomeType: string
  info: string
  symbol: string
  time: number
  tradeId: string
  tranId: number
}

export interface BinanceFuturesUSDIncome {
  asset: string
  income: string
  incomeType: string
  info: string
  symbol: string
  time: number
  tradeId: number
  tranId: string
}

// https://binance-docs.github.io/apidocs/spot/en/#deposit-history-supporting-network-user_data
export async function getBinanceDeposit(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceDeposit>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)

  const signature = await generateSignature(encodedData, encodedSecret)
  const endpoint = "/sapi/v1/capital/deposit/hisrec"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  if (debugMode) {
    await progress([
      undefined,
      `Fetched deposit history for ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Sapi-Used-Uid-Weight-1s")}`,
    ])
  }
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
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceWithdrawal>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const endpoint = "/sapi/v1/capital/withdraw/history"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  if (debugMode) {
    await progress([
      undefined,
      `Fetched withdrawals history for ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Sapi-Used-Uid-Weight-1s")}`,
    ])
  }
  const data: BinanceWithdrawal[] = await res.json()
  return data
}

// https://binance-docs.github.io/apidocs/spot/en/#exchange-information
export async function getBinanceSymbols(
  connection: BinanceConnection
): Promise<Array<BinancePair>> {
  const endpoint = "/api/v3/exchangeInfo"
  const url = `${BASE_URL}${endpoint}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
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
  progress: ProgressCallback,
  since: number,
  until: number,
  debugMode: boolean
): Promise<Array<BinanceTrade>> {
  const timestamp = Date.now()
  const queryString = `symbol=${symbol.symbol}&timestamp=${timestamp}&recvWindow=60000`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const endpoint = "/api/v3/myTrades"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  const data: BinanceTrade[] = await res.json()
  if (debugMode) {
    await progress([
      undefined,
      `Fetched trade history for ${symbol.symbol} - Weight used: ${res.headers.get(
        "X-Mbx-Used-Weight"
      )}`,
    ])
  }
  // check if status is 429
  if (res.status === 429) {
    // wait()
    throw new Error(
      `429: Rate limited - Fetched trade history for ${
        symbol.symbol
      } - Weight used: ${res.headers.get("X-Mbx-Used-Weight")}`
    )

    // return getBinanceTradesForSymbol(connection, symbol)
  }

  return data
    .map((x) => ({ ...x, baseAsset: symbol.baseAsset, quoteAsset: symbol.quoteAsset }))
    .filter((x) => x.time > since && x.time < until)
}

// https://binance-docs.github.io/apidocs/spot/en/#get-flexible-rewards-history-user_data
export async function getBinanceFlexibleRewards(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback,
  debugMode: boolean,
  type: string
): Promise<Array<BinanceReward>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&type=${type}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const endpoint = "/sapi/v1/simple-earn/flexible/history/rewardsRecord"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  if (debugMode) {
    await progress([
      undefined,
      `Fetched flexible rewards - ${type} from ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
    ])
  }
  const data = await res.json()
  return data.rows as BinanceReward[]
}

// https://binance-docs.github.io/apidocs/spot/en/#get-locked-rewards-history-user_data
export async function getBinanceLockedRewards(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceReward>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const endpoint = "/sapi/v1/simple-earn/locked/history/rewardsRecord"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  if (debugMode) {
    await progress([
      undefined,
      `Fetched locked rewards from ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
    ])
  }
  const data = await res.json()
  return data.rows as BinanceReward[]
}

// https://binance-docs.github.io/apidocs/spot/en/#query-borrow-repay-records-in-margin-account-user_data
export async function getBinanceMarginLoanRepayment(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  type: string,
  isolated: boolean,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceMarginLoanRepayment>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&type=${type}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const endpoint = "/sapi/v1/margin/borrow-repay"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  if (debugMode) {
    await progress([
      undefined,
      `Fetched margin loans and repayments from ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
    ])
  }
  const data = await res.json()
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }
  return (data.rows as BinanceMarginLoanRepayment[]).filter((x) =>
    isolated ? x.isolatedSymbol : !x.isolatedSymbol
  )
}

// https://binance-docs.github.io/apidocs/spot/en/#query-margin-account-39-s-trade-list-user_data
export async function getBinanceMarginTrades(
  connection: BinanceConnection,
  symbol: BinancePair,
  isIsolated: boolean,
  progress: ProgressCallback,
  since: number,
  until: number,
  debugMode: boolean
): Promise<Array<BinanceMarginTrade>> {
  const timestamp = Date.now()
  const queryString = `symbol=${symbol.symbol}&isIsolated=${isIsolated}&timestamp=${timestamp}`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const endpoint = "/sapi/v1/margin/myTrades"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  if (debugMode) {
    await progress([
      undefined,
      `Fetched margin trades for ${symbol.symbol} - Weight used: ${res.headers.get(
        "X-Sapi-Used-Ip-Weight-1m"
      )}`,
    ])
  }
  const data = await res.json()
  if (res.status !== 200) {
    throw new Error(data.msg)
  }
  return (
    data.map((x) => ({
      ...x,
      baseAsset: symbol.baseAsset,
      quoteAsset: symbol.quoteAsset,
    })) as BinanceMarginTrade[]
  ).filter((x) => x.time > since && x.time < until)
}

// https://binance-docs.github.io/apidocs/spot/en/#get-cross-margin-transfer-history-user_data
export async function getBinanceMarginTransfer(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  isolated: boolean,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceMarginTransfer>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const endpoint = "/sapi/v1/margin/transfer"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  if (debugMode) {
    await progress([
      undefined,
      `Fetched margin transfers from ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
    ])
  }
  const data = await res.json()
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }
  return (data.rows as BinanceMarginTransfer[]).filter((x) =>
    isolated
      ? x.transFrom === "ISOLATED_MARGIN" || x.transTo === "ISOLATED_MARGIN"
      : x.transFrom === "CROSS_MARGIN" || x.transTo === "CROSS_MARGIN"
  )
}

// https://binance-docs.github.io/apidocs/spot/en/#get-force-liquidation-record-user_data
export async function getBinanceMarginLiquidation(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  isolated: boolean,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceMarginLiquidation>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}&recvWindow=60000`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const endpoint = "/sapi/v1/margin/forceLiquidationRec"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  if (debugMode) {
    await progress([
      undefined,
      `Fetched margin liquidation record from ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Sapi-Used-Ip-Weight-1m")}`,
    ])
  }
  const data = await res.json()
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }
  return (data.rows as BinanceMarginLiquidation[]).filter((x) =>
    isolated ? x.isIsolated : !x.isIsolated
  )
}

// https://binance-docs.github.io/apidocs/futures/en/#exchange-information
export async function getBinanceFuturesUSDSymbols(
  connection: BinanceConnection
): Promise<Array<BinancePair>> {
  const BASE_URL = "https://fapi.binance.com"
  const endpoint = "/fapi/v1/exchangeInfo"
  const url = `${BASE_URL}${endpoint}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
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

// https://binance-docs.github.io/apidocs/futures/en/#account-trade-list-user_data
export async function getBinanceFuturesUSDTrades(
  connection: BinanceConnection,
  symbol: BinancePair,
  startTime: number,
  endTime: number,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceFuturesUSDTrades>> {
  const timestamp = Date.now()
  const queryString = `symbol=${symbol.symbol}&timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}`
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const BASE_URL = "https://fapi.binance.com"
  const endpoint = "/fapi/v1/userTrades"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  const data = await res.json()
  if (debugMode) {
    await progress([
      undefined,
      `Fetched futures USD-M trade history for ${symbol.symbol}, from ${formatDate(
        startTime
      )} to ${formatDate(endTime)} - Weight used: ${res.headers.get("X-Mbx-Used-Weight-1m")}`,
    ])
  }
  // check if status is 429
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }

  return data.map((x) => ({
    ...x,
    baseAsset: symbol.baseAsset,
    quoteAsset: symbol.quoteAsset,
  })) as BinanceFuturesUSDTrades[]
}

// https://binance-docs.github.io/apidocs/delivery/en/#exchange-information
export async function getBinanceFuturesCOINSymbols(
  connection: BinanceConnection
): Promise<Array<BinancePair>> {
  const BASE_URL = "https://dapi.binance.com"
  const endpoint = "/dapi/v1/exchangeInfo"
  const url = `${BASE_URL}${endpoint}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  const data = await res.json()
  const symbols: BinancePair[] = data.symbols.map((x) => ({
    baseAsset: x.baseAsset,
    quoteAsset: x.quoteAsset,
    symbol: x.pair,
  }))
  return symbols
}

// https://binance-docs.github.io/apidocs/delivery/en/#account-trade-list-user_data
export async function getBinanceFuturesCOINTrades(
  connection: BinanceConnection,
  symbol: BinancePair,
  startTime: number,
  endTime: number,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceFuturesCOINTrades>> {
  const timestamp = Date.now()
  const queryString = `pair=${symbol.symbol}&timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const BASE_URL = "https://dapi.binance.com"
  const endpoint = "/dapi/v1/userTrades"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  const data = await res.json()
  if (debugMode) {
    await progress([
      undefined,
      `Fetched futures Coin-M trade history for ${symbol.symbol} - Weight used: ${res.headers.get(
        "X-Mbx-Used-Weight-1m"
      )}`,
    ])
  }
  // check if status is 429
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }

  return data.map((x) => ({
    ...x,
    baseAsset: symbol.baseAsset,
    quoteAsset: symbol.quoteAsset,
  })) as BinanceFuturesCOINTrades[]
}

// https://binance-docs.github.io/apidocs/delivery/en/#get-income-history-user_data
export async function getBinanceFuturesCOINIncome(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceFuturesCOINIncome>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const BASE_URL = "https://dapi.binance.com"
  const endpoint = "/dapi/v1/income"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  const data = await res.json()
  if (debugMode) {
    await progress([
      undefined,
      `Fetched Futures Coin-M income history from ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Mbx-Used-Weight-1m")}`,
    ])
  }
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }

  return data as BinanceFuturesCOINIncome[]
}

// https://binance-docs.github.io/apidocs/futures/en/#get-income-history-user_data
export async function getBinanceFuturesUSDIncome(
  connection: BinanceConnection,
  startTime: number,
  endTime: number,
  progress: ProgressCallback,
  debugMode: boolean
): Promise<Array<BinanceFuturesUSDIncome>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.apiSecret)
  const signature = await generateSignature(encodedData, encodedSecret)

  const BASE_URL = "https://fapi.binance.com"
  const endpoint = "/fapi/v1/income"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.apiKey,
    },
  })
  const data = await res.json()
  if (debugMode) {
    await progress([
      undefined,
      `Fetched futures USD-M income history from ${formatDate(startTime)} to ${formatDate(
        endTime
      )} - Weight used: ${res.headers.get("X-Mbx-Used-Weight-1m")}`,
    ])
  }
  // check if status is 429
  if (res.status !== 200) {
    throw new Error(`Binance: ${data.msg}`)
  }

  return data as BinanceFuturesUSDIncome[]
}
