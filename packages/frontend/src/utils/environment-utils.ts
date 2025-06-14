import { TARGET } from "src/env"

import { isProductionElectron } from "./electron-utils"

// https://vite.dev/guide/env-and-mode.html#built-in-constants
const isProductionBuild = !!import.meta.env.PROD
export const isSecure = window.location.protocol === "https:"
// const isServer = typeof window === "undefined"
// const isNode = typeof process !== "undefined" && process.versions && process.versions.node
// const isWebWorker = isServer && !isNode
// const isTestEnvironment = typeof process !== "undefined" && process.env.NODE_ENV === "test"

export const isProduction = TARGET === "electron" ? isProductionElectron : isProductionBuild
const environment = isProduction ? "production" : "development"

console.log(`Frontend environment is ${environment}`)

const isOfficialUrl =
  window.location.hostname === "privatefolio.app" || window.location.hostname.includes("pages.dev")
const isSelfHosted = isProduction && TARGET !== "electron" && !isOfficialUrl
const isWebDeployment = isProduction && TARGET !== "electron" && isOfficialUrl

export const cloudEnabled = !isSelfHosted
export const localServerEnabled = isSelfHosted || !isWebDeployment

const mode = isSelfHosted ? "self-hosted" : isWebDeployment ? "web" : "electron"
export const isDevelopment = !isProduction

console.log(`App mode is ${mode}`)
console.log(`Local server ${localServerEnabled ? "enabled" : "disabled"}`)
console.log(`Cloud server ${cloudEnabled ? "enabled" : "disabled"}`)
