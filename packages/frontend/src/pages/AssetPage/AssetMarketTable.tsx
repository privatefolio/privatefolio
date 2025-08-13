import { Paper, Stack } from "@mui/material"
import { isAddress } from "ethers"
import { formatAddress } from "privatefolio-backend/build/src/utils/assets-utils"
import React, { useMemo } from "react"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { NoDataAvailable } from "src/components/NoDataAvailable"
import { CoingeckoTickerData } from "src/interfaces"
import { TIMESTAMP_HEADER_SX } from "src/theme"
import { HeadCell } from "src/utils/table-utils"

import { AssetMarketTableRow, TickerData } from "./AssetMarketTableRow"

interface AssetMarketsProps {
  isLoading: boolean
  tickers?: CoingeckoTickerData[]
}

export function AssetMarketTable({ tickers, isLoading }: AssetMarketsProps) {
  const isEmpty = !tickers || !tickers.length

  const rows: TickerData[] = useMemo(() => {
    if (!tickers || !tickers.length) return []

    return tickers.map((ticker, index) => {
      const base = formatAddress(ticker.base)
      const target = formatAddress(ticker.target)
      const isDex = isAddress(ticker.base.toLowerCase())

      return {
        ...ticker,
        exchangeId: ticker.market.identifier,
        exchangeName: ticker.market.name,
        exchangeType: isDex ? "DEX" : "CEX",
        id: `${ticker.market.identifier}-${ticker.base}-${ticker.target}-${index}`,
        pair: `${base}/${target}`,
        price: ticker.converted_last.usd,
        spread: ticker.bid_ask_spread_percentage,
        timestamp: ticker.last_traded_at ? new Date(ticker.last_traded_at).getTime() : 0,
        tradeUrl: ticker.trade_url,
        trustColor: ticker.trust_score,
        trustScore: ticker.trust_score === "green" ? 1 : ticker.trust_score === "yellow" ? 0.5 : 0,
        volume: ticker.converted_volume.usd,
      }
    })
  }, [tickers])

  const headCells = useMemo<HeadCell<TickerData>[]>(
    () => [
      {
        key: "exchangeName",
        label: "Exchange",
        sortable: true,
        sx: { maxWidth: 240, minWidth: 200, width: 240 },
      },
      {
        key: "pair",
        label: "Pair",
        sortable: true,
      },
      {
        key: "price",

        label: "Price",
        numeric: true,
        sortable: true,
      },
      {
        key: "spread",

        label: "Spread",
        numeric: true,
        sortable: true,
      },
      {
        key: "volume",

        label: "24h Volume",
        numeric: true,
        sortable: true,
      },
      {
        key: "trustScore",
        label: "Trust",
        sortable: true,
        sx: { maxWidth: 100, minWidth: 100, width: 100 },
      },
      {
        filterable: true,
        key: "exchangeType",
        label: "Type",
        sortable: true,
        sx: { maxWidth: 100, minWidth: 100, width: 100 },
      },
      {
        key: "timestamp",
        label: "Last Updated",
        numeric: true,
        sortable: true,
        sx: TIMESTAMP_HEADER_SX,
      },
    ],
    []
  )

  if (isLoading) return <DefaultSpinner wrapper />
  if (isEmpty) {
    return (
      <Paper>
        <Stack justifyContent="center" alignItems="center" sx={{ height: 300 }}>
          {isEmpty && <NoDataAvailable />}
        </Stack>
      </Paper>
    )
  }

  return (
    <MemoryTable<TickerData>
      TableRowComponent={AssetMarketTableRow}
      headCells={headCells}
      rows={rows}
      initOrderBy="volume"
      initOrderDir="desc"
      defaultRowsPerPage={10}
      nullishSortPosition="start"
    />
  )
}
