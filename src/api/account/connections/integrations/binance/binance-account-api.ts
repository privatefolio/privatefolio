import { BinanceConnection } from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"

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
  blockNumber: string
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
export interface BinanceWithdraw {
  id: string
  blockNumber: string
  amount: string
  transactionFee: string
  coin: string
  status: number
  address: string
  txId: string
  applyTime: string
  network: string
  transferType: number
  info: string
  confirmNo: number
  walletType: number
  txKey: string
  completeTime: string
}
export interface BinanceTrade {
  symbol: string
  id: number
  orderId: number
  orderListId: number
  price: string
  qty: string
  quoteQty: string
  commission: string
  quoteAsset: string
  baseAsset: string
  commissionAsset: string
  time: number
  isBuyer: boolean
  isMaker: boolean
  isBestMatch: boolean
  blockNumber: string
}

export interface BinancePair {
  symbol: string
  baseAsset: string
  quoteAsset: string
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
  connection: BinanceConnection
): Promise<Array<BinanceWithdraw>> {
  const timestamp = Date.now()
  const queryString = `timestamp=${timestamp}&startTime=1512079200000&endTime=1517436000000`

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
