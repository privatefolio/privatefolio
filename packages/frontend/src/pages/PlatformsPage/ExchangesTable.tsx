import { InfoOutlined } from "@mui/icons-material"
import { TableCell, TableRow } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { AttentionBlock } from "src/components/AttentionBlock"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { Exchange } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $hideUnsupportedPlatforms } from "src/stores/device-settings-store"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { ExchangeTableRow } from "./ExchangeTableRow"

export function ExchangesTable() {
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const accountName = useStore($activeAccount)
  const rpc = useStore($rpc)
  const showSupportedOnly = useStore($hideUnsupportedPlatforms)
  useEffect(() => {
    document.title = `Exchanges - ${accountName} - Privatefolio`
  }, [accountName])

  useEffect(() => {
    const loadExchanges = async () => {
      const start = Date.now()
      const data = await rpc.getExchanges()
      setQueryTime(Date.now() - start)
      setExchanges(data)
    }

    loadExchanges()
  }, [accountName, rpc])

  const rows = useMemo(() => {
    if (showSupportedOnly) {
      return exchanges.filter((exchange) => exchange.supported)
    }
    return exchanges
  }, [exchanges, showSupportedOnly])

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

  const hiddenCount = exchanges.length - rows.length

  return (
    <MemoryTable<Exchange>
      initOrderBy={"coingeckoTrustRank" as keyof Exchange}
      initOrderDir="asc"
      headCells={headCells}
      TableRowComponent={ExchangeTableRow}
      rows={rows}
      rowCount={rows.length}
      queryTime={queryTime}
      extraRow={
        !!hiddenCount && (
          <TableRow>
            <TableCell colSpan={headCells.length}>
              <AttentionBlock>
                <InfoOutlined sx={{ height: 16, width: 16 }} />
                <span>{hiddenCount} unsupported exchanges hidden…</span>
              </AttentionBlock>
            </TableCell>
          </TableRow>
        )
      }
    />
  )
}
