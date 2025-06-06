import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { Exchange } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { ExchangeTableRow } from "./ExchangeTableRow"

export function ExchangesTable() {
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const accountName = useStore($activeAccount)

  useEffect(() => {
    document.title = `Exchanges - ${accountName} - Privatefolio`
  }, [accountName])

  useEffect(() => {
    const loadExchanges = async () => {
      const start = Date.now()
      const data = await $rpc.get().getExchanges()
      setQueryTime(Date.now() - start)
      setExchanges(data)
    }

    loadExchanges()
  }, [accountName])

  const headCells: HeadCell<Exchange>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
      },
      {
        key: "url",
        label: "Website",
        sortable: true,
      },
      {
        key: "country",
        label: "Country",
        sortable: true,
        sx: { maxWidth: 300, minWidth: 300, width: 300 },
      },
      {
        key: "year",
        label: "Year",
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        key: "coingeckoTrustScore",
        label: "Trust",
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
      },
      {
        key: "coingeckoTrustRank",
        label: "Rank",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 100, minWidth: 100, width: 100 },
      },
    ],
    []
  )

  return (
    <MemoryTable<Exchange>
      initOrderBy={"coingeckoTrustRank" as keyof Exchange}
      initOrderDir="asc"
      headCells={headCells}
      TableRowComponent={ExchangeTableRow}
      rows={exchanges}
      rowCount={exchanges.length}
      queryTime={queryTime}
    />
  )
}
