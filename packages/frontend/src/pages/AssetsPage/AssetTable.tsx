import { InfoOutlined } from "@mui/icons-material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { AttentionBlock } from "src/components/AttentionBlock"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { AssetWithPrice, ChartData } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $hideUnlisted } from "src/stores/device-settings-store"
import { $assetMap, $inMemoryDataQueryTime } from "src/stores/metadata-store"
import { getAssetPlatform } from "src/utils/assets-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { AssetTableRow } from "./AssetTableRow"

export function AssetTable() {
  const assetMap = useStore($assetMap)
  const inMemoryDataQueryTime = useStore($inMemoryDataQueryTime)

  const [priceMap, setPriceMap] = useState<Record<string, ChartData> | null>(null)

  const accountName = useStore($activeAccount)
  const rpc = useStore($rpc)

  useEffect(() => {
    rpc.getAssetPriceMap(accountName).then((priceMap) => {
      setPriceMap(priceMap)
    })
  }, [accountName, rpc])

  // const rows = useMemo(() => Object.values(assetMap), [assetMap])
  const rows: AssetWithPrice[] = useMemo(() => {
    if (inMemoryDataQueryTime === null) return []

    const all = Object.values(assetMap).map((x) => ({
      ...x,
      price: priceMap ? priceMap[x.id] : null,
    }))

    // sort by market cap rank asc, then price desc then symbol asc
    all.sort((a, b) => {
      // Primary sort: market cap rank ascending (nulls/undefined last)
      const aRank = a.marketCapRank ?? null
      const bRank = b.marketCapRank ?? null
      if (aRank !== bRank) {
        if (aRank === null) return 1
        if (bRank === null) return -1
        return aRank - bRank
      }

      // Secondary sort: price descending (nulls last)
      // const aPrice = a.price?.value ?? null
      // const bPrice = b.price?.value ?? null
      // if (aPrice !== bPrice) {
      //   if (aPrice === null) return 1
      //   if (bPrice === null) return -1
      //   return bPrice - aPrice // descending
      // }

      // Tertiary sort: symbol ascending
      return a.symbol.localeCompare(b.symbol)
    })

    return all
  }, [inMemoryDataQueryTime, assetMap, priceMap])

  const hideUnlisted = useStore($hideUnlisted)

  const filteredRows = useMemo(
    () => (hideUnlisted ? rows.filter((x) => x.coingeckoId) : rows),
    [hideUnlisted, rows]
  )

  const headCells: HeadCell<AssetWithPrice>[] = useMemo(
    () => [
      {
        key: "symbol",
        label: "Ticker",
        sortable: true,
        sx: { maxWidth: 130, minWidth: 130, width: 130 },
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        sx: { maxWidth: 350, minWidth: 140, width: "50%" },
      },
      {
        key: "platform" as keyof AssetWithPrice,
        label: "Platform",
        sortable: true,
        sx: { width: "50%" },
        valueSelector: (row: AssetWithPrice) => getAssetPlatform(row.id),
      },
      {
        key: "priceApiId",
        label: "Price API",
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
      },
      {
        key: "price",
        label: "Price",
        numeric: true,
        // sortable: true,
        sx: { maxWidth: 150, minWidth: 150, width: 150 },
        valueSelector: (row: AssetWithPrice) => row.price?.value,
      },
      {
        key: "marketCapRank",
        label: "Mcap rank",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 130, minWidth: 130, width: 130 },
      },
    ],
    []
  )

  const hiddenAssets = rows.length - filteredRows.length

  return (
    <>
      <MemoryTable<AssetWithPrice>
        initOrderBy="marketCapRank"
        initOrderDir="asc"
        headCells={headCells}
        TableRowComponent={AssetTableRow}
        rows={filteredRows}
        rowCount={rows.length}
        queryTime={inMemoryDataQueryTime}
        defaultRowsPerPage={10}
        extraRow={
          !!hiddenAssets && (
            <AttentionBlock>
              <InfoOutlined sx={{ height: 20, width: 20 }} />
              <span>{hiddenAssets} unlisted assets hidden…</span>
            </AttentionBlock>
          )
        }
      />
    </>
  )
}
