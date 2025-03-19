/* eslint-disable @typescript-eslint/member-ordering */
import { darken } from "@mui/material"
import { CanvasRenderingTarget2D, Size } from "fancy-canvas"
import {
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  SeriesPrimitivePaneViewZOrder,
} from "lightweight-charts"

import { MainFont, MonoFont } from "../../../theme"
import { CommonTooltipOptions } from "../../../utils/chart-utils"

const getStyles = (compact: boolean) =>
  ({
    itemBlockPadding: compact ? 5 : 10,
    itemInlinePadding: compact ? 8 : 12,
    tooltipLineFontFamilies: [MainFont, MonoFont] as string[],
    tooltipLineFontSizes: compact ? [12, 16] : ([14, 18] as number[]),
    tooltipLineFontWeights: [400, 500] as number[],
    tooltipLineLineHeights: compact ? [18, 16] : ([23, 20] as number[]),
  }) as const

function determineSectionWidth(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  fontSizes: number[],
  fontWeights: number[],
  fontFamilies: string[],
  compact: boolean
) {
  let maxTextWidth = 0
  ctx.save()
  lines.forEach((line, index) => {
    ctx.font = `${fontWeights[index]} ${fontSizes[index]}px ${fontFamilies[index]}`
    const measurement = ctx.measureText(line)
    if (measurement.width > maxTextWidth) maxTextWidth = measurement.width
  })
  ctx.restore()
  return maxTextWidth + getStyles(compact).itemInlinePadding * 2
}

function determineSectionHeight(lines: string[], lineHeights: number[], compact) {
  let height = getStyles(compact).itemBlockPadding * 1.5 // TODO2: the height spacing is inconsistent across different devices...
  lines.forEach((_line, index) => {
    height += lineHeights[index]
  })
  return height
}

interface CalculatedVerticalDrawingPositions {
  mainY: number
  mainHeight: number
  leftTooltipTextY: number
  rightTooltipTextY: number
  deltaTextY: number
}

interface CalculatedHorizontalDrawingPositions {
  mainX: number
  mainWidth: number
  leftTooltipCentreX: number
  rightTooltipCentreX: number
  deltaCentreX: number
  deltaWidth: number
}

type CalculatedDrawingPositions = CalculatedVerticalDrawingPositions &
  CalculatedHorizontalDrawingPositions

function calculateVerticalDrawingPositions(
  data: DeltaTooltipData,
  compact
): CalculatedVerticalDrawingPositions {
  const mainY = data.topSpacing

  const leftTooltipHeight =
    data.tooltips.length < 1
      ? 0
      : determineSectionHeight(
          data.tooltips[0].lineContent,
          getStyles(compact).tooltipLineLineHeights,
          compact
        )
  const rightTooltipHeight =
    data.tooltips.length < 2
      ? 0
      : determineSectionHeight(
          data.tooltips[1].lineContent,
          getStyles(compact).tooltipLineLineHeights,
          compact
        )
  const deltaHeight = determineSectionHeight(
    [data.deltaTopLine, data.deltaBottomLine].filter(Boolean),
    getStyles(compact).tooltipLineLineHeights,
    compact
  )

  const mainHeight = Math.max(leftTooltipHeight, rightTooltipHeight, deltaHeight)
  const leftTooltipTextY = Math.round(
    getStyles(compact).itemBlockPadding + (mainHeight - leftTooltipHeight) / 2
  )
  const rightTooltipTextY = Math.round(
    getStyles(compact).itemBlockPadding + (mainHeight - rightTooltipHeight) / 2
  )
  const deltaTextY = Math.round(
    getStyles(compact).itemBlockPadding + (mainHeight - deltaHeight) / 2
  )

  return {
    deltaTextY,
    leftTooltipTextY,
    mainHeight,
    mainY,
    rightTooltipTextY,
  }
}

function calculateInitialTooltipPosition(
  data: DeltaTooltipData,
  index: number,
  ctx: CanvasRenderingContext2D,
  mediaSize: Size,
  compact: boolean
) {
  const lines = data.tooltips[index].lineContent
  const tooltipWidth = determineSectionWidth(
    ctx,
    lines,
    getStyles(compact).tooltipLineFontSizes,
    getStyles(compact).tooltipLineFontWeights,
    getStyles(compact).tooltipLineFontFamilies,
    compact
  )
  const halfWidth = tooltipWidth / 2
  const idealX = Math.min(
    Math.max(0, data.tooltips[index].x - halfWidth),
    mediaSize.width - tooltipWidth
  )
  const leftSpace = idealX
  const rightSpace = mediaSize.width - tooltipWidth - leftSpace
  return {
    leftSpace,
    rightSpace,
    width: tooltipWidth,
    x: idealX,
  }
}

