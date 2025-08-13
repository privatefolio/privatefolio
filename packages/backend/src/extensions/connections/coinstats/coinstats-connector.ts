import {
  AuditLog,
  CoinstatsConnection,
  ProgressCallback,
  SyncResult,
  Transaction,
} from "src/interfaces"
import { noop } from "src/utils/utils"

import { getCoinstatsPortfolio } from "./coinstats-api"

export async function syncCoinstats(
  progress: ProgressCallback = noop,
  connection: CoinstatsConnection,
  since: number,
  until: number,
  _signal?: AbortSignal
): Promise<SyncResult> {
  await progress([0, `Fetching portfolio data`])

  const { auditLogs, transactions } = await getCoinstatsPortfolio(connection.apiKey, since, until)

  const result: SyncResult = {
    assetMap: {},
    logMap: {},
    newCursor: until,
    operationMap: {},
    rows: 0,
    txMap: {},
    walletMap: {},
  }

  for (const log of auditLogs) {
    const value: AuditLog = { ...log, connectionId: connection.id }
    result.logMap[value.id] = value
    result.assetMap[value.assetId] = true
    result.walletMap[value.wallet] = true
    result.operationMap[value.operation] = true
    result.rows += 1
  }

  for (const tx of transactions) {
    const value: Transaction = { ...tx, connectionId: connection.id }
    result.txMap[value.id] = value
  }

  return result
}
