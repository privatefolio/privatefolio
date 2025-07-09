import path from "path"
import { createSqliteDatabaseConnection } from "src/sqlite/sqlite"
import { isServer } from "src/utils/environment-utils"

const DEFAULT_DATA_LOCATION = "./data"
const DATA_LOCATION =
  isServer && process.env.DATA_LOCATION ? process.env.DATA_LOCATION : DEFAULT_DATA_LOCATION
const EXTENSION_DB_LOCATION = path.join(DATA_LOCATION, "extensions", "investment-planner")

export function getInvestmentDb(accountName: string) {
  if (!accountName) {
    throw new Error("Account name is required to get investment database.")
  }
  const dbPath = path.join(EXTENSION_DB_LOCATION, `${accountName}.sqlite`)
  return createSqliteDatabaseConnection(dbPath, `investment-planner-${accountName}`)
} 