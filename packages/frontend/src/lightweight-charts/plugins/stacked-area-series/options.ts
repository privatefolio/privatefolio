import { customSeriesDefaultOptions, CustomSeriesOptions } from "lightweight-charts"

export interface StackedAreaColor {
  area: string
  line: string
}

export interface StackedAreaSeriesOptions extends CustomSeriesOptions {
  colors: readonly StackedAreaColor[]
  lineWidth: number
}

export const defaultOptions: StackedAreaSeriesOptions = {
  ...customSeriesDefaultOptions,
  colors: [
    { area: "rgba(41, 98, 255, 0.2)", line: "rgb(41, 98, 255)" },
    { area: "rgba(225, 87, 90, 0.2)", line: "rgb(225, 87, 90)" },
    { area: "rgba(242, 142, 44, 0.2)", line: "rgb(242, 142, 44)" },
    { area: "rgba(164, 89, 209, 0.2)", line: "rgb(164, 89, 209)" },
    { area: "rgba(27, 156, 133, 0.2)", line: "rgb(27, 156, 133)" },
    { area: "rgba(100, 181, 246, 0.2)", line: "rgb(100, 181, 246)" },
    { area: "rgba(236, 64, 122, 0.2)", line: "rgb(236, 64, 122)" },
    { area: "rgba(255, 202, 40, 0.2)", line: "rgb(255, 202, 40)" },
    { area: "rgba(121, 85, 72, 0.2)", line: "rgb(121, 85, 72)" },
    { area: "rgba(72, 176, 235, 0.2)", line: "rgb(72, 176, 235)" },
    { area: "rgba(156, 204, 101, 0.2)", line: "rgb(156, 204, 101)" },
    { area: "rgba(255, 138, 101, 0.2)", line: "rgb(255, 138, 101)" },
    { area: "rgba(149, 117, 205, 0.2)", line: "rgb(149, 117, 205)" },
    { area: "rgba(0, 188, 212, 0.2)", line: "rgb(0, 188, 212)" },
    { area: "rgba(123, 31, 162, 0.2)", line: "rgb(123, 31, 162)" },
    { area: "rgba(255, 171, 145, 0.2)", line: "rgb(255, 171, 145)" },
    { area: "rgba(128, 222, 234, 0.2)", line: "rgb(128, 222, 234)" },
    { area: "rgba(255, 241, 118, 0.2)", line: "rgb(255, 241, 118)" },
    { area: "rgba(205, 220, 57, 0.2)", line: "rgb(205, 220, 57)" },
    { area: "rgba(84, 110, 122, 0.2)", line: "rgb(84, 110, 122)" },
  ],
  lineWidth: 2,
} as const
