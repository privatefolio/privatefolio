import { Add } from "@mui/icons-material"
import { Button } from "@mui/material"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { MutableRefObject, useCallback, useEffect, useMemo, useState } from "react"
import { AttentionBlock } from "src/components/AttentionBlock"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { closeSubscription } from "src/utils/browser-utils"
import { ONE_DAY } from "src/utils/formatting-utils"

import {
  QueryTableData,
  RemoteTable,
  RemoteTableProps,
} from "../../components/EnhancedTable/RemoteTable"
import { Transaction } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { $rpc } from "../../workers/remotes"
import { TransactionTableRow } from "./TransactionTableRow"

interface TransactionsTableProps extends Pick<RemoteTableProps<Transaction>, "defaultRowsPerPage"> {
  assetId?: string
  tableDataRef?: MutableRefObject<Transaction[]>
  toggleAddTransactionDrawer?: () => void
  tradeId?: string
}

export function TransactionTable(props: TransactionsTableProps) {
  const { assetId, tableDataRef, toggleAddTransactionDrawer, tradeId, ...rest } = props

  const accountName = useStore($activeAccount)
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)
  const inspectTime = useStore($inspectTime)

  useEffect(() => {
    const subscription = rpc.subscribeToTransactions(
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
  }, [accountName, connectionStatus, rpc])

  const queryFn: QueryTableData<Transaction> = useCallback(
    async (filters, rowsPerPage, page, order, signal) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)

      const filterConditions: string[] = []
      let tagJoin = ""
      let tradeJoin = ""

      // Add existing filters to the conditions array
      Object.keys(filters).forEach((key) => {
        // Handle tag filter specially
        if (key === "tags") {
          tagJoin =
            "INNER JOIN transaction_tags ON transactions.id = transaction_tags.transaction_id INNER JOIN tags ON transaction_tags.tag_id = tags.id"
          filterConditions.push(`tags.id = '${parseInt(filters[key] as string)}'`)
        } else if (key === "tradeId") {
          tradeJoin =
            "INNER JOIN trade_transactions ON transactions.id = trade_transactions.transaction_id"
          filterConditions.push(`trade_transactions.trade_id = '${filters[key]}'`)
        } else if (key === "txHash") {
          filterConditions.push(`json_extract(metadata, '$.txHash') = '${filters[key]}'`)
        } else {
          filterConditions.push(`${key} = '${filters[key]}'`)
        }
      })

      // Include the assetId condition
      if (assetId) {
        filterConditions.push(`(incomingAsset = '${assetId}' OR outgoingAsset = '${assetId}')`)
      }

      if (tradeId) {
        filterConditions.push(`trade_transactions.trade_id = '${tradeId}'`)
        tradeJoin =
          "INNER JOIN trade_transactions ON transactions.id = trade_transactions.transaction_id"
      }

      if (inspectTime) {
        filterConditions.push(`timestamp <= ${inspectTime + ONE_DAY}`)
        filterConditions.push(`timestamp >= ${inspectTime}`)
      }

      // Construct the filterQuery
      let filterQuery = ""
      if (filterConditions.length > 0) {
        filterQuery = "WHERE " + filterConditions.join(" AND ")
      }

      const orderQuery = `ORDER BY timestamp ${order}`
      const limitQuery = `LIMIT ${rowsPerPage} OFFSET ${page * rowsPerPage}`

      const query = `SELECT transactions.* FROM transactions ${tagJoin} ${tradeJoin} ${filterQuery} ${orderQuery} ${limitQuery}`

      const transactions = await rpc.getTransactions(accountName, query)

      if (signal?.aborted) throw new Error(signal.reason)
      if (tableDataRef) {
        tableDataRef.current = transactions
      }

      return [
        transactions,
        () =>
          rpc.countTransactions(
            accountName,
            `SELECT COUNT (*) FROM transactions ${tagJoin} ${tradeJoin} ${filterQuery}`
          ),
      ]
    },
    [accountName, assetId, refresh, tableDataRef, rpc, tradeId, inspectTime]
  )

  const headCells = useMemo<HeadCell<Transaction>[]>(
    () => [
      {
        key: "timestamp",
        label: "Timestamp",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        filterable: true,
        key: "platformId",
        sx: { maxWidth: 0, minWidth: 0, width: 0 },
      },
      {
        filterable: true,
        key: "wallet",
        label: "Wallet",
        sx: { width: "100%" },
      },
      {
        filterable: true,
        key: "type",
        label: "Type",
        sx: { maxWidth: 146, minWidth: 146, width: 146 },
      },
      {
        label: "Outgoing",
        numeric: true,
        sx: { maxWidth: 160, minWidth: 160, width: 160 },
      },
      {
        filterable: true,
        key: "outgoingAsset",
        label: "Asset",
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        label: "Incoming",
        numeric: true,
        sx: { maxWidth: 160, minWidth: 160, width: 160 },
      },
      {
        filterable: true,
        key: "incomingAsset",
        label: "Asset",
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        label: "Fee",
        numeric: true,
        sx: { maxWidth: 160, minWidth: 160, width: 160 },
      },
      {
        filterable: true,
        key: "feeAsset",
        label: "Asset",
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
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
        key: "txHash" as never,
      },
      {
        filterable: true,
        hidden: true,
        key: "tradeId" as never,
      },
    ],
    []
  )

  return (
    <>
      <RemoteTable
        initOrderBy="timestamp"
        headCells={headCells}
        queryFn={queryFn}
        TableRowComponent={TransactionTableRow}
        addNewRow={
          !toggleAddTransactionDrawer ? undefined : (
            <AttentionBlock component={Button} onClick={toggleAddTransactionDrawer} fullWidth>
              <Add sx={{ height: 20, width: 20 }} />
              <span>
                Click to <u>add a new transaction</u>.
              </span>
            </AttentionBlock>
          )
        }
        {...rest}
      />
    </>
  )
}