function calculateDrawingHorizontalPositions(
  data: DeltaTooltipData,
  ctx: CanvasRenderingContext2D,
  mediaSize: Size,
  compact: boolean
): CalculatedHorizontalDrawingPositions {
  const leftPosition = calculateInitialTooltipPosition(data, 0, ctx, mediaSize, compact)
  if (data.tooltips.length < 2) {
    return {
      deltaCentreX: 0,
      deltaWidth: 0,
      leftTooltipCentreX: Math.round(leftPosition.x + leftPosition.width / 2),
      mainWidth: Math.round(leftPosition.width),
      mainX: Math.round(leftPosition.x),
      rightTooltipCentreX: 0,
    }
  }
  const rightPosition = calculateInitialTooltipPosition(data, 1, ctx, mediaSize, compact)
  const minDeltaWidth =
    data.tooltips.length < 2
      ? 0
      : determineSectionWidth(
          ctx,
          [data.deltaTopLine, data.deltaBottomLine].filter(Boolean),
          getStyles(compact).tooltipLineFontSizes,
          getStyles(compact).tooltipLineFontWeights,
          getStyles(compact).tooltipLineFontFamilies,
          compact
        )

  const overlapWidth = minDeltaWidth + leftPosition.x + leftPosition.width - rightPosition.x
  // if positive then we need to adjust positions
  if (overlapWidth > 0) {
    const halfOverlap = overlapWidth / 2
    if (leftPosition.leftSpace >= halfOverlap && rightPosition.rightSpace >= halfOverlap) {
      leftPosition.x -= halfOverlap
      rightPosition.x += halfOverlap
    } else {
      const leftSmaller = leftPosition.leftSpace < rightPosition.rightSpace
      if (leftSmaller) {
        const remainingOverlap = overlapWidth - leftPosition.leftSpace
        leftPosition.x -= leftPosition.leftSpace
        rightPosition.x += remainingOverlap
      } else {
        const remainingOverlap = overlapWidth - rightPosition.rightSpace
        leftPosition.x = Math.max(0, leftPosition.x - remainingOverlap)
        rightPosition.x += rightPosition.rightSpace
      }
    }
  }

  const deltaWidth = Math.round(rightPosition.x - leftPosition.x - leftPosition.width)
  const deltaCentreX = Math.round(rightPosition.x - deltaWidth / 2)
  return {
    deltaCentreX,
    deltaWidth,
    leftTooltipCentreX: Math.round(leftPosition.x + leftPosition.width / 2),
    mainWidth: Math.round(leftPosition.width + deltaWidth + rightPosition.width),
    mainX: Math.round(leftPosition.x),
    rightTooltipCentreX: Math.round(rightPosition.x + rightPosition.width / 2),
  }
}

function calculateDrawingPositions(
  data: DeltaTooltipData,
  ctx: CanvasRenderingContext2D,
  mediaSize: Size,
  compact: boolean
): CalculatedDrawingPositions {
  return {
    ...calculateVerticalDrawingPositions(data, compact),
    ...calculateDrawingHorizontalPositions(data, ctx, mediaSize, compact),
  }
}

class DeltaTooltipPaneRenderer implements ISeriesPrimitivePaneRenderer {
  _data: DeltaTooltipData
  _options: CommonTooltipOptions

  constructor(data: DeltaTooltipData, options: CommonTooltipOptions) {
    this._data = data
    this._options = options
  }

  draw(target: CanvasRenderingTarget2D) {
    if (this._data.tooltips.length < 1) return
    target.useMediaCoordinateSpace((scope) => {
      const ctx = scope.context
      const drawingPositions = calculateDrawingPositions(
        this._data,
        ctx,
        scope.mediaSize,
        this._options.compact
      )
      this._drawMainTooltip(ctx, drawingPositions)
      this._drawDeltaArea(ctx, drawingPositions)
      this._drawTooltipsText(ctx, drawingPositions)
      this._drawDeltaText(ctx, drawingPositions)
    })
  }

  _drawMainTooltip(ctx: CanvasRenderingContext2D, positions: CalculatedDrawingPositions) {
    ctx.save()
    ctx.fillStyle = this._options.backgroundColor
    // ctx.strokeStyle = "#000"
    // ctx.lineWidth = 1
    ctx.beginPath()
    ctx.fillRect(positions.mainX, positions.mainY, positions.mainWidth, positions.mainHeight)
    // ctx.strokeRect(positions.mainX, positions.mainY, positions.mainWidth, positions.mainHeight)
    ctx.restore()
  }

