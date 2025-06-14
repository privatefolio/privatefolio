import {
  BarChartOutlined,
  CandlestickChartSharp,
  ControlCamera,
  StraightenSharp,
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
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import {
  DeepPartial,
  IChartApi,
  ISeriesApi,
  MouseEventParams,
  SeriesOptionsCommon,
  SeriesType,
  Time as LcTime,
} from "lightweight-charts"
import { merge } from "lodash-es"
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StackedAreaData as LcStackedAreaData } from "src/lightweight-charts/plugins/stacked-area-series/data"
import { StackedAreaSeries } from "src/lightweight-charts/plugins/stacked-area-series/stacked-area-series"
import { StackedTooltipPrimitive } from "src/lightweight-charts/plugins/stacked-tooltip/stacked-tooltip"
import { $inspectTime } from "src/stores/pages/balances-store"
import { MonoFont } from "src/theme"
import { isInputFocused } from "src/utils/browser-utils"
import { noop } from "src/utils/utils"

import { useBoolean } from "../hooks/useBoolean"
import { ChartData, ResolutionString, StackedAreaData } from "../interfaces"
import { DeltaTooltipPrimitive } from "../lightweight-charts/plugins/delta-tooltip/delta-tooltip"
import {
  TooltipPrimitive,
  TooltipPrimitiveOptions,
} from "../lightweight-charts/plugins/tooltip/tooltip"
import { $favoriteIntervals, $preferredInterval, INTERVAL_LABEL_MAP } from "../stores/chart-store"
import { candleStickOptions, extractTooltipColors, profitColor } from "../utils/chart-utils"
import { Chart, ChartProps } from "./Chart"
import { CircularSpinner } from "./CircularSpinner"
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

interface SingleSeriesChartProps extends Omit<Partial<ChartProps>, "chartRef"> {
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
  seriesOptions?: DeepPartial<SeriesOptionsCommon>
  size?: "small" | "medium" | "large"
  tooltipOptions?: TooltipOpts
}

const DEFAULT_OPTS = {}

export function SingleSeriesChart(props: SingleSeriesChartProps) {
  const {
    allowedCursorModes = ["move", "inspect", "measure"],
    queryFn,
    initType = "Candlestick",
    size = "large",
    seriesOptions = DEFAULT_OPTS as DeepPartial<SeriesOptionsCommon>,
    tooltipOptions = DEFAULT_OPTS as TooltipOpts,
    emptyContent = <NoDataButton />,
    isStackedArea,
    onSeriesReady = noop,
    extraSettings,
    ...rest
  } = props

  const isMobile = useMediaQuery("(max-width: 599px)")

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
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [data, setData] = useState<ChartData[] | StackedAreaData[]>([])
  const [error, setError] = useState<Error | null>(null)

  const activeType = useMemo(() => {
    if (data.length <= 0) return preferredType

    const isCandlestickData = "open" in data[0]

    if (preferredType === "Candlestick" && !isCandlestickData) {
      return "Area"
    }

    return preferredType
  }, [preferredType, data])

  const shiftPressedRef = useRef(false)
  const ctrlPressedRef = useRef(false)

  const [seriesReady, setSeriesReady] = useState<boolean>(false)
  const [cursorMode, setCursorMode] = useState<CursorMode>(
    allowedCursorModes.length > 0 ? allowedCursorModes[0] : "move"
  )

  const theme = useTheme()

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

      const isStackedData = "values" in data[0]

      if (isStackedData) {
        const customSeriesView = new StackedAreaSeries<LcStackedAreaData>()
        const customSeries = chartRef.current.addCustomSeries(customSeriesView, {
          priceLineVisible: false,
          ...seriesOptions,
        })

        customSeries.setData(data as LcStackedAreaData[])
        seriesRef.current = customSeries
      } else {
        if (activeType === "Candlestick") {
          seriesRef.current = chartRef.current.addCandlestickSeries({
            ...candleStickOptions,
            priceLineVisible: false,
            ...seriesOptions,
          })
        } else if (activeType === "Histogram") {
          seriesRef.current = chartRef.current.addHistogramSeries({
            color: alpha(profitColor, 0.5),
            priceLineVisible: false,
            ...seriesOptions,
          })
        } else {
          seriesRef.current = chartRef.current.addAreaSeries({
            bottomColor: alpha(profitColor, 0),
            lineColor: profitColor,
            // lineType: 2,
            lineWidth: 2,
            priceLineVisible: false,
            ...seriesOptions,
          })
        }
        try {
          seriesRef.current.setData(data as ChartData[] as never)
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
    [activeType, seriesOptions, onSeriesReady]
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
        seriesRef.current?.detachPrimitive(regularTooltip)
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
          seriesRef.current?.attachPrimitive(regularTooltip)
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
      document.removeEventListener("keydown", handleKeydown)
      document.removeEventListener("keyup", handleKeyup)
    }
  }, [cursorMode, seriesReady, tooltipOptions, theme, allowedCursorModes, isStackedArea])

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
      })
      .catch((err) => {
        console.error(err)
        setError(err)
        setLoading(false)
      })
  }, [queryFn, activeInterval])

  const isEmpty = data.length === 0

  return (
    <>
      {/* {isLoading ? (
            <Stack gap={1.5} sx={{ height, overflow: "hidden" }} justifyContent="center">
              <Stack
                direction="row"
                gap={1.5}
                alignItems={"flex-end"}
                sx={{ paddingY: 1, width: 1168 }}
              >
                <CircularSpinner color="secondary" />
              </Stack>
            </Stack>
          ) : ( */}
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
            // ...(isLoading || isEmpty || error
            //   ? {
            //       borderColor: "transparent",
            //       opacity: 0,
            //       pointerEvents: "none",
            //     }
            //   : {}),
          }}
          alignItems="center"
          justifyContent="space-between"
          paddingX={1.5}
          direction="row"
        >
          <Stack direction="row" gap={1}>
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
                      {!["1d", "1w"].includes(interval) && (
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
                      disabled={!["1d", "1w"].includes(interval)}
                      // disabled={timeframes ? !timeframes.includes(interval as Timeframe) : false}
                      // className={timeframe === interval ? "active" : undefined}
                      title={interval}
                      aria-label={`Switch interval to ${INTERVAL_LABEL_MAP[interval]}`}
                      color={interval === activeInterval ? "accent" : "secondary"}
                      onClick={() => {
                        $preferredInterval.set(interval)
                      }}
                    >
                      {interval.replace("1d", "D").replace("1w", "W")}
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
              {isLoading && <CircularSpinner color="secondary" />}
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
              paddingX: 1.5,
            },
            bottom: 4,
            position: "absolute",
            width: "100%",
            zIndex: 1,
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
          <div>
            {queryTime !== undefined && (
              <QueryTimer queryTime={queryTime} variant="caption" fontFamily={MonoFont} />
            )}
          </div>
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
