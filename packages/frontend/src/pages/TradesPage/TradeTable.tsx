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
import { Trade } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { $rpc } from "../../workers/remotes"
import { TradeTableRow } from "./TradeTableRow"

interface TradesTableProps extends Pick<RemoteTableProps<Trade>, "defaultRowsPerPage"> {
  assetId?: string
  tableDataRef?: MutableRefObject<Trade[]>
}

export function TradeTable(props: TradesTableProps) {
  const { assetId, tableDataRef, ...rest } = props

  const accountName = useStore($activeAccount)
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    const subscription = $rpc.get().subscribeToTrades(
      accountName,
      throttle(
        () => {
          console.log("Refreshing trades")
          setRefresh(Math.random())
        },
        SHORT_THROTTLE_DURATION,
        {
          leading: false,
          trailing: true,
        }
      )
    )

    return closeSubscription(subscription, $rpc.get())
  }, [accountName, connectionStatus])

  const queryFn: QueryTableData<Trade> = useCallback(
    async (filters, rowsPerPage, page, order, signal) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)

      const filterConditions: string[] = []

      // Add existing filters to the conditions array
      Object.keys(filters).forEach((key) => {
        filterConditions.push(`${key} = '${filters[key]}'`)
      })

      // Include the assetId condition
      if (assetId) {
        filterConditions.push(`assetId = '${assetId}'`)
      }

      // Construct the filterQuery
      let filterQuery = ""
      if (filterConditions.length > 0) {
        filterQuery = "WHERE " + filterConditions.join(" AND ")
      }

      const orderQuery = `ORDER BY createdAt ${order}`
      const limitQuery = `LIMIT ${rowsPerPage} OFFSET ${page * rowsPerPage}`

      const query = `SELECT * FROM trades ${filterQuery} ${orderQuery} ${limitQuery}`
      const trades = await $rpc.get().getTrades($activeAccount.get(), query)

      if (signal?.aborted) throw new Error(signal.reason)
      if (tableDataRef) {
        tableDataRef.current = trades
      }

      return [
        trades,
        () => $rpc.get().countTrades(accountName, `SELECT COUNT (*) FROM trades ${filterQuery}`),
      ]
    },
    [accountName, assetId, refresh, tableDataRef]
  )

  const headCells = useMemo<HeadCell<Trade>[]>(
    () => [
      {
        key: "createdAt",
        label: "Created At",
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
        timestamp: true,
      },
      {
        key: "duration",
        label: "Duration",
        sortable: true,
        sx: { maxWidth: 150, minWidth: 150, width: 150 },
      },
      {
        filterable: true,
        key: "assetId",
        label: "Asset",
        sx: { maxWidth: 140, minWidth: 140, width: 140 },
      },
      {
        key: "amount",
        label: "Amount",
        numeric: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        key: "isOpen",
        label: "Status",
        sx: { maxWidth: 100, minWidth: 100, width: 100 },
      },
      {
        key: "soldAssets",
        label: "Cost",
        sx: { maxWidth: 220, minWidth: 220, width: 220 },
      },
      {
        key: "feeAssets",
        label: "Fees",
        sx: { maxWidth: 220, minWidth: 220, width: 220 },
      },
      {
        filterable: true,
        key: "tags",
        label: "Tags",
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        sx: { maxWidth: 60, minWidth: 60, width: 60 },
      },
    ],
    []
  )

  return (
    <>
      <RemoteTable
        initOrderBy="createdAt"
        headCells={headCells}
        queryFn={queryFn}
        TableRowComponent={TradeTableRow}
        {...rest}
      />
    </>
  )
}