  _drawDeltaArea(ctx: CanvasRenderingContext2D, positions: CalculatedDrawingPositions) {
    ctx.save()
    ctx.fillStyle = this._data.deltaBackgroundColor
    ctx.beginPath()
    const halfWidth = Math.round(positions.deltaWidth / 2)
    ctx.fillRect(
      positions.deltaCentreX - halfWidth,
      positions.mainY,
      positions.deltaWidth,
      positions.mainHeight
    )
    ctx.restore()
  }

  _drawTooltipsText(ctx: CanvasRenderingContext2D, positions: CalculatedDrawingPositions) {
    ctx.save()
    this._data.tooltips.forEach((tooltip: DeltaSingleTooltipData, tooltipIndex: number) => {
      const x = tooltipIndex === 0 ? positions.leftTooltipCentreX : positions.rightTooltipCentreX
      let y =
        positions.mainY +
        (tooltipIndex === 0 ? positions.leftTooltipTextY : positions.rightTooltipTextY)

      tooltip.lineContent.forEach((line: string, lineIndex: number) => {
        ctx.font = `${getStyles(this._options.compact).tooltipLineFontWeights[lineIndex]} ${
          getStyles(this._options.compact).tooltipLineFontSizes[lineIndex]
        }px ${getStyles(this._options.compact).tooltipLineFontFamilies[lineIndex]}`
        ctx.fillStyle = lineIndex === 0 ? this._options.secondaryColor : this._options.color
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(line, x, y)
        y += getStyles(this._options.compact).tooltipLineLineHeights[lineIndex]
      })
    })
    ctx.restore()
  }

  _drawDeltaText(ctx: CanvasRenderingContext2D, positions: CalculatedDrawingPositions) {
    ctx.save()
    const x = positions.deltaCentreX
    let y = positions.mainY + positions.deltaTextY

    const lines = [this._data.deltaTopLine, this._data.deltaBottomLine]

    lines.forEach((line: string, lineIndex: number) => {
      ctx.font = `${getStyles(this._options.compact).tooltipLineFontWeights[lineIndex]} ${
        getStyles(this._options.compact).tooltipLineFontSizes[lineIndex]
      }px ${getStyles(this._options.compact).tooltipLineFontFamilies[lineIndex]}`
      ctx.fillStyle = this._data.deltaTextColor
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.fillText(line, x, y)

      // Draw background for the percentage change
      if (lineIndex === 1 && line) {
        const valueSize = ctx.measureText(line.split(" ")[0] + " ").width
        const percentSize = ctx.measureText(line.split(" ")[1])
        const padding = 4
        const backgroundWidth = percentSize.width + padding * 2 + 1
        const fullSize = ctx.measureText(line).width + padding * 2
        const backgroundHeight =
          getStyles(this._options.compact).tooltipLineLineHeights[lineIndex] + padding
        ctx.fillStyle = darken(this._data.deltaBackgroundColor, 0.15)
        ctx.fillRect(x - fullSize / 2 + valueSize, y - padding, backgroundWidth, backgroundHeight)
      }

      y += getStyles(this._options.compact).tooltipLineLineHeights[lineIndex]
    })
    ctx.restore()
  }
}

export class DeltaTooltipPaneView implements ISeriesPrimitivePaneView {
  _data: DeltaTooltipData
  _options: CommonTooltipOptions
  constructor(data: Partial<DeltaTooltipData>, options: Partial<CommonTooltipOptions>) {
    this._data = {
      ...defaultData,
      ...data,
    }
    this._options = {
      ...defaultOptions,
      ...options,
    }
  }

  update(data: Partial<DeltaTooltipData>): void {
    this._data = {
      ...this._data,
      ...data,
    }
  }

  renderer(): ISeriesPrimitivePaneRenderer | null {
    return new DeltaTooltipPaneRenderer(this._data, this._options)
  }

  zOrder(): SeriesPrimitivePaneViewZOrder {
    return "top"
  }
}

export interface DeltaSingleTooltipData {
  x: number
  lineContent: string[]
}

export interface DeltaTooltipData {
  deltaTopLine: string
  deltaBottomLine: string
  deltaBackgroundColor: string
  deltaTextColor: string

  topSpacing: number

  tooltips: DeltaSingleTooltipData[]
}

const defaultData: DeltaTooltipData = {
  deltaBackgroundColor: "#ffffff",
  deltaBottomLine: "",
  deltaTextColor: "#",
  deltaTopLine: "",
  tooltips: [],
  topSpacing: 20,
}

const defaultOptions: CommonTooltipOptions = {
  backgroundColor: "yellow",
  borderColor: "blue",
  color: "green",
  compact: false,
  dateSecondary: false,
  secondaryColor: "brown",
  showTime: true,
}
