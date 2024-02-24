import { Box } from "@mui/material"
import React, { useCallback, useMemo } from "react"
import { FilterChip } from "src/components/FilterChip"
import { $activeAccount } from "src/stores/account-store"
import { stringToColor } from "src/utils/color-utils"

import {
  QueryFunction,
  RemoteTable,
  RemoteTableProps,
} from "../../components/EnhancedTable/RemoteTable"
import { AuditLog } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { clancy } from "../../workers/remotes"
import { AuditLogTableRow } from "./AuditLogTableRow"

interface AuditLogsTableProps extends Pick<RemoteTableProps<AuditLog>, "defaultRowsPerPage"> {
  assetId?: string
  txId?: string
}

export function AuditLogTable(props: AuditLogsTableProps) {
  const { assetId, txId, ...rest } = props

  const queryFn: QueryFunction<AuditLog> = useCallback(
    async (filters, rowsPerPage, page, order) => {
      if (txId) {
        const auditLogs = await clancy.findAuditLogsForTxId(txId, $activeAccount.get())
        return [auditLogs, auditLogs.length]
      }

      const auditLogs = await clancy.findAuditLogs(
        {
          filters: { assetId, ...filters },
          limit: rowsPerPage,
          order,
          skip: page * rowsPerPage,
        },
        $activeAccount.get()
      )

      return [
        auditLogs,
        () =>
          clancy
            .findAuditLogs(
              {
                fields: [],
                filters: { assetId, ...filters },
              },
              $activeAccount.get()
            )
            .then((logs) => logs.length),
      ]
    },
    [assetId, txId]
  )

  const headCells = useMemo<HeadCell<AuditLog>[]>(
    () => [
      {
        key: "timestamp",
        label: "Timestamp",
        sortable: !txId,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        filterable: !txId,
        key: "platform",
        label: "",
        sx: { maxWidth: 0, minWidth: 0, width: 0 },
      },
      {
        filterable: !txId,
        key: "wallet",
        label: "Wallet",
        sx: { width: "66%" },
      },
      {
        filterable: !txId,
        key: "operation",
        label: "Operation",
        sx: { width: "66%" },
      },
      {
        key: "changeN",
        label: "Change",
        numeric: true,
        sx: { maxWidth: 140, minWidth: 140, width: 140 },
      },
      ...(!assetId
        ? ([
            {
              filterable: !txId,
              key: "assetId",
              label: "Asset",
              sx: { maxWidth: 140, minWidth: 140, width: 140 },
            },
          ] as const)
        : []),
      {
        key: "balance",
        label: "New balance",
        numeric: true,
        sx: { width: "50%" },
      },
      {
        label: "",
        sx: { maxWidth: 44, minWidth: 44, width: 44 },
      },
    ],
    [assetId, txId]
  )

  return (
    <>
      {txId && (
        <Box
          sx={{
            marginBottom: 1,
            marginLeft: 1,
            marginTop: 0.5,
          }}
        >
          <FilterChip
            label={`Transaction Id = ${txId}`}
            color={stringToColor("Transaction Id")}
            // onDelete={() => {
            // TODO
            // }}
          />
        </Box>
      )}
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
