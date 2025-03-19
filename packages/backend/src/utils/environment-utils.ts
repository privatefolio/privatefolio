export const isServer = typeof window === "undefined"
export const isNode = typeof process !== "undefined" && process.versions && process.versions.node
export const isWebWorker = isServer && !isNode
//
export const isDevelopment = isNode && process.env.NODE_ENV === "development"
export const isTestEnvironment = isNode && process.env.NODE_ENV === "test"
export const isProduction = isNode && process.env.NODE_ENV === "production"

// FIXME TODO5 why is isNode needed here?
export const useBunSqlite = isNode && process.env.BUN_SQL !== "false"
