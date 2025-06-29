import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { Blockchain } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $hideUnsupportedPlatforms } from "src/stores/device-settings-store"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { BlockchainTableRow } from "./BlockchainTableRow"

export function BlockchainsTable() {
  const [blockchains, setBlockchains] = useState<Blockchain[]>([])
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const accountName = useStore($activeAccount)
  const rpc = useStore($rpc)
  const hideUnsupportedPlatforms = useStore($hideUnsupportedPlatforms)

  useEffect(() => {
    document.title = `Blockchains - ${accountName} - Privatefolio`
  }, [accountName])

  useEffect(() => {
    const loadBlockchains = async () => {
      const start = Date.now()
      const data = await rpc.getBlockchains()
      setQueryTime(Date.now() - start)
      setBlockchains(data)
    }

    loadBlockchains()
  }, [accountName, rpc])

  const rows = useMemo(() => {
    if (hideUnsupportedPlatforms) {
      return blockchains.filter((blockchain) => blockchain.supported)
    }
    return blockchains
  }, [blockchains, hideUnsupportedPlatforms])

  const headCells: HeadCell<Blockchain>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        sx: { maxWidth: 300, minWidth: 200, width: 250 },
      },
      {
        key: "nativeCoinId",
        label: "Native Asset",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 150, width: 180 },
      },
      {
        key: "chainId",
        label: "Chain ID",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 120, minWidth: 80, width: 100 },
      },
    ],
    []
  )

  return (
    <MemoryTable<Blockchain>
      initOrderBy="chainId"
      initOrderDir="asc"
      headCells={headCells}
      TableRowComponent={BlockchainTableRow}
      rows={rows}
      rowCount={rows.length}
      queryTime={queryTime}
    />
  )
}
