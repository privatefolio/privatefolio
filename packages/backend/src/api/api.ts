import { BackendApiShape } from "src/backend-server"

import * as analytics from "./account/analytics-api"
import * as assets from "./account/assets-api"
import * as assistant from "./account/assistant-api"
import * as auditLogs from "./account/audit-logs-api"
import * as backup from "./account/backup-api"
import * as balances from "./account/balances-api"
import * as connections from "./account/connections-api"
import * as dailyPrices from "./account/daily-prices-api"
import * as extensions from "./account/extensions-api"
import * as fileImports from "./account/file-imports-api"
import * as kv from "./account/kv-api"
import * as networth from "./account/networth-api"
import * as platforms from "./account/platforms-api"
import * as portfolio from "./account/portfolio-api"
import * as serverFiles from "./account/server-files-api"
import * as serverLogs from "./account/server-logs-api"
import * as serverTasks from "./account/server-tasks-api"
import * as settings from "./account/settings-api"
import * as tags from "./account/tags-api"
import * as trades from "./account/trades-api"
import * as transactions from "./account/transactions-api"
import * as accounts from "./accounts-api"

export const api = {
  ...analytics,
  ...assistant,
  ...connections,
  ...auditLogs,
  ...balances,
  ...networth,
  ...dailyPrices,
  ...extensions,
  ...fileImports,
  ...accounts,
  ...transactions,
  ...kv,
  ...portfolio,
  ...assets,
  ...serverTasks,
  ...serverFiles,
  ...serverLogs,
  ...backup,
  ...tags,
  ...trades,
  ...settings,
  ...platforms,
} satisfies BackendApiShape

export type Api = typeof api
