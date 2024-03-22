import { proxy } from "comlink"
import { getAddress } from "ethers"
import { validateOperation } from "src/api/database-utils"
import { ProgressCallback } from "src/stores/task-store"

import {
  AuditLogOperation,
  BinanceConnection,
  Connection,
  EtherscanConnection,
  SyncResult,
} from "../../../interfaces"
import { hashString, noop } from "../../../utils/utils"
import { getAccount } from "../../database"
import { getValue, setValue } from "../kv-api"
import { syncBinance } from "./integrations/binance/binance-coonector"
import { syncEtherscan } from "./integrations/etherscan-connector"

export async function addConnection(
  connection: Omit<Connection, "_id" | "_rev" | "timestamp" | "syncedAt">,
  accountName: string
) {
  let { address, platform, label, key, secret } = connection

  if (address) {
    address = getAddress(address)
  }
  const account = getAccount(accountName)

  const timestamp = new Date().getTime()
  const _id = hashString(`con_${platform}_${address}_${label}`)

  await account.connectionsDB.put<Connection>({
    ...connection,
    _id,
    _rev: undefined as any,
    address,
    key,
    secret,
    timestamp,
  })

  return (await account.connectionsDB.get(_id)) as Connection
}

export async function getConnections(accountName: string) {
  const account = getAccount(accountName)
  const res = await account.connectionsDB.allDocs<Connection>({
    include_docs: true,
  })
  return res.rows.map((row) => row.doc) as Connection[]
}

export async function removeConnection(
  connection: Connection,
  progress: ProgressCallback,
  accountName: string
) {
  const account = getAccount(accountName)

  // Remove audit logs
  const logs = await account.auditLogsDB.allDocs({
    // Prefix search
    // https://pouchdb.com/api.html#batch_fetch
    endkey: `${connection._id}\ufff0`,
    startkey: connection._id,
  } as PouchDB.Core.AllDocsWithinRangeOptions)
  progress([25, `Removing ${logs.rows.length} audit logs`])
  await account.auditLogsDB.bulkDocs(
    logs.rows.map((row) => ({ _deleted: true, _id: row.id, _rev: row.value.rev } as never))
  )

  // Remove transactions
  const txns = await account.transactionsDB.allDocs({
    // Prefix search
    // https://pouchdb.com/api.html#batch_fetch
    endkey: `${connection._id}\ufff0`,
    startkey: connection._id,
  } as PouchDB.Core.AllDocsWithinRangeOptions)
  progress([50, `Removing ${txns.rows.length} transactions`])
  await account.transactionsDB.bulkDocs(
    txns.rows.map((row) => ({ _deleted: true, _id: row.id, _rev: row.value.rev } as never))
  )

  //
  await setValue(connection._id, 0, accountName)
  progress([95, `Removing connection`])
  const res = await account.connectionsDB.remove(connection)
  progress([100, `Removal complete`])
  return res.ok
}

export async function resetConnection(
  connection: Connection,
  progress: ProgressCallback,
  accountName: string
) {
  const account = getAccount(accountName)
  // Remove audit logs
  const logs = await account.auditLogsDB.allDocs({
    // Prefix search
    // https://pouchdb.com/api.html#batch_fetch
    endkey: `${connection._id}\ufff0`,
    startkey: connection._id,
  } as PouchDB.Core.AllDocsWithinRangeOptions)
  progress([50, `Removing ${logs.rows.length} audit logs`])
  await account.auditLogsDB.bulkDocs(
    logs.rows.map((row) => ({ _deleted: true, _id: row.id, _rev: row.value.rev } as never))
  )

  // Remove transactions
  const txns = await account.transactionsDB.allDocs({
    // Prefix search
    // https://pouchdb.com/api.html#batch_fetch
    endkey: `${connection._id}\ufff0`,
    startkey: connection._id,
  } as PouchDB.Core.AllDocsWithinRangeOptions)
  progress([100, `Removing ${txns.rows.length} transactions`])
  await account.transactionsDB.bulkDocs(
    txns.rows.map((row) => ({ _deleted: true, _id: row.id, _rev: row.value.rev } as never))
  )
  //
  await setValue(connection._id, 0, accountName)
}

