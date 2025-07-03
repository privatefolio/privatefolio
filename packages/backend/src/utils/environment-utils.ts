export const isServer = typeof window === "undefined"
const isNode = typeof process !== "undefined" && !!process.versions && !!process.versions.node
export const isWebWorker = isServer && !isNode
export const isBunWorker = isNode && process.env.BUN_WORKER === "true"

const runtime = !isServer
  ? "browser"
  : isWebWorker
    ? "web worker"
    : isBunWorker
      ? "bun worker"
      : "bun"

export const isDevelopment = isNode && process.env.NODE_ENV === "development"
export const isTestEnvironment = isNode && process.env.NODE_ENV === "test"
export const isProduction = isNode && process.env.NODE_ENV === "production"
export const writesAllowed = (isNode && process.env.ALLOW_WRITES === "true") || isTestEnvironment

export const environment = isProduction ? "production" : isTestEnvironment ? "test" : "development"

export const useBunSqlite = isNode && process.env.BUN_SQL !== "false"

if (!isTestEnvironment) {
  console.log(`Backend runtime is ${runtime}`)
  console.log(`Backend environment is ${environment}`)
  console.log(`Sqlite implementation is ${useBunSqlite ? "bun" : "sqlite3"}`)
  console.log(`Sqlite writes are ${writesAllowed ? "allowed" : "disallowed"}`)
}

export const isDebug = false
