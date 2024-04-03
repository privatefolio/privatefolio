import "./comlink-setup"

import { expose } from "comlink"

import * as auditLogs from "../api/account/audit-logs-api"
import * as backup from "../api/account/backup-and-restore-api"
import * as balances from "../api/account/balances-api"
import * as connections from "../api/account/connections/connections-api"
import * as fileImports from "../api/account/file-imports/file-imports-api"
import * as kv from "../api/account/kv-api"
import * as networth from "../api/account/networth-api"
import * as portfolio from "../api/account/portfolio-api"
import * as transactions from "../api/account/transactions-api"
import * as assets from "../api/core/assets-api"
import * as dailyPrices from "../api/core/daily-prices-api"
import * as database from "../api/database"

const worker = {
  ...connections,
  ...auditLogs,
  ...balances,
  ...networth,
  ...dailyPrices,
  ...fileImports,
  ...database,
  ...transactions,
  ...kv,
  ...portfolio,
  ...assets,
  ...backup,
}

export type Clancy = typeof worker

expose(worker)

console.log("WebWorker (Clancy) exposed")