export function subscribeToConnections(callback: () => void, accountName: string) {
  const account = getAccount(accountName)
  const changesSub = account.connectionsDB
    .changes({
      live: true,
      since: "now",
    })
    .on("change", callback)

  return proxy(() => {
    try {
      // console.log("📜 LOG > subscribeToFileImports > unsubbing")
      changesSub.cancel()
    } catch {}
  })
}

// const testAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

export async function syncConnection(
  progress: ProgressCallback = noop,
  connection: Connection,
  accountName: string,
  since?: string
) {
  let result: SyncResult

  if (since === undefined) {
    since = (await getValue<string>(connection._id, "0", accountName)) as string
  }

  if (connection.platform === "ethereum") {
    result = await syncEtherscan(progress, connection as EtherscanConnection, since)
  } else if (connection.platform === "binance") {
    result = await syncBinance(progress, connection as BinanceConnection, since)
  } else {
    throw new Error(`Unsupported platform: ${connection.platform}`)
  }

  const account = getAccount(accountName)

  // save logs
  const logIds = Object.keys(result.logMap).map((x) => ({ id: x }))
  // TODO bug: bulkDocs hangs if docs.length === 0
  if (logIds.length > 0) {
    progress([60, `Saving ${logIds.length} audit logs to disk`])
    const { results: logDocs } = await account.auditLogsDB.bulkGet({ docs: logIds })

    const logUpdates = await account.auditLogsDB.bulkDocs(
      logDocs.map((doc) => ({
        ...result.logMap[doc.id],
        _id: doc.id,
        _rev: "ok" in doc.docs[0] ? doc.docs[0].ok._rev : undefined,
      }))
    )
    validateOperation(logUpdates)
  }

  // save transactions
  const txIds = Object.keys(result.txMap).map((x) => ({ id: x }))
  // TODO bug: bulkDocs hangs if docs.length === 0
  if (txIds.length > 0) {
    progress([70, `Saving ${txIds.length} transactions to disk`])
    const { results: txDocs } = await account.transactionsDB.bulkGet({ docs: txIds })
    const txUpdates = await account.transactionsDB.bulkDocs(
      txDocs.map((doc) => ({
        ...result.txMap[doc.id],
        _id: doc.id,
        _rev: "ok" in doc.docs[0] ? doc.docs[0].ok._rev : undefined,
      }))
    )
    validateOperation(txUpdates)
  }

  // save metadata
  const metadata: Connection["meta"] = {
    assetIds: Object.keys(result.assetMap),
    logs: logIds.length,
    operations: Object.keys(result.operationMap) as AuditLogOperation[],
    rows: result.rows,
    transactions: txIds.length,
    wallets: Object.keys(result.walletMap),
  }

  if (connection.meta && since !== "0") {
    connection.meta = {
      assetIds: [...new Set(connection.meta.assetIds.concat(metadata.assetIds))],
      logs: connection.meta.logs + metadata.logs,
      operations: [...new Set(connection.meta.operations.concat(metadata.operations))],
      rows: connection.meta.rows + metadata.rows,
      transactions: connection.meta.transactions + metadata.transactions,
      wallets: [...new Set(connection.meta.wallets.concat(metadata.wallets))],
    }
  } else {
    connection.meta = metadata
  }
  connection.syncedAt = new Date().getTime()

  progress([80, `Saving metadata`])
  await account.connectionsDB.put(connection)

  // set cursor
  if (result.rows > 0) {
    progress([90, `Setting cursor to block number ${result.newCursor}`])
    await setValue(connection._id, result.newCursor, accountName)
  }

  return connection
}
