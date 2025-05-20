import { TARGET } from "src/env"

import { isProductionElectron } from "./electron-utils"

export const isServer = typeof window === "undefined"
// https://vite.dev/guide/env-and-mode.html#built-in-constants
export const isProductionBuild = import.meta.env.PROD
export const isSecure = window.location.protocol === "https:"
export const isProduction = isProductionBuild || isProductionElectron
export const isSelfHosted =
  isProduction && TARGET !== "electron" && window.location.hostname !== "privatefolio.app"
export const isWebDeployment =
  isProduction && TARGET !== "electron" && window.location.hostname === "privatefolio.app"

export const hasLocalServer = isSelfHosted || !isWebDeployment

// export const isNode = typeof process !== "undefined" && process.versions && process.versions.node
// export const isWebWorker = isServer && !isNode
// export const isTestEnvironment = typeof process !== "undefined" && process.env.NODE_ENV === "test"
