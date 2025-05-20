import { TARGET } from "src/env"

import { isProductionElectron } from "./electron-utils"

export const isServer = typeof window === "undefined"
// https://vite.dev/guide/env-and-mode.html#built-in-constants
export const isProductionBuild = import.meta.env.PROD
export const isSecure = window.location.protocol === "https:"
export const isProduction = isProductionBuild || isProductionElectron
console.log(`Environment is ${isProduction ? "production" : "development"}`)

export const isOfficialUrl =
  window.location.hostname === "privatefolio.app" || window.location.hostname.includes("pages.dev")

export const isSelfHosted = isProduction && TARGET !== "electron" && !isOfficialUrl
export const isWebDeployment = isProduction && TARGET !== "electron" && isOfficialUrl

export const mode = isSelfHosted ? "self-hosted" : isWebDeployment ? "web" : "electron"
console.log(`App mode is ${mode}`)

export const hasLocalServer = isSelfHosted || !isWebDeployment
console.log(`Local server ${hasLocalServer ? "available" : "not available"}`)

// export const isNode = typeof process !== "undefined" && process.versions && process.versions.node
// export const isWebWorker = isServer && !isNode
// export const isTestEnvironment = typeof process !== "undefined" && process.env.NODE_ENV === "test"
