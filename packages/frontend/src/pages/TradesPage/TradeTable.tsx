import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { MutableRefObject, useCallback, useEffect, useMemo, useState } from "react"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { closeSubscription } from "src/utils/browser-utils"

import {
  QueryTableData,
  RemoteTable,
  RemoteTableProps,
} from "../../components/EnhancedTable/RemoteTable"
import { Trade, TradeStatus } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { $rpc } from "../../workers/remotes"
import { TradeTableRow } from "./TradeTableRow"

interface TradesTableProps extends Pick<RemoteTableProps<Trade>, "defaultRowsPerPage"> {
  assetId?: string
  tableDataRef?: MutableRefObject<Trade[]>
  tradeStatus?: TradeStatus
}

export function TradeTable(props: TradesTableProps) {
  const { assetId, tradeStatus, tableDataRef, ...rest } = props

  const accountName = useStore($activeAccount)
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)
  const inspectTime = useStore($inspectTime)

  useEffect(() => {
    const subscription = rpc.subscribeToTrades(
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

    return closeSubscription(subscription, rpc)
  }, [accountName, connectionStatus, rpc])

  const queryFn: QueryTableData<Trade> = useCallback(
    async (filters, rowsPerPage, page, order, signal) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)

      const filterConditions: string[] = []

      // Add existing filters to the conditions array
      Object.keys(filters).forEach((key) => {
        filterConditions.push(`${key} = '${filters[key]}'`)
      })

      if (assetId) {
        filterConditions.push(`assetId = '${assetId}'`)
      }

      if (tradeStatus && !inspectTime) {
        filterConditions.push(`tradeStatus = '${tradeStatus}'`)
      }

      if (inspectTime) {
        filterConditions.push(`createdAt <= ${inspectTime}`)
        filterConditions.push(`(closedAt >= ${inspectTime} OR closedAt IS NULL)`)
      }

      let filterQuery = ""
      if (filterConditions.length > 0) {
        filterQuery = "WHERE " + filterConditions.join(" AND ")
      }

      const orderQuery = `ORDER BY createdAt ${order}`
      const limitQuery = `LIMIT ${rowsPerPage} OFFSET ${page * rowsPerPage}`

      const query = `SELECT * FROM trades ${filterQuery} ${orderQuery} ${limitQuery}`
      const trades = await rpc.getTrades(accountName, query)

      if (signal?.aborted) throw new Error(signal.reason)
      if (tableDataRef) {
        tableDataRef.current = trades
      }

      return [
        trades,
        () => rpc.countTrades(accountName, `SELECT COUNT (*) FROM trades ${filterQuery}`),
      ]
    },
    [accountName, assetId, refresh, tableDataRef, rpc, tradeStatus, inspectTime]
  )

  const headCells = useMemo<HeadCell<Trade>[]>(
    () => [
      {
        key: "tradeNumber",
        label: "#",
        sortable: true,
        sx: { maxWidth: 80, minWidth: 80, width: 80 },
      },
      // {
      //   key: "duration",
      //   label: "Duration",
      //   sortable: true,
      //   sx: { maxWidth: 150, minWidth: 150, width: 150 },
      // },
      {
        filterable: true,
        key: "tradeType",
        label: "Type",
        sx: { maxWidth: 90, minWidth: 90, width: 90 },
      },
      {
        key: "amount",
        label: "Amount",
        numeric: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        filterable: true,
        key: "assetId",
        label: "Asset",
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        label: "Cost basis",
        sx: { maxWidth: 240, minWidth: 240, width: 240 },
      },
      {
        label: "Price",
        sx: { maxWidth: 240, minWidth: 240, width: 240 },
      },
      {
        label: "Profit",
        sx: { maxWidth: 240, minWidth: 240, width: 240 },
      },
      // {
      //   filterable: true,
      //   key: "tags",
      //   label: "Tags",
      //   sx: { maxWidth: 200, minWidth: 200, width: 200 },
      // },
      {
        key: "createdAt",
        label: "Created At",
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
        timestamp: true,
      },
    ],
    []
  )

  return (
    <RemoteTable
      initOrderBy="createdAt"
      headCells={headCells}
      queryFn={queryFn}
      TableRowComponent={TradeTableRow}
      {...rest}
    />
  )
}
