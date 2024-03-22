import { BinanceConnection } from "src/interfaces"
import { ProgressCallback } from "src/stores/task-store"
import { noop } from "src/utils/utils"

const testEnvironment = process.env.NODE_ENV === "test"

async function generateSignature(data: Uint8Array, secret: Uint8Array) {
  if (testEnvironment) {
    const crypto = await import("crypto")
    return crypto.createHmac("sha256", secret).update(data).digest("hex")
  }

  const cryptoKey = await self.crypto.subtle.importKey(
    "raw",
    secret,
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  )
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

export async function syncBinance(
  progress: ProgressCallback = noop,
  connection: BinanceConnection,
  since: string
) {
  const timestamp = Date.now()
  console.log("🚀 ~ timestamp:", timestamp)
  const queryString = `timestamp=${timestamp}`

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(queryString)
  const encodedSecret = encoder.encode(connection.secret)

  const signature = await generateSignature(encodedData, encodedSecret)
  console.log("🚀 ~ signature:", signature)

  const BASE_URL = "https://api.binance.com"
  const endpoint = "/sapi/v1/capital/deposit/hisrec"
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`

  console.log("🚀 ~ url:", url)
  const res = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": connection.key,
    },
  })
  const data = await res.json()
  console.log(data)
  return data
}
