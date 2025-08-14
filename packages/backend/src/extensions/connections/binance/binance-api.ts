import { Timestamp } from "src/interfaces"
import { ONE_DAY } from "src/utils/formatting-utils"
import { isTestEnvironment } from "src/utils/utils"

import { BASE_URL, BinanceRewardType } from "./binance-settings"

async function generateSignature(data: Uint8Array, secret: Uint8Array) {
  if (isTestEnvironment) {
    const crypto = await import("crypto")
    return crypto.createHmac("sha256", Buffer.from(secret)).update(Buffer.from(data)).digest("hex")
  }

  // Ensure proper ArrayBuffer
  const secretBuffer =
    secret.buffer instanceof ArrayBuffer ? secret.buffer : new Uint8Array(secret).buffer

  const dataBuffer = data.buffer instanceof ArrayBuffer ? data.buffer : new Uint8Array(data).buffer

  // eslint-disable-next-line no-restricted-globals
  const cryptoKey = await self.crypto.subtle.importKey(
    "raw",
    secretBuffer,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  )

  // eslint-disable-next-line no-restricted-globals
  const signature = await self.crypto.subtle.sign("HMAC", cryptoKey, dataBuffer)
  const byteArray = new Uint8Array(signature)

  return Array.from(byteArray, (b) => b.toString(16).padStart(2, "0")).join("")
}

export interface BinanceDeposit {
  address: string
  addressTag: string
  amount: string
  coin: string
  confirmTimes: string
  id: string
  insertTime: Timestamp
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
  applyTime: Timestamp
  coin: string
  completeTime: Timestamp
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
  time: Timestamp
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
  time: Timestamp
  type?: string
}
export interface BinanceMarginLoanRepayment {
  amount: string
  asset: string
  interest: string
  isolatedSymbol: string
  principal: string
  status: string
  timestamp: Timestamp
  txId: number
}
export interface BinanceMarginTrade extends BinanceTrade {
  isIsolated: boolean
}
export type BinanceMarginTransferType = "ISOLATED_MARGIN" | "CROSS_MARGIN"
export interface BinanceMarginTransfer {
  amount: string
  asset: string
  fromSymbol: string
  status: string
  timestamp: Timestamp
  toSymbol: string
  transFrom: BinanceMarginTransferType
  transTo: BinanceMarginTransferType
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
  time: Timestamp
  timeInForce: string
  updatedTime: Timestamp
}
export interface BinanceUsdFuturesTrades {
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
  time: Timestamp
}
export interface BinanceCoinFuturesTrades {
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
  time: Timestamp
}
export interface BinanceCoinFuturesIncome {
  asset: string
  income: string
  incomeType: string
  info: string
  symbol: string
  time: Timestamp
  tradeId: string
  tranId: number
}
export interface BinanceUsdFuturesIncome {
  asset: string
  income: string
  incomeType: string
  info: string
  symbol: string
  time: Timestamp
  tradeId: number
  tranId: string
}

function getWeightUsed(headers: Headers) {
  let weightUsed = "unknown"
  headers.forEach((value, key) => {
    if (key.toLowerCase().includes("x-mbx-used") || key.toLowerCase().includes("x-sapi-used")) {
      weightUsed = `${key} - ${value}`
    }
  })
  return weightUsed
}

function getRetryAfter(headers: Headers) {
  let retryAfter = "unknown"
  headers.forEach((value, key) => {
    if (key.toLowerCase().includes("retry-after")) {
      retryAfter = value
    }
  })
  if (retryAfter === "unknown") return ""
  return `, retry after: ${retryAfter}`
}

export class BinanceApi {
  private readonly apiKey: string
  private readonly apiSecret: string

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async callBinanceApi(endpoint: string, params: URLSearchParams, post = false) {
    params.set("timestamp", String(Date.now()))
    params.set("recvWindow", "60000")
    const query = params.toString()
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(query)
    const encodedSecret = encoder.encode(this.apiSecret)

    const signature = await generateSignature(encodedData, encodedSecret)
    const url = `${BASE_URL}${endpoint}?${query}&signature=${signature}`

    const res = await fetch(url, {
      headers: { "X-MBX-APIKEY": this.apiKey },
      method: post ? "POST" : "GET",
    })

    // console.log(`Weight used: ${getWeightUsed(res.headers)} ${getRetryAfter(res.headers)}`)

    const data = await res.json()

    if (res.status === 429) {
      throw new Error(
        `Binance: 429 Rate limited - Weight used: ${getWeightUsed(res.headers)} ${getRetryAfter(res.headers)}`
      )
    }
    if (res.status !== 200) {
      throw new Error(`Binance: ${data !== null ? data.msg : `${res.status} ${res.statusText}`}`)
    }

    return data
  }

  // https://developers.binance.com/docs/wallet/capital/deposite-history
  async getDeposits(start: Timestamp, end: Timestamp) {
    const endpoint = "/sapi/v1/capital/deposit/hisrec"
    const params = new URLSearchParams({
      end: String(end),
      start: String(start),
    })

    return (await this.callBinanceApi(endpoint, params)) as BinanceDeposit[]
  }

