import {
  BarChartOutlined,
  CandlestickChartSharp,
  ControlCamera,
  StraightenSharp,
  Timeline,
} from "@mui/icons-material"
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  IconButtonProps,
  Paper,
  Stack,
  SvgIcon,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import {
  AreaSeries,
  BaselineSeries,
  CandlestickSeries,
  DeepPartial,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  MouseEventParams,
  SeriesPartialOptionsMap,
  SeriesType,
  Time as LcTime,
} from "lightweight-charts"
import { merge } from "lodash-es"
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { StackedAreaData as LcStackedAreaData } from "src/lightweight-charts/plugins/stacked-area-series/data"
import {
  defaultOptions as stackedAreaDefaultOpts,
  StackedAreaSeriesOptions,
} from "src/lightweight-charts/plugins/stacked-area-series/options"
import { StackedAreaSeries } from "src/lightweight-charts/plugins/stacked-area-series/stacked-area-series"
import { StackedTooltipPrimitive } from "src/lightweight-charts/plugins/stacked-tooltip/stacked-tooltip"
import { $preferredInterval } from "src/stores/device-settings-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { isInputFocused } from "src/utils/browser-utils"
import { noop } from "src/utils/utils"

import { useBoolean } from "../hooks/useBoolean"
import { ChartData, ResolutionString, StackedAreaData } from "../interfaces"
import { CandleTooltipPrimitive } from "../lightweight-charts/plugins/candle-tooltip/candle-tooltip"
import { DeltaTooltipPrimitive } from "../lightweight-charts/plugins/delta-tooltip/delta-tooltip"
import {
  TooltipPrimitive,
  TooltipPrimitiveOptions,
} from "../lightweight-charts/plugins/tooltip/tooltip"
import { $favoriteIntervals, INTERVAL_LABEL_MAP, supportedIntervals } from "../stores/chart-store"
import {
  candleStickOptions,
  extractTooltipColors,
  lossColor,
  neutralColor,
  profitColor,
} from "../utils/chart-utils"
import { Chart, ChartProps } from "./Chart"
import { DefaultSpinner } from "./DefaultSpinner"
import { NoDataButton } from "./NoDataButton"
import { QueryTimer } from "./QueryTimer"

export function ChartIconButton({ active, ...rest }: IconButtonProps & { active: boolean }) {
  return (
    <IconButton
      size="small"
      sx={{ borderRadius: 0.5 }}
      color={active ? "accent" : "secondary"}
      {...rest}
    />
  )
}

export type QueryChartData = (
  interval: ResolutionString
) => Promise<ChartData[] | StackedAreaData[]>

export type TooltipOpts = Partial<Omit<TooltipPrimitiveOptions, "priceExtractor">>

export type CursorMode = "move" | "inspect" | "measure"

export type SeriesOpts = DeepPartial<SeriesPartialOptionsMap> & {
  StackedArea?: Partial<StackedAreaSeriesOptions>
}

export interface SingleSeriesChartProps extends Omit<Partial<ChartProps>, "chartRef"> {
  allowedCursorModes?: CursorMode[]
  emptyContent?: ReactNode
  extraSettings?: ReactNode
  /**
   * @default "Candlestick"
   */
  initType?: SeriesType
  isStackedArea?: boolean
  onSeriesReady?: (chart: IChartApi, series: ISeriesApi<SeriesType>) => void
  queryFn: QueryChartData
  seriesOptions?: SeriesOpts
  showToolbarAlways?: boolean
  size?: "small" | "medium" | "large"
  tooltipOptions?: TooltipOpts
}

