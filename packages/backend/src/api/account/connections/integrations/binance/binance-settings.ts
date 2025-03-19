import { isServer, isWebWorker } from "src/utils/utils"

export const BASE_URL =
  isServer && !isWebWorker ? "https://api.binance.com" : "http://localhost:8080/api.binance.com"

export const ninetyDays = 7_776_000_000
export const sevenDays = 604_800_000
export const thirtyDays = 2_592_000_000
export const twoHundredDays = 17_280_000_000
