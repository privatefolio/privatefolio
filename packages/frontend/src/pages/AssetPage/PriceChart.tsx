import { useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import { IChartApi, ISeriesApi, SeriesType, Time } from "lightweight-charts"
import React, { useCallback, useMemo } from "react"
import { SessionHighlighting } from "src/lightweight-charts/plugins/session-highlighting/session-highlighting"
import { VertLine } from "src/lightweight-charts/plugins/vertical-line/vertical-line"
import { $quoteCurrency } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { aggregateByWeek, createPriceFormatter, getDate } from "src/utils/chart-utils"

import { QueryChartData, SingleSeriesChart, TooltipOpts } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

type BalanceChartProps = {
  symbol: string
}

export function PriceChart(props: BalanceChartProps) {
  const { symbol } = props

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      const prices = await $rpc.get().getPricesForAsset($activeAccount.get(), symbol)
      return interval === "1w" ? aggregateByWeek(prices) : prices
    },
    [symbol]
  )

  const handleSeriesReady = useCallback((chart: IChartApi, series: ISeriesApi<SeriesType>) => {
    return
    const sessionHighlighter = (time: Time) => {
      const timestamp = getDate(time).getTime()
      if (timestamp >= 1681669295000 && timestamp <= 1694422703000) {
        return "rgba(41, 98, 255, 0.08)" // "rgba(255, 152, 1, 0.08)"
      }
      return ""
    }

    const sessionHighlighting = new SessionHighlighting(sessionHighlighter)
    series.attachPrimitive(sessionHighlighting)

    // WARN: vertical's line time must be present in the data
    const vertLine1 = new VertLine(chart, series, (1681669295 - (1681669295 % 86400)) as Time, {
      color: "rgba(41, 98, 255, 0.5)",
      // labelText: "z",
      // showLabel: true,
      width: 2,
    })
    const vertLine2 = new VertLine(chart, series, (1694422703 - (1694422703 % 86400)) as Time, {
      color: "rgba(41, 98, 255, 0.5)",
      // labelText: "z",
      // showLabel: true,
      width: 2,
    })

    series.attachPrimitive(vertLine1)
    series.attachPrimitive(vertLine2)
  }, [])

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

  return (
    <SingleSeriesChart
      queryFn={queryFn}
      tooltipOptions={tooltipOptions}
      chartOptions={chartOptions}
      onSeriesReady={handleSeriesReady}
    />
  )
}
