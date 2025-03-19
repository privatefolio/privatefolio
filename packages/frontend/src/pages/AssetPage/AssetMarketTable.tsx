import { Paper, Stack } from "@mui/material"
import { isAddress } from "ethers"
import { formatAddress } from "privatefolio-backend/src/utils/assets-utils"
import React, { useMemo } from "react"
import { CircularSpinner } from "src/components/CircularSpinner"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { NoDataAvailable } from "src/components/NoDataAvailable"
import { CoingeckoMetadataFull } from "src/interfaces"
import { HeadCell } from "src/utils/table-utils"

import { AssetMarketTableRow, TickerData } from "./AssetMarketTableRow"

interface AssetMarketsProps {
  isLoading: boolean
  metadata: CoingeckoMetadataFull | null
}

export function AssetMarketTable({ metadata, isLoading }: AssetMarketsProps) {
  const isEmpty = metadata === null || !metadata.tickers

  const rows: TickerData[] = useMemo(() => {
    if (!metadata || !metadata.tickers) return []

    return metadata.tickers.map((ticker, index) => {
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
  }, [metadata])

  const headCells = useMemo<HeadCell<TickerData>[]>(
    () => [
      {
        filterable: true,
        key: "exchangeType",
        label: "Type",
        sortable: true,
        sx: { maxWidth: 100, minWidth: 100, width: 100 },
      },
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
        key: "timestamp",
        label: "Last Updated",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
      },
    ],
    []
  )

  if (isLoading || isEmpty) {
    return (
      <Paper>
        <Stack justifyContent="center" alignItems="center" sx={{ height: 260 }}>
          {isEmpty && !isLoading && <NoDataAvailable />}
          {isLoading && <CircularSpinner color="secondary" />}
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
    />
  )
}