  // https://developers.binance.com/docs/wallet/capital/withdraw-history
  async getWithdrawals(start: number, end: number) {
    const endpoint = "/sapi/v1/capital/withdraw/history"
    const params = new URLSearchParams({
      end: String(end),
      start: String(start),
    })

    return (await this.callBinanceApi(endpoint, params)) as BinanceWithdrawal[]
  }

  // https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#exchangeInfo
  // eslint-disable-next-line @typescript-eslint/member-ordering
  async getPairs() {
    const endpoint = "/api/v3/exchangeInfo"
    const data = await fetch(`${BASE_URL}${endpoint}`).then((x) => x.json())

    const symbols: BinancePair[] = data.symbols.map((x) => ({
      baseAsset: x.baseAsset,
      quoteAsset: x.quoteAsset,
      symbol: x.symbol,
    }))
    return symbols
  }

  // https://developers.binance.com/docs/binance-spot-api-docs/rest-api/account-endpoints#account-trade-list-user_data
  async getTrades(symbol: BinancePair, start: Timestamp, end: Timestamp) {
    const endpoint = "/api/v3/myTrades"
    const params = new URLSearchParams({
      // endTime: String(end),
      // startTime: String(start),
      symbol: symbol.symbol,
    })

    const data: BinanceTrade[] = await this.callBinanceApi(endpoint, params)

    return data
      .map((x) => ({ ...x, baseAsset: symbol.baseAsset, quoteAsset: symbol.quoteAsset }))
      .filter((x) => x.time > start && x.time < end) as BinanceTrade[]
  }

  // https://developers.binance.com/docs/simple_earn/history/Get-Flexible-Rewards-History
  // eslint-disable-next-line @typescript-eslint/member-ordering
  async getFlexibleRewards(start: number, end: number, rewardType: BinanceRewardType) {
    const endpoint = "/sapi/v1/simple-earn/flexible/history/rewardsRecord"
    const params = new URLSearchParams({
      end: String(end),
      start: String(start),
      type: rewardType,
    })

    const data = await this.callBinanceApi(endpoint, params)
    return data.rows as BinanceReward[]
  }

  // https://developers.binance.com/docs/simple_earn/history/Get-Locked-Rewards-History
  async getLockedRewards(start: number, end: number) {
    const endpoint = "/sapi/v1/simple-earn/locked/history/rewardsRecord"
    const params = new URLSearchParams({
      end: String(end),
      start: String(start),
    })

    const data = await this.callBinanceApi(endpoint, params)
    return data.rows as BinanceReward[]
  }

  // https://developers.binance.com/docs/margin_trading/borrow-and-repay/Query-Borrow-Repay
  async getMarginLoansAndRepayments(
    start: number,
    end: number,
    type: string,
    isolatedSymbol?: string
  ): Promise<Array<BinanceMarginLoanRepayment>> {
    const endpoint = "/sapi/v1/margin/borrow-repay"
    const params = isolatedSymbol
      ? new URLSearchParams({
          endTime: String(end),
          isolatedSymbol,
          startTime: String(start),
          type,
        })
      : new URLSearchParams({
          endTime: String(end),
          startTime: String(start),
          type,
        })

    if (isolatedSymbol && end - start > 30 * ONE_DAY) {
      throw new Error("Binance: getMarginLoansAndRepayments: maximum window is 30 days (isolated)")
    }
    if (!isolatedSymbol && end - start > 7 * ONE_DAY) {
      throw new Error("Binance: getMarginLoansAndRepayments: maximum window is 7 days")
    }

    try {
      const data = await this.callBinanceApi(endpoint, params)

      return (data.rows as BinanceMarginLoanRepayment[])
        .filter((x) => (isolatedSymbol ? x.isolatedSymbol === isolatedSymbol : !x.isolatedSymbol))
        .filter((x) => x.timestamp > start && x.timestamp < end)
    } catch (error) {
      if (String(error).includes("does not exist"))
        throw new Error(`Pair ${isolatedSymbol} does not exist`)

      throw error
    }
  }

  // https://developers.binance.com/docs/margin_trading/trade/Query-Margin-Account-Trade-List
  async getMarginTrades(symbol: BinancePair, isIsolated: boolean, start: number, end: number) {
    const endpoint = "/sapi/v1/margin/myTrades"
    const params = new URLSearchParams({
      isIsolated: String(isIsolated),
      symbol: symbol.symbol,
    })

    try {
      const data = await this.callBinanceApi(endpoint, params)

      return (
        data.map((x) => ({
          ...x,
          baseAsset: symbol.baseAsset,
          quoteAsset: symbol.quoteAsset,
        })) as BinanceMarginTrade[]
      ).filter((x) => x.time > start && x.time < end)
    } catch (error) {
      if (String(error).includes("does not exist"))
        throw new Error(`Pair ${symbol.symbol} does not exist`)

      throw error
    }
  }

