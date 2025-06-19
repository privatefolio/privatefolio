import { Box, useTheme } from "@mui/material"
import React, { useEffect, useRef } from "react"

import { candleStickOptions } from "../../utils/chart-utils"
import {
  ChartPropertiesOverrides,
  IChartingLibraryWidget,
  ResolutionString,
  widget as Widget,
} from "./charting_library/charting_library"
import { datafeed } from "./datafeed"
import { EXCHANGE_DELIMITER, loadChartData, resetChartData, saveChartData } from "./pro-chart-utils"

const containerId = "tv_chart_container"
const defaultSymbol = `privatefolio${EXCHANGE_DELIMITER}NETWORTH`

// https://www.tradingview.com/charting-library-docs/latest/getting_started/
export default function ProChart() {
  const widgetRef = useRef<IChartingLibraryWidget | null>(null)
  const theme = useTheme()
  const chartOverrides: Partial<ChartPropertiesOverrides> = {
    "mainSeriesProperties.candleStyle.borderDownColor": candleStickOptions.borderDownColor,
    "mainSeriesProperties.candleStyle.borderUpColor": candleStickOptions.borderUpColor,
    "mainSeriesProperties.candleStyle.downColor": candleStickOptions.downColor,
    "mainSeriesProperties.candleStyle.upColor": candleStickOptions.upColor,
    "mainSeriesProperties.candleStyle.wickDownColor": candleStickOptions.wickDownColor,
    "mainSeriesProperties.candleStyle.wickUpColor": candleStickOptions.wickUpColor,
    "mainSeriesProperties.highLowAvgPrice.highLowPriceLabelsVisible": true,
    // "mainSeriesProperties.priceAxisProperties.log": true, // TODO8 turn into atom
    // "mainSeriesProperties.style": 1,
    "paneProperties.background": theme.palette.background.paper,
    "paneProperties.backgroundType": "solid",
  }

  useEffect(() => {
    const savedData = loadChartData()

    window.localStorage.setItem("tradingview.PriceAxisCurrencyAndUnit.visibility", "alwaysOn")
    window.localStorage.setItem("tradingview.PriceAxisAutoLogButtons.visibility", "alwaysOff")

    widgetRef.current = new Widget({
      autosize: true,
      container: containerId,
      custom_css_url: "/tv.css",
      custom_font_family: "'Roboto Mono', monospace",
      datafeed,
      disabled_features: ["display_market_status", "show_symbol_logo_in_legend"],
      // debug: true,
      enabled_features: [
        "show_exchange_logos",
        "show_symbol_logos",
        "hide_resolution_in_legend",
        "show_symbol_logo_in_legend",
        "show_symbol_logo_for_compare_studies",
        "timeframes_toolbar",
        "seconds_resolution",
        "pricescale_currency",
      ],
      favorites: {
        chartTypes: ["Area", "Candles", "LineWithMarkers", "Baseline"],
        intervals: ["1S", "1", "60", "1D", "1W", "1M"] as ResolutionString[],
      },
      interval: "1D" as ResolutionString,
      library_path: "/charting_library/",
      loading_screen: {
        backgroundColor: theme.palette.background.default,
        foregroundColor: theme.palette.accent.main,
      },
      locale: "en",
      overrides: chartOverrides,
      saved_data: savedData,
      symbol: defaultSymbol,
      theme: theme.palette.mode,
      time_frames: [
        {
          description: "1 day in 1 minute intervals",
          resolution: "1" as ResolutionString,
          text: "1D",
        },
        {
          description: "1 week in 1 hour intervals",
          resolution: "60" as ResolutionString,
          text: "1W",
        },
        // {
        //   description: "1 month in 1 day intervals",
        //   resolution: "1D" as ResolutionString,
        //   text: "1M",
        // },
        {
          description: "3 months in 1 day intervals",
          resolution: "1D" as ResolutionString,
          text: "3M",
        },
        {
          description: "6 months in 1 day intervals",
          resolution: "1D" as ResolutionString,
          text: "6M",
        },
        // {
        //   description: "Year to day in 1 day intervals",
        //   resolution: "1D" as ResolutionString,
        //   text: "YTD",
        // },
        {
          description: "1 year in 1 day intervals",
          resolution: "1D" as ResolutionString,
          text: "1Y",
        },
        {
          description: "5 years in 1 week intervals",
          resolution: "1W" as ResolutionString,
          text: "5Y",
        },
        {
          description: "10 years in 1 week intervals",
          resolution: "1W" as ResolutionString,
          text: "10Y",
        },
      ],
      timezone: "Etc/UTC",
      // widgetbar: {
      //   datawindow: true,
      //   watchlist: true,
      // },
    })

    const handleAutoSave = () => {
      widgetRef.current?.save(saveChartData)
    }

    widgetRef.current?.subscribe("onAutoSaveNeeded", handleAutoSave)
    // widgetRef.current?.subscribe("onPlusClick", console.log)

    widgetRef.current.headerReady().then(function () {
      widgetRef.current?.createButton({
        align: "right",
        onClick: () => {
          resetChartData()
          // TODO9
          widgetRef.current?.activeChart().removeAllStudies()
          widgetRef.current?.activeChart().setSymbol(defaultSymbol)
          widgetRef.current?.activeChart().createStudy("Volume", true)
        },
        text: "Reset chart",
        title: "Reset the chart's auto saved state",
        useTradingViewStyle: true,
      })
    })

    return () => {
      try {
        widgetRef.current?.unsubscribe("onAutoSaveNeeded", handleAutoSave)
        widgetRef.current?.remove()
        widgetRef.current = null
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!widgetRef.current) return

    widgetRef.current.onChartReady(async () => {
      await widgetRef.current?.changeTheme(theme.palette.mode)
      widgetRef.current?.applyOverrides(chartOverrides)
      // widgetRef.current?.activeChart().removeAllStudies()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  return (
    <Box
      sx={{
        border: "1px solid var(--mui-palette-divider)",
        borderRadius: 1,
        height: "100%",
        overflow: "hidden",
        width: "100%",
      }}
      id={containerId}
    />
  )
}
