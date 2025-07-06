/* eslint-disable @typescript-eslint/member-ordering */
import { IChartApi } from "lightweight-charts"

import { MainFont, MonoFont } from "../../../theme"
import { CommonTooltipOptions } from "../../../utils/chart-utils"
import { CandleData } from "./candle-tooltip"

export interface CandleTooltipOptions extends CommonTooltipOptions {
  title: string
  followMode: "top" | "tracking"
  /** fallback horizontal deadzone width */
  horizontalDeadzoneWidth: number
  verticalDeadzoneHeight: number
  verticalSpacing: number
  /** topOffset is the vertical spacing when followMode is 'top' */
  topOffset: number
}

const defaultOptions: CandleTooltipOptions = {
  backgroundColor: "yellow",
  borderColor: "blue",
  color: "green",
  compact: false,
  dateSecondary: false,
  followMode: "top",
  horizontalDeadzoneWidth: 45,
  secondaryColor: "brown",
  showTime: true,
  title: "",
  topOffset: 15,
  verticalDeadzoneHeight: 60,
  verticalSpacing: 20,
}

export interface CandleTooltipContentData {
  title?: string
  candleData: CandleData
  date: string
  time: string
  symbol: string
}

export interface TooltipPosition {
  visible: boolean
  paneX: number
  paneY: number
}

export class CandleTooltipElement {
  private _chart: IChartApi | null

  private _element: HTMLDivElement | null
  private _titleElement: HTMLDivElement | null
  private _dateElement: HTMLDivElement | null
  private _timeElement: HTMLDivElement | null
  private _closeElement: HTMLDivElement | null
  private _ohlcContainer: HTMLDivElement | null
  private _changeContainer: HTMLDivElement | null

  private _options: CandleTooltipOptions

  private _lastTooltipWidth: number | null = null

  public constructor(chart: IChartApi, options: Partial<CandleTooltipOptions>) {
    this._options = {
      ...defaultOptions,
      ...options,
    }
    this._chart = chart

    const element = document.createElement("div")
    applyStyle(element, {
      "align-items": "center",
      "background-color": this._options.backgroundColor,
      "box-shadow": `0px 0px 1px ${this._options.borderColor}`,
      color: this._options.color,
      display: "flex",
      "flex-direction": "column",
      "font-family": MainFont,
      "font-size": this._options.compact ? "12px" : "14px",
      "font-weight": "400",
      left: "0%",
      "line-height": this._options.compact ? "14px" : "16px",
      opacity: "0",
      padding: this._options.compact ? "6px 10px" : "10px 14px",
      "pointer-events": "none",
      position: "absolute",
      top: "0",
      transform: "translate(calc(0px - 50%), 0px)",
      "z-index": "100",
    })

    const titleElement = document.createElement("div")
    applyStyle(titleElement, {
      "font-size": this._options.compact ? "14px" : "16px",
      "font-weight": "500",
      "line-height": "20px",
      "margin-bottom": "4px",
    })
    setElementText(titleElement, this._options.title)
    element.appendChild(titleElement)

    const dateContainer = document.createElement("div")
    applyStyle(dateContainer, {
      color: this._options.dateSecondary ? this._options.secondaryColor : "inherit",
      display: "flex",
      "flex-direction": "row",
      "font-weight": "400",
      "margin-bottom": this._options.compact ? "6px" : "8px",
    })
    element.appendChild(dateContainer)

    const dateElement = document.createElement("div")
    setElementText(dateElement, "")
    dateContainer.appendChild(dateElement)

    const timeElement = document.createElement("div")
    applyStyle(timeElement, {
      color: this._options.secondaryColor,
      "margin-left": "5px",
    })
    setElementText(timeElement, "")
    dateContainer.appendChild(timeElement)

    // OHLC Container
    const ohlcContainer = document.createElement("div")
    applyStyle(ohlcContainer, {
      "align-items": "center",
      display: "flex",
      "flex-direction": "column",
      "font-family": MonoFont,
      "font-size": this._options.compact ? "12px" : "13px",
      "font-weight": "400",
      gap: "4px",
      "margin-bottom": "4px",
      width: "100%",
    })
    element.appendChild(ohlcContainer)

    // Close Price Element (same styling as regular tooltip)
    const closeElement = document.createElement("div")
    applyStyle(closeElement, {
      "font-family": MonoFont,
      "font-size": this._options.compact ? "16px" : "18px",
      "font-weight": "500",
      "line-height": this._options.compact ? "16px" : "18px",
      "margin-bottom": this._options.compact ? "4px" : "6px",
      "margin-top": this._options.compact ? "4px" : "6px",
    })
    setElementText(closeElement, "")
    element.appendChild(closeElement)

    // Change Container
    const changeContainer = document.createElement("div")
    applyStyle(changeContainer, {
      "align-items": "center",
      display: "flex",
      "flex-direction": "row",
      "font-family": MonoFont,
      "font-size": this._options.compact ? "12px" : "13px",
      "font-weight": "500",
      gap: "2px",
    })
    element.appendChild(changeContainer)

    this._element = element
    this._titleElement = titleElement
    this._dateElement = dateElement
    this._timeElement = timeElement
    this._closeElement = closeElement
    this._ohlcContainer = ohlcContainer
    this._changeContainer = changeContainer

    const chartElement = this._chart.chartElement()
    chartElement.appendChild(this._element)

    const chartElementParent = chartElement.parentElement
    if (!chartElementParent) {
      console.error("Chart Element is not attached to the page.")
      return
    }
    const position = getComputedStyle(chartElementParent).position
    if (position !== "relative" && position !== "absolute") {
      console.error("Chart Element position is expected be `relative` or `absolute`.")
    }
  }

