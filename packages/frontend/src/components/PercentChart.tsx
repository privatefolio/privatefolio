import React from "react"

import { SeriesOpts, SingleSeriesChart, SingleSeriesChartProps } from "./SingleSeriesChart"

const seriesOptions: SeriesOpts["Area"] = {
  autoscaleInfoProvider: () => ({
    margins: {
      above: 10,
      below: 10,
    },
    priceRange: {
      maxValue: 80,
      minValue: 0,
    },
  }),
}

export function PercentChart(props: SingleSeriesChartProps) {
  return (
    <SingleSeriesChart
      initType="Area"
      hideToolbar
      tooltipOptions={{
        significantDigits: 2,
        tooltip: {
          compact: true,
        },
      }}
      seriesOptions={{
        Area: seriesOptions,
        Baseline: seriesOptions,
        Histogram: seriesOptions,
      }}
      chartOptions={{
        localization: {
          priceFormatter: (value: number) => `${value.toFixed(0)}%`,
        },
      }}
      {...props}
    />
  )
}
