import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { MutableRefObject, useCallback, useEffect, useMemo, useState } from "react"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"

import {
  QueryTableData,
  RemoteTable,
  RemoteTableProps,
} from "../../components/EnhancedTable/RemoteTable"
import { AuditLog } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { $rpc } from "../../workers/remotes"
import { AuditLogTableRow } from "./AuditLogTableRow"

interface AuditLogsTableProps extends Pick<RemoteTableProps<AuditLog>, "defaultRowsPerPage"> {
  assetId?: string
  tableDataRef?: MutableRefObject<AuditLog[]>
  tradeId?: string
}

export function AuditLogTable(props: AuditLogsTableProps) {
  const { assetId, tableDataRef, tradeId, ...rest } = props

  const accountName = useStore($activeAccount)
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)

  useEffect(() => {
    const subscription = rpc.subscribeToAuditLogs(
      accountName,
      throttle(
        () => {
          console.log("Refreshing")
          setRefresh(Math.random())
        },
        SHORT_THROTTLE_DURATION,
        {
          leading: false,
          trailing: true,
        }
      )
    )

    return closeSubscription(subscription, rpc)
  }, [rpc, accountName, connectionStatus])

  const queryFn: QueryTableData<AuditLog> = useCallback(
    async (filters, rowsPerPage, page, order, signal) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)

      const filterConditions: string[] = []
      let tagJoin = ""
      let tradeJoin = ""

      // Add existing filters to the conditions array
      for (const key of Object.keys(filters)) {
        // Handle tag filter specially
        if (key === "tags") {
          tagJoin =
            "INNER JOIN audit_log_tags ON audit_logs.id = audit_log_tags.audit_log_id INNER JOIN tags ON audit_log_tags.tag_id = tags.id"
          filterConditions.push(`tags.id = '${parseInt(filters[key] as string)}'`)
        } else if (key === "tradeId") {
          tradeJoin = "INNER JOIN trade_audit_logs ON audit_logs.id = trade_audit_logs.audit_log_id"
          filterConditions.push(`trade_audit_logs.trade_id = '${filters[key]}'`)
        } else {
          filterConditions.push(`${key} = '${filters[key]}'`)
        }
      }

      // Include the assetId condition if assetId is defined
      if (assetId) {
        filterConditions.push(`assetId = '${assetId}'`)
      }

      if (tradeId) {
        filterConditions.push(`trade_audit_logs.trade_id = '${tradeId}'`)
        tradeJoin = "INNER JOIN trade_audit_logs ON audit_logs.id = trade_audit_logs.audit_log_id"
      }

      // Construct the filterQuery
      let filterQuery = ""
      if (filterConditions.length > 0) {
        filterQuery = "WHERE " + filterConditions.join(" AND ")
      }

      const orderQuery = `ORDER BY timestamp ${order}`
      const limitQuery = `LIMIT ${rowsPerPage} OFFSET ${page * rowsPerPage}`

      const query = `SELECT audit_logs.* FROM audit_logs ${tagJoin} ${tradeJoin} ${filterQuery} ${orderQuery} ${limitQuery}`
      const auditLogs = await rpc.getAuditLogs(accountName, query)

      if (signal?.aborted) throw new Error(signal.reason)
      if (tableDataRef) {
        tableDataRef.current = auditLogs
      }

      return [
        auditLogs,
        () =>
          rpc.countAuditLogs(
            accountName,
            `SELECT COUNT (*) FROM audit_logs ${tagJoin} ${tradeJoin} ${filterQuery}`
          ),
      ]
    },
    [rpc, accountName, assetId, tableDataRef, refresh, tradeId]
  )

  const headCells = useMemo<HeadCell<AuditLog>[]>(
    () => [
      {
        key: "timestamp",
        label: "Timestamp",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        filterable: true,
        key: "platform",
        sx: { maxWidth: 0, minWidth: 0, width: 0 },
      },
      {
        filterable: true,
        key: "wallet",
        label: "Wallet",
        sx: { width: "66%" },
      },
      {
        filterable: true,
        key: "operation",
        label: "Operation",
        sx: { width: "66%" },
      },
      {
        label: "Change",
        numeric: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
      },
      {
        filterable: true,
        hidden: !!assetId,
        key: "assetId",
        label: "Asset",
        sx: { maxWidth: 140, minWidth: 140, width: 140 },
      },
      {
        key: "balance",
        label: "New balance",
        numeric: true,
        sx: { width: "50%" },
      },
      {
        filterable: true,
        key: "tags",
        label: "Tags",
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        sx: { maxWidth: 60, minWidth: 60, width: 60 },
      },
      {
        filterable: true,
        hidden: true,
        key: "id",
      },
      {
        filterable: true,
        hidden: true,
        key: "txId",
      },
      {
        filterable: true,
        hidden: true,
        key: "tradeId" as never,
      },
    ],
    [assetId]
  )

  return (
    <>
      <RemoteTable
        initOrderBy="timestamp"
        headCells={headCells}
        queryFn={queryFn}
        TableRowComponent={AuditLogTableRow}
        {...rest}
      />
    </>
  )
}
