import { InfoOutlined, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material"
import { IconButton, Stack, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { AttentionBlock } from "src/components/AttentionBlock"
import { $hideSmallBalances, $hideSmallBalancesMap } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { formatDate } from "src/utils/formatting-utils"
import { $rpc } from "src/workers/remotes"

import { MemoryTable } from "../../components/EnhancedTable/MemoryTable"
import { Subheading } from "../../components/Subheading"
import { Balance } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { NetworthChart } from "./NetworthChart"
import { NetworthTableRow } from "./NetworthTableRow"

export default function NetworthPage() {
  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)

  useEffect(() => {
    document.title = `Net worth - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [rows, setRows] = useState<Balance[]>([])
  const [hiddenBalances, setHiddenBalances] = useState<number>(0)

  const hideSmallBalances = useStore($hideSmallBalances)
  const inspectTime = useStore($inspectTime)

  useEffect(() => {
    function fetchData() {
      const start = Date.now()
      rpc.getBalancesAt(activeAccount, inspectTime).then((allBalances) => {
        // fetch no longer accurate
        if (activeAccount !== $activeAccount.get()) return

        const visibleBalances = hideSmallBalances
          ? allBalances.filter((x) => x.value && (x.value > 0.1 || x.value < -0.1))
          : allBalances

        setQueryTime(Date.now() - start)
        setRows(visibleBalances)
        setHiddenBalances(allBalances.length - visibleBalances.length)
      })
    }

    fetchData()
  }, [rpc, inspectTime, activeAccount, hideSmallBalances])

  const headCells = useMemo<HeadCell<Balance>[]>(
    () => [
      {
        filterable: true,
        key: "assetId",
        label: "Asset",
        sortable: true,
        sx: { width: "66%" },
      },
      {
        key: "balanceN",
        label: "Balance",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 220, minWidth: 220, width: 220 },
      },
      {
        key: "price",
        label: "Price",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 220, minWidth: 220, width: 220 },
        valueSelector: (row: Balance) => row.price?.value,
      },
      {
        key: "value",
        label: "Value",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 220, minWidth: 220, width: 220 },
      },
    ],
    []
  )

  return (
    <Stack gap={4}>
      <NetworthChart />
      {rows.length + hiddenBalances > 0 && (
        <div>
          <Subheading>
            <span>
              Balances{" "}
              {inspectTime !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  at {formatDate(inspectTime)}
                </Typography>
              )}
            </span>
            <Tooltip title={hideSmallBalances ? "Show small balances" : "Hide small balances"}>
              <IconButton
                color="secondary"
                onClick={() => {
                  $hideSmallBalancesMap.setKey(activeAccount, String(!hideSmallBalances))
                }}
              >
                {hideSmallBalances ? (
                  <VisibilityOffRounded fontSize="small" />
                ) : (
                  <VisibilityRounded fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Subheading>
          <MemoryTable<Balance>
            initOrderBy="value"
            headCells={headCells}
            TableRowComponent={NetworthTableRow}
            rows={rows}
            rowCount={rows.length + hiddenBalances}
            defaultRowsPerPage={10}
            queryTime={queryTime}
            extraRow={
              !!hiddenBalances && (
                <AttentionBlock>
                  <InfoOutlined sx={{ height: 20, width: 20 }} />
                  <span>{hiddenBalances} small balances hidden…</span>
                </AttentionBlock>
              )
            }
            // nullishSortPosition="start" TODO5: test me
          />
        </div>
      )}
    </Stack>
  )
}