  // https://developers.binance.com/docs/margin_trading/transfer
  async getMarginTransfers(start: number, end: number, isolated: boolean) {
    const endpoint = "/sapi/v1/margin/transfer"
    const params = new URLSearchParams({
      endTime: String(end),
      startTime: String(start),
    })

    const data = await this.callBinanceApi(endpoint, params)

    return (data.rows as BinanceMarginTransfer[]).filter((x) =>
      isolated
        ? x.transFrom === "ISOLATED_MARGIN" || x.transTo === "ISOLATED_MARGIN"
        : x.transFrom === "CROSS_MARGIN" || x.transTo === "CROSS_MARGIN"
    )
  }

  // https://developers.binance.com/docs/margin_trading/trade
  // eslint-disable-next-line @typescript-eslint/member-ordering
  async getMarginLiquidation(start: number, end: number, isolatedSymbol?: string) {
    const endpoint = "/sapi/v1/margin/forceLiquidationRec"
    const params = isolatedSymbol
      ? new URLSearchParams({
          isolatedSymbol,
        })
      : new URLSearchParams({
          endTime: String(end),
          startTime: String(start),
        })

    try {
      const data = await this.callBinanceApi(endpoint, params)

      return (data.rows as BinanceMarginLiquidation[])
        .filter((x) => (isolatedSymbol ? x.isIsolated : !x.isIsolated))
        .filter((x) => x.updatedTime > start && x.updatedTime < end)
    } catch (error) {
      if (String(error).includes("does not exist"))
        throw new Error(`Pair ${isolatedSymbol} does not exist`)

      throw error
    }
  }

  async getUsdFuturesPairs(): Promise<Array<BinancePair>> {
    // const BASE_URL = "https://fapi.binance.com"
    const endpoint = "/fapi/v1/exchangeInfo"

    const data = await fetch(`${BASE_URL}${endpoint}`).then((x) => x.json())
    const symbols: BinancePair[] = data.symbols.map((x) => ({
      baseAsset: x.baseAsset,
      quoteAsset: x.quoteAsset,
      symbol: x.symbol,
    }))
    return symbols
  }

  async getUsdFuturesTrades(symbol: BinancePair, start: number, end: number) {
    const endpoint = "/fapi/v1/userTrades"
    const params = new URLSearchParams({
      end: String(end),
      start: String(start),
      symbol: symbol.symbol,
    })

    const data = await this.callBinanceApi(endpoint, params)

    return data.map((x) => ({
      ...x,
      baseAsset: symbol.baseAsset,
      quoteAsset: symbol.quoteAsset,
    })) as BinanceUsdFuturesTrades[]
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async getCoinFuturesSymbols(): Promise<Array<BinancePair>> {
    // const BASE_URL = "https://dapi.binance.com" // TODO9
    const endpoint = "/dapi/v1/exchangeInfo"

    const data = await fetch(`${BASE_URL}${endpoint}`).then((x) => x.json())
    const symbols: BinancePair[] = data.symbols.map((x) => ({
      baseAsset: x.baseAsset,
      quoteAsset: x.quoteAsset,
      symbol: x.pair,
    }))
    return symbols
  }

  async getCoinFuturesTrades(symbol: BinancePair, start: number, end: number) {
    const endpoint = "/dapi/v1/userTrades"
    const params = new URLSearchParams({
      end: String(end),
      pair: symbol.symbol,
      start: String(start),
    })

    const data = await this.callBinanceApi(endpoint, params)

    return data.map((x) => ({
      ...x,
      baseAsset: symbol.baseAsset,
      quoteAsset: symbol.quoteAsset,
    })) as BinanceCoinFuturesTrades[]
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async getCoinFuturesIncome(start: number, end: number) {
    const endpoint = "/dapi/v1/income"
    const params = new URLSearchParams({
      end: String(end),
      start: String(start),
    })

    const data = await this.callBinanceApi(endpoint, params)

    return data as BinanceCoinFuturesIncome[]
  }

  async getUsdFuturesIncome(start: number, end: number) {
    const endpoint = "/fapi/v1/income"
    const params = new URLSearchParams({
      end: String(end),
      start: String(start),
    })

    const data = await this.callBinanceApi(endpoint, params)

    return data as BinanceUsdFuturesIncome[]
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async getAccount() {
    const endpoint = "/api/v3/account"
    const params = new URLSearchParams()

    return await this.callBinanceApi(endpoint, params)
  }

  async placeTestOrder() {
    const endpoint = "/api/v3/order/test"
    const params = new URLSearchParams({
      quantity: "10",
      side: "BUY",
      symbol: "USDCUSDT",
      type: "MARKET",
    })

    return await this.callBinanceApi(endpoint, params, true)
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  async ensureReadOnlyPermissions() {
    try {
      await this.placeTestOrder()
    } catch (error) {
      const errorMessage = String(error)
      if (
        errorMessage.includes("-2015") ||
        errorMessage.includes("Invalid API-key, IP, or permissions for action") ||
        errorMessage.includes("permissions for action")
      ) {
        return
      }
      throw error
    }
    throw new Error("API key has trading permissions. For better security use read-only API keys.")
  }
}
