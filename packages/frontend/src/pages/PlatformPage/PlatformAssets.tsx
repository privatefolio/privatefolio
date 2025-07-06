import { Paper } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { Asset } from "src/interfaces"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { PlatformAssetTableRow } from "./PlatformAssetTableRow"

interface PlatformAssetsProps {
  platformId: string
}

export function PlatformAssets({ platformId }: PlatformAssetsProps) {
  const [assets, setAssets] = useState<Asset[] | undefined>(undefined)
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const rpc = useStore($rpc)

  useEffect(() => {
    const loadAssets = async () => {
      const start = Date.now()
      const data = await rpc.getAssetsByPlatform(platformId)
      setQueryTime(Date.now() - start)
      setAssets(data)
    }

    loadAssets()
  }, [platformId, rpc])

  const headCells: HeadCell<Asset>[] = useMemo(
    () => [
      {
        key: "symbol",
        label: "Ticker",
        sortable: true,
        sx: { width: "33%" },
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        sx: { width: "33%" },
      },
      {
        key: "marketCapRank",
        label: "Mcap rank",
        numeric: true,
        sortable: true,
        sx: { width: "33%" },
      },
    ],
    []
  )

  if (assets === undefined) {
    return (
      <Paper sx={{ height: 200, paddingX: 2, paddingY: 1 }}>
        <DefaultSpinner wrapper />
      </Paper>
    )
  }

  return (
    <>
      <MemoryTable<Asset>
        initOrderBy="marketCapRank"
        initOrderDir="asc"
        headCells={headCells}
        TableRowComponent={PlatformAssetTableRow}
        rows={assets}
        rowCount={assets.length}
        queryTime={queryTime}
      />
    </>
  )
}
