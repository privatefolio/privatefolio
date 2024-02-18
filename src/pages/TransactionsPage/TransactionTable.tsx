import React, { useCallback, useMemo } from "react"
import { $activeAccount } from "src/stores/account-store"

import {
  QueryFunction,
  RemoteTable,
  RemoteTableProps,
} from "../../components/EnhancedTable/RemoteTable"
import { Transaction } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { clancy } from "../../workers/remotes"
import { TransactionTableRow } from "./TransactionTableRow"

interface TransactionsTableProps extends Pick<RemoteTableProps<Transaction>, "defaultRowsPerPage"> {
  symbol?: string
}

export function TransactionTable(props: TransactionsTableProps) {
  const { symbol, ...rest } = props

  const queryFn: QueryFunction<Transaction> = useCallback(
    async (filters, rowsPerPage, page, order) => {
      const selectorOverrides: PouchDB.Find.Selector = symbol
        ? {
            $or: [{ outgoingAsset: symbol }, { incomingAsset: symbol }, { feeAsset: symbol }],
          }
        : {}

      const transactions = await clancy.findTransactions(
        {
          filters,
          limit: rowsPerPage,
          order,
          selectorOverrides,
          skip: page * rowsPerPage,
        },
        $activeAccount.get()
      )

      return [
        transactions,
        () =>
          clancy
            .findTransactions(
              {
                fields: [],
                filters,
                selectorOverrides,
              },
              $activeAccount.get()
            )
            .then((logs) => logs.length),
      ]
    },
    [symbol]
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
        key: "platform",
        label: "",
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
        key: "outgoingN",
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
        key: "incomingN",
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
        key: "feeN",
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
        label: "",
        sx: { maxWidth: 44, minWidth: 44, width: 44 },
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
        {...rest}
      />
    </>
  )
}