  public destroy() {
    if (this._chart && this._element) this._chart.chartElement().removeChild(this._element)
  }

  public applyOptions(options: Partial<CandleTooltipOptions>) {
    this._options = {
      ...this._options,
      ...options,
    }
  }

  public options(): CandleTooltipOptions {
    return this._options
  }

  public updateTooltipContent(content: CandleTooltipContentData) {
    if (!this._element) return
    const tooltipMeasurement = this._element.getBoundingClientRect()
    this._lastTooltipWidth = tooltipMeasurement.width

    if (content.title !== undefined && this._titleElement) {
      setElementText(this._titleElement, content.title)
    }

    setElementText(this._dateElement, content.date)
    setElementText(this._timeElement, this._options.showTime ? `at ${content.time}` : "")

    // Update close price (same format as regular tooltip)
    const closeText = `${content.symbol}${content.candleData.close}`
    setElementText(this._closeElement, closeText)

    // Update OHLC values
    if (this._ohlcContainer) {
      this._ohlcContainer.innerHTML = ""

      const ohlcData = [
        { label: "Open", value: content.candleData.open },
        { label: "High", value: content.candleData.high },
        { label: "Low", value: content.candleData.low },
      ]

      ohlcData.forEach(({ label, value }) => {
        const item = document.createElement("span")

        const labelEl = document.createElement("span")
        applyStyle(labelEl, {
          color: this._options.secondaryColor,
          "font-weight": "500",
        })
        setElementText(labelEl, label)

        const valueEl = document.createElement("span")
        applyStyle(valueEl, {
          "font-weight": "400",
        })
        setElementText(valueEl, ` ${content.symbol}${value}`)

        item.appendChild(labelEl)
        item.appendChild(valueEl)
        this._ohlcContainer!.appendChild(item)
      })
    }

    // Update change and percentage
    if (this._changeContainer) {
      this._changeContainer.innerHTML = ""

      const changeValue = parseFloat(content.candleData.change)
      const isPositive = changeValue > 0
      const isNegative = changeValue < 0

      let changeColor = this._options.color
      if (isPositive) {
        changeColor = "#00C851" // Green
      } else if (isNegative) {
        changeColor = "#FF4444" // Red
      }

      // Absolute change element
      const changeValueEl = document.createElement("div")
      applyStyle(changeValueEl, {
        color: changeColor,
        "text-align": "center",
      })
      const changeText = isPositive
        ? `+${content.symbol}${content.candleData.change}`
        : isNegative
          ? `-${content.symbol}${content.candleData.change.substring(1)}`
          : `${content.symbol}${content.candleData.change}`
      setElementText(changeValueEl, changeText)

      if (!this._options.compact && !this._options.dateSecondary) {
        this._changeContainer!.appendChild(changeValueEl)
      }

      // Percentage change element
      const changePercentEl = document.createElement("div")
      applyStyle(changePercentEl, {
        color: changeColor,
        "text-align": "center",
      })
      const percentText = isPositive
        ? `+${content.candleData.changePercent}%`
        : isNegative
          ? `${content.candleData.changePercent}%`
          : `${content.candleData.changePercent}%`
      setElementText(changePercentEl, `(${percentText})`)

      this._changeContainer!.appendChild(changePercentEl)
    }
  }

  public updatePosition(positionData: TooltipPosition) {
    if (!this._chart || !this._element) return
    this._element.style.opacity = positionData.visible ? "1" : "0"
    if (!positionData.visible) {
      return
    }
    const x = this._calculateXPosition(positionData, this._chart)
    const y = this._calculateYPosition(positionData)
    this._element.style.transform = `translate(${x}, ${y})`
  }

  private _calculateXPosition(positionData: TooltipPosition, chart: IChartApi): string {
    const x = positionData.paneX + chart.priceScale("left").width()
    const deadzoneWidth = this._lastTooltipWidth
      ? this._lastTooltipWidth / 2 + this._options.horizontalDeadzoneWidth
      : this._options.horizontalDeadzoneWidth
    const boundedX = Math.max(deadzoneWidth, Math.min(x, chart.timeScale().width() - deadzoneWidth))
    return `${boundedX - chart.priceScale("left").width()}px`
  }

  private _calculateYPosition(positionData: TooltipPosition): string {
    if (this._options.followMode === "top") {
      return `${this._options.topOffset}px`
    }
    const y = positionData.paneY - this._options.verticalDeadzoneHeight
    const boundedY = Math.max(this._options.verticalSpacing, y)
    return `${boundedY}px`
  }
}

function setElementText(element: HTMLDivElement | HTMLSpanElement | null, text: string) {
  if (element) {
    element.innerText = text
  }
}

function applyStyle(element: HTMLElement, styles: Record<string, string>) {
  Object.entries(styles).forEach(([key, value]) => {
    element.style.setProperty(key, value)
  })
}