export function SingleSeriesChart(props: SingleSeriesChartProps) {
  const theme = useTheme()
  const color = theme.palette.accent.main
  const darkMode = theme.palette.mode === "dark"

  const defaultSeriesOptions: SeriesOpts = useMemo(
    () => ({
      Area: {
        bottomColor: alpha(color, 0),
        lineColor: color,
        lineWidth: 1,
        priceLineVisible: false,
        topColor: alpha(color, darkMode ? 0.25 : 0.5),
      },
      Baseline: {
        baseLineColor: neutralColor,
        bottomFillColor1: alpha(lossColor, 0),
        bottomFillColor2: alpha(lossColor, 0.5),
        bottomLineColor: lossColor,
        lineWidth: 1,
        priceLineVisible: false,
        topFillColor1: alpha(profitColor, 0.5),
        topFillColor2: alpha(profitColor, 0),
        topLineColor: profitColor,
      },
      Candlestick: {
        ...candleStickOptions,
        priceLineVisible: false,
      },
      Histogram: {
        color: alpha(profitColor, 0.5),
        priceLineVisible: false,
      },
      StackedArea: stackedAreaDefaultOpts,
    }),
    [color, darkMode]
  )

  const {
    allowedCursorModes = ["move", "inspect", "measure"],
    queryFn,
    initType = "Candlestick",
    size = "large",
    seriesOptions = defaultSeriesOptions,
    tooltipOptions = {},
    emptyContent = <NoDataButton />,
    isStackedArea,
    onSeriesReady = noop,
    showToolbarAlways = false,
    extraSettings,
    ...rest
  } = props

  const { isMobile } = useBreakpoints()

  const height = useMemo(() => {
    if (size === "small") {
      return 200
    } else if (size === "medium") {
      return isMobile ? 320 : 444
    } else {
      return isMobile ? 400 : 540
    }
  }, [size, isMobile])

  const chartRef = useRef<IChartApi | undefined>(undefined)
  const seriesRef = useRef<ISeriesApi<SeriesType> | undefined>(undefined)
  // const preferredType = useStore($preferredType)
  const [preferredType, setPreferredType] = useState<SeriesType>(initType)
  const [isLoading, setLoading] = useState<boolean>(true)
  const [_isFirstLoad, setIsFirstLoad] = useState<boolean>(true)
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [data, setData] = useState<ChartData[] | StackedAreaData[]>([])
  const [error, setError] = useState<Error | null>(null)

  const activeType = useMemo(() => {
    if (data.length <= 0) return preferredType

    const isCandlestickData = "open" in data[0]

    if (preferredType === "Candlestick" && !isCandlestickData) {
      return "Baseline"
    }

    return preferredType
  }, [preferredType, data])

  const shiftPressedRef = useRef(false)
  const ctrlPressedRef = useRef(false)

  const [seriesReady, setSeriesReady] = useState<boolean>(false)
  const [cursorMode, setCursorMode] = useState<CursorMode>(
    allowedCursorModes.length > 0 ? allowedCursorModes[0] : "move"
  )

  const plotSeries = useCallback(
    (data: ChartData[] | StackedAreaData[]) => {
      if (!chartRef.current || data.length <= 0) {
        return
      }

      if (seriesRef.current) {
        try {
          chartRef.current.removeSeries(seriesRef.current)
        } catch {}
      }

      const opts = merge({}, defaultSeriesOptions, seriesOptions)

      const isStackedData = "values" in data[0]

      if (isStackedData) {
        const customSeriesView = new StackedAreaSeries<LcStackedAreaData>()
        const customSeries = chartRef.current.addCustomSeries(customSeriesView, opts.StackedArea)

        customSeries.setData(data as LcStackedAreaData[])
        seriesRef.current = customSeries
      } else {
        if (activeType === "Candlestick") {
          seriesRef.current = chartRef.current.addSeries(CandlestickSeries, opts.Candlestick)
        } else if (activeType === "Histogram") {
          seriesRef.current = chartRef.current.addSeries(HistogramSeries, opts.Histogram)
        } else if (activeType === "Baseline") {
          seriesRef.current = chartRef.current.addSeries(BaselineSeries, opts.Baseline)
        } else {
          seriesRef.current = chartRef.current.addSeries(AreaSeries, opts.Area)
        }
        try {
          let seriesData = data as ChartData[]

          if (activeType === "Histogram") {
            seriesData = data as ChartData[]
          }

          seriesRef.current.setData(seriesData as never)
        } catch (error) {
          console.error(error)
          setError(error as Error)
        }
      }
      //
      setSeriesReady(false)
      onSeriesReady(chartRef.current, seriesRef.current)
      setTimeout(() => {
        setSeriesReady(true)
      }, 0)
    },
    [defaultSeriesOptions, seriesOptions, onSeriesReady, activeType]
  )

  useEffect(() => {
    if (!chartRef.current || cursorMode !== "inspect") return

    function handleClick(param: MouseEventParams<LcTime>) {
      $inspectTime.set(typeof param.time === "number" ? param.time * 1000 : undefined)
    }

    chartRef.current.subscribeClick(handleClick)

    const chartRefCopy = chartRef.current

    return () => {
      $inspectTime.set(undefined)
      chartRefCopy?.unsubscribeClick(handleClick)
    }
  }, [seriesReady, cursorMode])

  useEffect(() => {
    if (!seriesRef.current || !seriesReady) return
    //
    const regularTooltip = new TooltipPrimitive(
      merge(
        {
          tooltip: extractTooltipColors(theme),
        },
        tooltipOptions
      )
    )
    const candleTooltip = new CandleTooltipPrimitive(
      merge(
        {
          tooltip: extractTooltipColors(theme),
        },
        tooltipOptions
      )
    )
    const deltaTooltip = new DeltaTooltipPrimitive(
      merge(
        {
          tooltip: extractTooltipColors(theme),
        },
        tooltipOptions
      )
    )
    const stackedTooltip = new StackedTooltipPrimitive(
      merge(
        {
          tooltip: extractTooltipColors(theme),
        },
        tooltipOptions
      )
    )
    //
    if (isStackedArea) {
      seriesRef.current.attachPrimitive(stackedTooltip)
    } else if (cursorMode === "measure") {
      seriesRef.current.attachPrimitive(deltaTooltip)
    } else if (activeType === "Candlestick") {
      seriesRef.current.attachPrimitive(candleTooltip)
    } else {
      seriesRef.current.attachPrimitive(regularTooltip)
    }

    if (cursorMode === "move") {
      chartRef.current?.applyOptions({
        handleScale: true,
        handleScroll: true,
      })
    } else {
      chartRef.current?.applyOptions({
        handleScale: false,
        handleScroll: false,
      })
    }

    function handleKeydown(event: KeyboardEvent) {
      if (isInputFocused()) return
      if (
        event.key === "Shift" &&
        !shiftPressedRef.current &&
        allowedCursorModes.includes("measure")
      ) {
        shiftPressedRef.current = true
        chartRef.current?.applyOptions({
          handleScale: false,
          handleScroll: false,
        })
        if (activeType === "Candlestick") {
          seriesRef.current?.detachPrimitive(candleTooltip)
        } else {
          seriesRef.current?.detachPrimitive(regularTooltip)
        }
        seriesRef.current?.attachPrimitive(deltaTooltip)
        setCursorMode("measure")
      } else if (event.key === "Control" && allowedCursorModes.includes("inspect")) {
        ctrlPressedRef.current = true
        chartRef.current?.applyOptions({
          handleScale: false,
          handleScroll: false,
        })
        setCursorMode("inspect")
      }
    }

    function handleKeyup(event: KeyboardEvent) {
      if (isInputFocused()) return
      if (event.key === "Shift") {
        shiftPressedRef.current = false
        if (allowedCursorModes.includes("move")) {
          chartRef.current?.applyOptions({
            handleScale: true,
            handleScroll: true,
          })
          seriesRef.current?.detachPrimitive(deltaTooltip)
          if (activeType === "Candlestick") {
            seriesRef.current?.attachPrimitive(candleTooltip)
          } else {
            seriesRef.current?.attachPrimitive(regularTooltip)
          }
          setCursorMode("move")
        } else if (allowedCursorModes.length > 0) {
          setCursorMode(allowedCursorModes[0])
        }
      } else if (event.key === "Control") {
        ctrlPressedRef.current = false
        if (allowedCursorModes.includes("move")) {
          chartRef.current?.applyOptions({
            handleScale: true,
            handleScroll: true,
          })
          setCursorMode("move")
        } else if (allowedCursorModes.length > 0) {
          setCursorMode(allowedCursorModes[0])
        }
      }
    }

    document.addEventListener("keydown", handleKeydown)
    document.addEventListener("keyup", handleKeyup)

    return () => {
      seriesRef.current?.detachPrimitive(deltaTooltip)
      seriesRef.current?.detachPrimitive(regularTooltip)
      seriesRef.current?.detachPrimitive(candleTooltip)
      document.removeEventListener("keydown", handleKeydown)
      document.removeEventListener("keyup", handleKeyup)
    }
  }, [
    cursorMode,
    seriesReady,
    tooltipOptions,
    theme,
    allowedCursorModes,
    isStackedArea,
    activeType,
  ])

  useEffect(() => {
    plotSeries(data)
  }, [plotSeries, data])

  const handleChartReady = useCallback(() => {
    plotSeries(data)
  }, [plotSeries, data])

  const { value: logScale, toggle: toggleLogScale } = useBoolean(false)
  // TODO6
  const { value: fullscreen, toggle: _toggleFullscreen } = useBoolean(false)

  const favoriteIntervals = useStore($favoriteIntervals)
  const activeInterval = useStore($preferredInterval)

  useEffect(() => {
    setQueryTime(null)
    setLoading(true)
    setError(null)
    const start = Date.now()

    queryFn(activeInterval)
      .then((result) => {
        // if (!isArray(result)) throw new Error("Invalid data")
        setData(result)
        setLoading(false)
        setQueryTime(Date.now() - start)
        setIsFirstLoad(false)
      })
      .catch((error) => {
        console.error(error)
        setError(error as Error)
        setLoading(false)
        setQueryTime(Date.now() - start)
        setIsFirstLoad(false)
      })
  }, [queryFn, activeInterval])

  const isEmpty = data.length === 0

  return (
    <>
      <Paper
        sx={{
          height,
          overflow: "hidden", // because of borderRadius
          position: "relative",
          // height: "100%",
          ...(fullscreen
            ? {
                bottom: 0,
                left: 0,
                position: "absolute",
                right: 0,
                top: 0,
              }
            : {
                // height: "calc(100% - 32px)",
              }),
        }}
      >
        <Stack
          sx={{
            borderBottom: "1px solid var(--mui-palette-TableCell-border)",
            marginLeft: -0.5,
            minHeight: 43,
            ...(isEmpty && !showToolbarAlways
              ? {
                  borderColor: "transparent",
                  opacity: 0,
                  pointerEvents: "none",
                }
              : {}),
          }}
          alignItems="center"
          justifyContent="space-between"
          paddingX={2}
          direction="row"
          flexWrap="wrap"
          gap={0.5}
          paddingY={0.5}
        >
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Stack direction="row">
              <Tooltip
                title={
                  <>
                    Switch to <b>Move</b> cursor
                  </>
                }
              >
                <span>
                  <ChartIconButton
                    active={cursorMode === "move"}
                    onClick={() => setCursorMode("move")}
                    disabled={!allowedCursorModes.includes("move")}
                  >
                    <ControlCamera fontSize="inherit" />
                  </ChartIconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  <>
                    Switch to <b>Inspect</b> cursor
                    <br />
                    (or hold <i>Ctrl</i> for quick toggle)
                  </>
                }
              >
                <span>
                  <ChartIconButton
                    active={cursorMode === "inspect"}
                    onClick={() => setCursorMode("inspect")}
                    disabled={!allowedCursorModes.includes("inspect")}
                  >
                    <SvgIcon fontSize="inherit">
                      {/* cc https://icon-sets.iconify.design/fluent/cursor-16-filled/ */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fill="currentColor"
                          d="M4.002 2.998a1 1 0 0 1 1.6-.8L13.6 8.2c.768.576.36 1.8-.6 1.8H9.053a1 1 0 0 0-.793.39l-2.466 3.215c-.581.758-1.793.347-1.793-.609z"
                        />
                      </svg>
                    </SvgIcon>
                  </ChartIconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  <>
                    <>
                      Switch to <b>Measure</b> cursor
                      <br />
                      (or hold <i>Shift</i> for quick toggle)
                    </>
                  </>
                }
              >
                <span>
                  <ChartIconButton
                    active={cursorMode === "measure"}
                    onClick={() => setCursorMode("measure")}
                    disabled={!allowedCursorModes.includes("measure")}
                  >
                    <StraightenSharp fontSize="inherit" />
                  </ChartIconButton>
                </span>
              </Tooltip>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack direction="row">
              {favoriteIntervals.map((interval) => (
                <Tooltip
                  key={interval}
                  title={
                    <>
                      Switch interval to {INTERVAL_LABEL_MAP[interval]}
                      {!supportedIntervals.includes(interval) && (
                        <Chip
                          size="small"
                          color="primary"
                          sx={{ fontSize: "0.625rem", height: 18, marginLeft: 1 }}
                          label="Coming soon"
                        />
                      )}
                    </>
                  }
                >
                  <span>
                    <Button
                      size="small"
                      sx={{ borderRadius: 0.5, paddingX: 1 }}
                      disabled={!supportedIntervals.includes(interval)}
                      // disabled={timeframes ? !timeframes.includes(interval as Timeframe) : false}
                      // className={timeframe === interval ? "active" : undefined}
                      title={interval}
                      aria-label={`Switch interval to ${INTERVAL_LABEL_MAP[interval]}`}
                      color={interval === activeInterval ? "accent" : "secondary"}
                      onClick={() => {
                        $preferredInterval.set(interval)
                      }}
                    >
                      {interval
                        .replace("1d", "D")
                        .replace("1w", "W")
                        .replace("3d", "3D")
                        .replace("1m", "M")}
                    </Button>
                  </span>
                </Tooltip>
              ))}
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack direction="row">
              <Tooltip title="Switch to Candlestick type">
                <span>
                  <ChartIconButton
                    disabled={data.length > 0 && !("open" in data[0])}
                    active={activeType === "Candlestick"}
                    onClick={() => setPreferredType("Candlestick")}
                    aria-label="Switch to Candlestick type"
                  >
                    <CandlestickChartSharp fontSize="inherit" />
                  </ChartIconButton>
                </span>
              </Tooltip>
              <Tooltip title="Switch to Baseline type">
                <span>
                  <ChartIconButton
                    active={activeType === "Baseline"}
                    onClick={() => setPreferredType("Baseline")}
                    aria-label="Switch to Baseline type"
                    disabled={isStackedArea}
                  >
                    <Timeline fontSize="inherit" />
                  </ChartIconButton>
                </span>
              </Tooltip>
              <Tooltip title="Switch to Area type">
                <span>
                  <ChartIconButton
                    active={activeType === "Area"}
                    onClick={() => setPreferredType("Area")}
                    aria-label="Switch to Area type"
                  >
                    {/* <ShowChart fontSize="inherit" /> */}
                    {/* cc https://icon-sets.iconify.design/material-symbols/area-chart/ */}
                    <SvgIcon fontSize="inherit">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="m21 16l-9.4-7.35l-3.975 5.475L3 10.5V7l4 3l5-7l5 4h4zM3 20v-7l5 4l4-5.5l9 7.025V20z"
                        />
                      </svg>
                    </SvgIcon>
                  </ChartIconButton>
                </span>
              </Tooltip>
              <Tooltip title="Switch to Histogram type">
                <span>
                  <ChartIconButton
                    active={activeType === "Histogram"}
                    onClick={() => setPreferredType("Histogram")}
                    aria-label="Switch to Histogram type"
                    disabled={isStackedArea}
                  >
                    <BarChartOutlined fontSize="inherit" />
                  </ChartIconButton>
                </span>
              </Tooltip>
            </Stack>
            <Divider orientation="vertical" flexItem />
          </Stack>
          {extraSettings}
          {/* <Stack direction="row">
            <IconButton
              size="small"
              // onClick={toggleFullscreen}
              color="secondary"
            >
              {fullscreen ? (
                <FullscreenExit fontSize="inherit" />
              ) : (
                <Fullscreen fontSize="inherit" />
              )}
            </IconButton>
            <IconButton size="small" color="secondary">
              <MoreHoriz fontSize="inherit" />
            </IconButton>
          </Stack> */}
        </Stack>
        <Box sx={{ height: "calc(100% - 43px - 4px)" }}>
          {(isLoading || isEmpty || error) && (
            <Stack
              justifyContent="center"
              alignItems="center"
              sx={{ height: "100%", width: "100%" }}
            >
              {isEmpty && !isLoading && !error && emptyContent}
              {isLoading && <DefaultSpinner />}
              {error && (
                <Stack spacing={1} alignItems="center">
                  <Typography>Error loading data</Typography>
                  <Typography color="error" variant="body2" component="div">
                    <span>{error.message}</span>
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
          <Box
            fontStyle={{ visibility: isLoading || isEmpty || error ? "hidden" : "visible" }}
            sx={{ height: "100%", width: "100%" }}
          >
            <Chart
              chartRef={chartRef}
              onChartReady={handleChartReady}
              logScale={logScale}
              cursor={
                cursorMode === "move" ? "move" : cursorMode === "inspect" ? "pointer" : "crosshair"
              }
              {...rest}
            />
          </Box>
        </Box>
        <Stack
          sx={{
            "& > *": {
              alignItems: "center",
              background: "var(--mui-palette-background-paper)",
              display: "flex",
              height: 28,
              paddingX: 2,
            },
            bottom: 4,
            position: "absolute",
            width: "100%",
            ...(isLoading || isEmpty || error
              ? {
                  borderColor: "transparent",
                  opacity: 0,
                  pointerEvents: "none",
                }
              : {}),
          }}
          justifyContent="space-between"
          direction="row"
        >
          <Box sx={{ zIndex: 2 }}>
            {queryTime !== undefined && <QueryTimer queryTime={queryTime} variant="caption" />}
          </Box>
          <div>
            <Tooltip title={logScale ? "Switch to linear scale" : "Switch to log scale"}>
              <Button
                color={logScale ? "accent" : "secondary"}
                size="small"
                variant="text"
                onClick={toggleLogScale}
                sx={{ borderRadius: 0.5, paddingX: 1 }}
              >
                Log
              </Button>
            </Tooltip>
          </div>
        </Stack>
      </Paper>
    </>
  )
}

/* <Divider orientation="vertical" flexItem sx={{ marginY: 1 }} />
                  <Button sx={{ borderRadius: 0.5, paddingX: 1 }} size="small" color="secondary">
                    Source: Binance.com
                  </Button> */
