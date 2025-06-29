import { SdCardRounded } from "@mui/icons-material"
import { MenuItem, Select, SelectChangeEvent, Stack, Tooltip, useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import { debounce } from "lodash-es"
import { getLivePricesForAsset } from "privatefolio-backend/build/src/extensions/prices/providers"
import { allPriceApiIds } from "privatefolio-backend/src/settings/price-apis"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ExtensionAvatar } from "src/components/ExtensionAvatar"
import { MyAsset } from "src/interfaces"
import { DEFAULT_DEBOUNCE_DURATION, PRICE_APIS_META, PriceApiId } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { $quoteCurrency } from "src/stores/device-settings-store"
import { closeSubscription } from "src/utils/browser-utils"
import { aggregateByWeek, createPriceFormatter } from "src/utils/chart-utils"
import { resolveUrl } from "src/utils/utils"

import { QueryChartData, SingleSeriesChart, TooltipOpts } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

type AssetPriceHistoryProps = {
  asset?: MyAsset
}

const defaultPriceApiId = allPriceApiIds[0]

export function AssetPriceHistory(props: AssetPriceHistoryProps) {
  const { asset } = props

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const [searchParams, setSearchParams] = useSearchParams()
  const priceApiId = (searchParams.get("priceApiId") || null) as PriceApiId | null
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)

  const handleChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      searchParams.set("priceApiId", event.target.value)
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (!asset) return

    const useDatabaseCache = priceApiId === null && !!asset.priceApiId
    if (!useDatabaseCache) return

    const subscription = rpc.subscribeToDailyPrices(
      activeAccount,
      debounce(() => {
        setRefresh(Math.random())
      }, DEFAULT_DEBOUNCE_DURATION)
    )

    return closeSubscription(subscription, rpc)
  }, [rpc, activeAccount, connectionStatus, asset, priceApiId])

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      if (!asset) return []
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)

      const useDatabaseCache = priceApiId === null && !!asset.priceApiId

      const prices = useDatabaseCache
        ? await rpc.getPricesForAsset(activeAccount, asset.id)
        : await getLivePricesForAsset(asset.id, priceApiId || defaultPriceApiId)

      return interval === "1w" ? aggregateByWeek(prices) : prices
    },
    [rpc, activeAccount, asset, priceApiId, refresh]
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

  const extraSettings = useMemo(() => {
    if (!asset) return null
    return (
      <Tooltip title="Price source" PopperProps={{ sx: { zIndex: 0 } }}>
        <Select
          size="small"
          variant="filled"
          disableUnderline
          color="secondary"
          onChange={handleChange}
          value={priceApiId || (asset.priceApiId ? "" : defaultPriceApiId)}
          displayEmpty
          sx={{
            "& .MuiSelect-select": {
              borderRadius: 0.5,
              paddingX: 1.5,
              paddingY: 0.5,
            },
            "& input": {
              borderRadius: 0.5,
            },
            background: "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.05)",
            borderRadius: 0.5,
            fontSize: "0.8125rem",
          }}
        >
          {asset.priceApiId && (
            <MenuItem value="">
              <Stack direction="row" alignItems={"center"} gap={1}>
                <SdCardRounded sx={{ fontSize: "1rem !important" }} />
                Database cache
              </Stack>
            </MenuItem>
          )}
          {allPriceApiIds.map((priceApiId) => (
            <MenuItem key={priceApiId} value={priceApiId}>
              <Stack direction="row" alignItems={"center"} gap={1}>
                <ExtensionAvatar
                  size="small"
                  src={resolveUrl(PRICE_APIS_META[priceApiId].logoUrl)}
                  alt={priceApiId}
                />
                {PRICE_APIS_META[priceApiId].name}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
    )
  }, [asset, priceApiId, handleChange])

  if (!asset) return null

  return (
    <>
      <SingleSeriesChart
        queryFn={queryFn}
        tooltipOptions={tooltipOptions}
        chartOptions={chartOptions}
        extraSettings={extraSettings}
      />
    </>
  )
}
