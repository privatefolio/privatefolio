import { FolderOutlined } from "@mui/icons-material"
import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useMemo } from "react"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { FileDrop } from "src/components/FileDrop"
import { Asset } from "src/interfaces"
import { $assetMetaMap, $filterOptionsMap } from "src/stores/metadata-store"
import { HeadCell } from "src/utils/table-utils"

import { AssetTableRow } from "./AssetTableRow"

export function AssetTable() {
  const { assetId: assetIds } = useStore($filterOptionsMap, { keys: ["assetId"] })

  const queryTime = assetIds === undefined ? null : 0
  const assetMap = useStore($assetMetaMap)

  const rows = useMemo(
    () =>
      assetIds === undefined
        ? []
        : assetIds.map((x) => ({
            _id: x,
            ...assetMap[x],
          })),
    [assetIds, assetMap]
  )

  const headCells: HeadCell<Asset>[] = useMemo(
    () => [
      {
        key: "symbol",
        label: "Symbol",
        sortable: true,
        sx: { maxWidth: 360, minWidth: 140, width: "100%" },
      },
      {
        label: "Platform",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        label: "Price",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
    ],
    []
  )

  return (
    <>
      {queryTime !== null && assetIds.length === 0 ? (
        <FileDrop sx={{ padding: 4 }}>
          <Stack alignItems="center">
            <FolderOutlined sx={{ height: 64, width: 64 }} />
            <span>Nothing to see here...</span>
          </Stack>
        </FileDrop>
      ) : (
        <MemoryTable<Asset>
          initOrderBy="symbol"
          headCells={headCells}
          TableRowComponent={AssetTableRow}
          rows={rows}
          queryTime={queryTime}
          defaultRowsPerPage={10}
          //
        />
      )}
    </>
  )
}
