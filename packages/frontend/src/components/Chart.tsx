import { Box, useTheme } from "@mui/material"
import {
  ChartOptions,
  createChart,
  CrosshairMode,
  DeepPartial,
  IChartApi,
  PriceScaleOptions,
} from "lightweight-charts"
import React, { CSSProperties, memo, MutableRefObject, useEffect, useMemo, useRef } from "react"

import { MonoFont } from "../theme"
import { noop } from "../utils/utils"

export type ChartProps = {
  chartOptions?: DeepPartial<ChartOptions>
  chartRef: MutableRefObject<IChartApi | undefined>
  cursor?: CSSProperties["cursor"]
  logScale?: boolean
  onChartReady?: () => void
}

const DEFAULT_OPTS = {}

function BaseChart(props: ChartProps) {
  const {
    chartRef,
    logScale = false,
    onChartReady = noop,
    chartOptions = DEFAULT_OPTS,
    cursor = "crosshair",
  } = props

  const theme = useTheme()
  const containerRef = useRef<HTMLElement>()

  const chartOpts = useMemo<DeepPartial<ChartOptions>>(
    () => ({
      crosshair: {
        horzLine: {
          labelBackgroundColor: theme.palette.primary.main,
        },
        mode: CrosshairMode.Normal,
        vertLine: {
          labelBackgroundColor: theme.palette.primary.main,
        },
      },
      grid: {
        horzLines: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (theme.palette as any).TableCell.border,
        },
        vertLines: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (theme.palette as any).TableCell.border,
        },
      },
      layout: {
        attributionLogo: false,
        background: {
          color: "transparent", // theme.palette.background.default
        },
        fontFamily: MonoFont,
        textColor: theme.palette.text.primary,
      },
      rightPriceScale: {
        // minimumWidth: 88,
      },
      width: containerRef.current?.clientWidth,
      ...chartOptions,
    }),
    [theme, chartOptions]
  )

  const priceScaleOptions = useMemo<DeepPartial<PriceScaleOptions>>(
    () => ({
      borderVisible: false,
      entireTextOnly: true,
      mode: logScale ? 1 : 0,
      scaleMargins: {
        bottom: 0,
        top: 0.2,
      },
    }),
    [logScale]
  )

  useEffect(() => {
    if (!containerRef.current) return

    chartRef.current = createChart(containerRef.current, chartOpts)

    chartRef.current.timeScale().applyOptions({
      borderVisible: false,
      // secondsVisible: true,
      // timeVisible: true,
      // rightOffset: 0,
      // secondsVisible: ["Block"].includes($timeframe.get()),
      // timeVisible: ["Hour", "Minute", "Block"].includes($timeframe.get()),
    })

    chartRef.current.priceScale("right").applyOptions(priceScaleOptions)

    const handleResize = () => {
      chartRef.current?.applyOptions({
        height: containerRef.current?.clientHeight,
        width: containerRef.current?.clientWidth,
      })
    }
    window.addEventListener("resize", handleResize)

    onChartReady()

    return function cleanup() {
      window.removeEventListener("resize", handleResize)
      chartRef.current?.remove()
      chartRef.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRef, containerRef])

  useEffect(() => {
    chartRef.current?.applyOptions(chartOpts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartOpts])

  useEffect(() => {
    chartRef.current?.priceScale("right").applyOptions(priceScaleOptions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceScaleOptions])

  return (
    <Box
      sx={{
        "& tr:first-of-type td": { cursor },
        height: "100%",
        position: "relative",
        width: "100%",
      }}
      ref={containerRef}
    />
  )
}

export const Chart = memo(BaseChart)
