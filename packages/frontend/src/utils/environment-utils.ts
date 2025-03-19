import { isProductionElectron } from "./electron-utils"

export const SITE_DOMAIN = "https://privatefolio.app"

export const isServer = typeof window === "undefined"
export const isProductionWeb = isServer
  ? false
  : Boolean(window.location.toString().includes(SITE_DOMAIN))

export const isProduction = isProductionWeb || isProductionElectron

// export const isNode = typeof process !== "undefined" && process.versions && process.versions.node
// export const isWebWorker = isServer && !isNode
// export const isTestEnvironment = typeof process !== "undefined" && process.env.NODE_ENV === "test"
