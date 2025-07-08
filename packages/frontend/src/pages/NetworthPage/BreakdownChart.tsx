import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useCallback, useEffect, useMemo } from "react"
import {
  QueryChartData,
  SeriesOpts,
  SingleSeriesChart,
  TooltipOpts,
} from "src/components/SingleSeriesChart"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { $quoteCurrency } from "src/stores/device-settings-store"
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
  const { isMobile } = useBreakpoints()

  const chartOptions = useMemo(
    () => ({
      localization: {
        priceFormatter: createValueFormatter(currency, isMobile),
      },
    }),
    [currency, isMobile]
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

  const seriesOptions: SeriesOpts = useMemo(
    () => ({
      StackedArea: {
        lineWidth: 1,
      },
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
