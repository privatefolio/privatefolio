import { CachedRounded, VisibilityOffRounded, VisibilityRounded } from "@mui/icons-material"
import { IconButton, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { proxy } from "comlink"
import { debounce } from "lodash-es"
import React, { useEffect, useMemo, useState } from "react"
import { InformativeRowHiddenBalances } from "src/components/InformativeRowHiddenBalances"
import { DEFAULT_DEBOUNCE_DURATION } from "src/settings"
import { $hideSmallBalances, $hideSmallBalancesMap } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { refreshNetworth } from "src/utils/common-tasks"
import { formatDate } from "src/utils/formatting-utils"

import { MemoryTable } from "../../components/EnhancedTable/MemoryTable"
import { StaggeredList } from "../../components/StaggeredList"
import { Subheading } from "../../components/Subheading"
import { Balance } from "../../interfaces"
import { HeadCell } from "../../utils/table-utils"
import { clancy } from "../../workers/remotes"
import { BalancesChart } from "./BalancesChart"
import { BalanceTableRow } from "./BalanceTableRow"

export default function BalancesPage({ show }: { show: boolean }) {
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [rows, setRows] = useState<Balance[]>([])
  const [hiddenBalances, setHiddenBalances] = useState<number>(0)

  const hideSmallBalances = useStore($hideSmallBalances)
  const inspectTime = useStore($inspectTime)
  const activeAccount = useStore($activeAccount)

  // if (hideSmallBalances) {
  //   return balances.filter((x) => x.value && (x.value > 0.1 || x.value < -0.1))
  // }

  useEffect(() => {
    function fetchData() {
      const start = Date.now()
      clancy.getBalancesAt(inspectTime, activeAccount).then((allBalances) => {
        // fetch no longer accurate
        if (activeAccount !== $activeAccount.get()) return
        setQueryTime(Date.now() - start)

        const visibleBalances = hideSmallBalances
          ? allBalances.filter((x) => x.value && (x.value > 0.1 || x.value < -0.1))
          : allBalances

        setRows(visibleBalances)
        setHiddenBalances(allBalances.length - visibleBalances.length)

        console.log("Balances", allBalances)
      })
    }

    fetchData()

    const unsubscribePromise = clancy.subscribeToDailyPrices(
      proxy(
        debounce(() => {
          fetchData()
        }, DEFAULT_DEBOUNCE_DURATION)
      )
    )

    return () => {
      unsubscribePromise.then((unsubscribe) => {
        unsubscribe()
      })
    }
  }, [inspectTime, activeAccount, hideSmallBalances])

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
    <StaggeredList component="main" gap={4} show={show}>
      {queryTime !== null && rows.length === 0 && hiddenBalances === 0 ? null : (
        <div>
          <Subheading>
            <span>Net worth</span>
            <Tooltip title="Refresh networth">
              <IconButton color="secondary" onClick={refreshNetworth} sx={{ marginRight: -1 }}>
                <CachedRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Subheading>
          <BalancesChart />
        </div>
      )}
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
                $hideSmallBalancesMap.setKey($activeAccount.get(), String(!hideSmallBalances))
              }}
              sx={{ marginRight: -1 }}
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
          TableRowComponent={BalanceTableRow}
          rows={rows}
          rowCount={rows.length + hiddenBalances}
          defaultRowsPerPage={10}
          queryTime={queryTime}
          extraRow={
            hiddenBalances ? (
              <InformativeRowHiddenBalances hiddenBalancesN={hiddenBalances} />
            ) : undefined
          }
        />
      </div>
    </StaggeredList>
  )
}
