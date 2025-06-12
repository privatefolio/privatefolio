import { MenuItem, Select, SelectChangeEvent, Stack, useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import { getLivePricesForAsset } from "privatefolio-backend/build/src/extensions/prices/providers"
import { allPriceApiIds } from "privatefolio-backend/src/settings/price-apis"
import React, { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { PlatformAvatar } from "src/components/PlatformAvatar"
import { SectionTitle } from "src/components/SectionTitle"
import { MyAsset } from "src/interfaces"
import { PRICE_APIS_META, PriceApiId } from "src/settings"
import { $quoteCurrency } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { aggregateByWeek, createPriceFormatter } from "src/utils/chart-utils"
import { resolveUrl } from "src/utils/utils"

import { QueryChartData, SingleSeriesChart, TooltipOpts } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

type BalanceChartProps = {
  asset?: MyAsset
}

const defaultPriceApiId = allPriceApiIds[0]

export function PriceChart(props: BalanceChartProps) {
  const { asset } = props

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const [searchParams, setSearchParams] = useSearchParams()
  const priceApiId = (searchParams.get("priceApiId") || null) as PriceApiId | null

  const handleChange = (event: SelectChangeEvent<string>) => {
    searchParams.set("priceApiId", event.target.value)
    setSearchParams(searchParams)
  }

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      if (!asset) return []

      const useCache = priceApiId === null && !!asset.priceApiId

      const prices = useCache
        ? await rpc.getPricesForAsset(activeAccount, asset.id)
        : await getLivePricesForAsset(asset.id, priceApiId || defaultPriceApiId)

      return interval === "1w" ? aggregateByWeek(prices) : prices
    },
    [rpc, activeAccount, asset, priceApiId]
  )

  const currency = useStore($quoteCurrency)
  const isMobile = useMediaQuery("(max-width: 599px)")

  const chartOptions = useMemo(
    () => ({
      localization: {
        priceFormatter: createPriceFormatter(currency),
      },
    }),
    [currency]
  )

  const debugMode = useStore($debugMode)

  const tooltipOptions: TooltipOpts = useMemo(
    () => ({
      currencySymbol: currency.symbol,
      significantDigits: isMobile ? currency.significantDigits : currency.maxDigits,
      tooltip: {
        compact: isMobile,
        dateSecondary: !debugMode,
        showTime: debugMode,
      },
    }),
    [currency, debugMode, isMobile]
  )

  if (!asset) return null

  return (
    <Stack gap={1}>
      <SingleSeriesChart
        queryFn={queryFn}
        tooltipOptions={tooltipOptions}
        chartOptions={chartOptions}
      />
      <Stack paddingX={1} alignItems="flex-start">
        <SectionTitle>Price source</SectionTitle>
        <Select
          size="small"
          onChange={handleChange}
          value={priceApiId || (asset.priceApiId ? "" : defaultPriceApiId)}
          displayEmpty
          sx={{
            "& .MuiSelect-select": {
              paddingX: 1.5,
              paddingY: 0.5,
            },

            borderRadius: 5,
            fontSize: "0.8125rem",
          }}
        >
          {asset.priceApiId && (
            <MenuItem value="">
              <Stack direction="row" alignItems={"center"} gap={1}>
                <PlatformAvatar
                  size="small"
                  src={resolveUrl(PRICE_APIS_META[asset.priceApiId].logoUrl)}
                  alt={asset.priceApiId}
                />
                {PRICE_APIS_META[asset.priceApiId].name}
                <span>(cached)</span>
              </Stack>
            </MenuItem>
          )}
          {allPriceApiIds.map((priceApiId) => (
            <MenuItem key={priceApiId} value={priceApiId}>
              <Stack direction="row" alignItems={"center"} gap={1}>
                <PlatformAvatar
                  size="small"
                  src={resolveUrl(PRICE_APIS_META[priceApiId].logoUrl)}
                  alt={priceApiId}
                />
                {PRICE_APIS_META[priceApiId].name}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Stack>
    </Stack>
  )
}
