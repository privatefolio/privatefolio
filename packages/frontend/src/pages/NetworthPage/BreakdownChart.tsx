import { Stack, useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useCallback, useEffect, useMemo } from "react"
import { QueryChartData, SingleSeriesChart, TooltipOpts } from "src/components/SingleSeriesChart"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { StackedAreaSeriesOptions } from "src/lightweight-charts/plugins/stacked-area-series/options"
import { $quoteCurrency } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { createValueFormatter } from "src/utils/chart-utils"

import { $rpc } from "../../workers/remotes"

export function BreakdownChart() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Breakdown - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      const result = await rpc.getBreakdownChartData(activeAccount, interval)
      return result
    },
    [rpc, activeAccount]
  )

  const currency = useStore($quoteCurrency)
  const isMobile = useMediaQuery("(max-width: 599px)")

  const chartOptions = useMemo(
    () => ({
      localization: {
        priceFormatter: createValueFormatter(currency),
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

  const seriesOptions: Partial<StackedAreaSeriesOptions> = useMemo(
    () => ({
      lineWidth: 1,
    }),
    []
  )

  return (
    <Stack gap={1}>
      <SingleSeriesChart
        size="medium"
        queryFn={queryFn}
        tooltipOptions={tooltipOptions}
        chartOptions={chartOptions}
        seriesOptions={seriesOptions}
        allowedCursorModes={["move"]}
        isStackedArea
      />
      <WorkInProgressCallout />
    </Stack>
  )
}
