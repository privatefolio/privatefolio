import { Add, InfoOutlined } from "@mui/icons-material"
import { Button, TableCell, TableRow } from "@mui/material"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { MutableRefObject, useCallback, useEffect, useMemo, useState } from "react"
import { AttentionBlock } from "src/components/AttentionBlock"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $hideSpam } from "src/stores/device-settings-store"
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
  const hideSpam = useStore($hideSpam)
  const [hiddenCount, setHiddenCount] = useState<number>(0)
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
      let spamExcludeJoin = ""

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

      // Hide spam transactions if the setting is enabled
      if (hideSpam) {
        spamExcludeJoin =
          "LEFT JOIN transaction_tags spam_tags ON transactions.id = spam_tags.transaction_id LEFT JOIN tags spam_tag_names ON spam_tags.tag_id = spam_tag_names.id AND spam_tag_names.name = 'spam'"
        filterConditions.push(`spam_tag_names.id IS NULL`)
      }

      // Construct the filterQuery
      let filterQuery = ""
      if (filterConditions.length > 0) {
        filterQuery = "WHERE " + filterConditions.join(" AND ")
      }

      const orderQuery = `ORDER BY timestamp ${order}`
      const limitQuery = `LIMIT ${rowsPerPage} OFFSET ${page * rowsPerPage}`

      const query = `SELECT transactions.* FROM transactions ${tagJoin} ${tradeJoin} ${spamExcludeJoin} ${filterQuery} ${orderQuery} ${limitQuery}`

      const transactions = await rpc.getTransactions(accountName, query)

      if (signal?.aborted) throw new Error(signal.reason)
      if (tableDataRef) {
        tableDataRef.current = transactions
      }

      const visibleCountQuery = `SELECT COUNT (*) FROM transactions ${tagJoin} ${tradeJoin} ${spamExcludeJoin} ${filterQuery}`

      const getVisibleCount = () => rpc.countTransactions(accountName, visibleCountQuery)

      if (hideSpam) {
        const totalFilterConditions = filterConditions.filter(
          (condition) => !condition.includes("spam_tag_names.id IS NULL")
        )
        const totalFilterQuery =
          totalFilterConditions.length > 0 ? "WHERE " + totalFilterConditions.join(" AND ") : ""
        const totalCountQuery = `SELECT COUNT (*) FROM transactions ${tagJoin} ${tradeJoin} ${totalFilterQuery}`

        const visibleCount = await getVisibleCount()
        const totalCount = await rpc.countTransactions(accountName, totalCountQuery)
        setHiddenCount(totalCount - visibleCount)
      } else {
        setHiddenCount(0)
      }

      return [transactions, getVisibleCount]
    },
    [accountName, assetId, refresh, tableDataRef, rpc, tradeId, inspectTime, hideSpam]
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
        sx: { maxWidth: 40, minWidth: 40, width: 40 },
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
              <Add sx={{ height: 16, width: 16 }} />
              <span>
                Click to <u>add a new transaction</u>.
              </span>
            </AttentionBlock>
          )
        }
        extraRow={
          !!hiddenCount && (
            <TableRow>
              <TableCell colSpan={headCells.length}>
                <AttentionBlock>
                  <InfoOutlined sx={{ height: 16, width: 16 }} />
                  <span>{hiddenCount} spam transactions hidden…</span>
                </AttentionBlock>
              </TableCell>
            </TableRow>
          )
        }
        {...rest}
      />
    </>
  )
}
