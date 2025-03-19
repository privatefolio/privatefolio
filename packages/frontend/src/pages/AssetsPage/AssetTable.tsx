import { InfoOutlined } from "@mui/icons-material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { AttentionBlock } from "src/components/AttentionBlock"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { AssetWithPrice, ChartData } from "src/interfaces"
import { $hideUnlisted } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $assetMap, $inMemoryDataQueryTime } from "src/stores/metadata-store"
import { getAssetPlatform } from "src/utils/assets-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { AssetTableRow } from "./AssetTableRow"

export function AssetTable() {
  const assetMap = useStore($assetMap)
  const queryTime = useStore($inMemoryDataQueryTime)

  const [priceMap, setPriceMap] = useState<Record<string, ChartData> | null>(null)

  const accountName = useStore($activeAccount)

  useEffect(() => {
    $rpc
      .get()
      .getAssetPriceMap(accountName)
      .then((priceMap) => {
        setPriceMap(priceMap)
      })
  }, [accountName])

  // const rows = useMemo(() => Object.values(assetMap), [assetMap])
  const rows: AssetWithPrice[] = useMemo(
    () =>
      queryTime === null
        ? []
        : Object.values(assetMap).map((x) => ({
            ...x,
            price: priceMap ? priceMap[x.id] : null,
          })),
    [queryTime, assetMap, priceMap]
  )

  const hideUnlisted = useStore($hideUnlisted)

  const filteredRows = useMemo(
    () => (hideUnlisted ? rows.filter((x) => x.coingeckoId) : rows),
    [hideUnlisted, rows]
  )

  const headCells: HeadCell<AssetWithPrice>[] = useMemo(
    () => [
      {
        key: "symbol",
        label: "Symbol",
        sortable: true,
        sx: { maxWidth: 360, minWidth: 140, width: "100%" },
      },
      {
        key: "platform" as keyof AssetWithPrice,
        label: "Platform",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
        valueSelector: (row: AssetWithPrice) => getAssetPlatform(row.id),
      },
      {
        key: "priceApiId",
        label: "Price API",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
      {
        key: "price",
        label: "Price",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
        valueSelector: (row: AssetWithPrice) => row.price?.value,
      },
    ],
    []
  )

  const hiddenAssets = rows.length - filteredRows.length

  return (
    <>
      <MemoryTable<AssetWithPrice>
        initOrderBy="symbol"
        initOrderDir="asc"
        headCells={headCells}
        TableRowComponent={AssetTableRow}
        rows={filteredRows}
        rowCount={rows.length}
        queryTime={queryTime}
        defaultRowsPerPage={10}
        extraRow={
          !!hiddenAssets && (
            <AttentionBlock>
              <InfoOutlined sx={{ height: 20, width: 20 }} />
              <span>{hiddenAssets} unlisted assets hidden...</span>
            </AttentionBlock>
          )
        }
      />
    </>
  )
}
