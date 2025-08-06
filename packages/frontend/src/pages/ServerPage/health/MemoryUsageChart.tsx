import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import { formatFileSize } from "privatefolio-backend/src/utils/formatting-utils"
import React, { useCallback, useEffect, useState } from "react"
import { QueryChartData, SingleSeriesChart } from "src/components/SingleSeriesChart"
import { StackedAreaData, Time } from "src/interfaces"
import { StackedTooltipPrimitiveOptions } from "src/lightweight-charts/plugins/stacked-tooltip/stacked-tooltip"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { $colorArray, stringToNumber } from "src/utils/color-utils"
import { $rpc } from "src/workers/remotes"

export function MemoryUsageChart() {
  const rpc = useStore($rpc)
  const connectionStatus = useStore($connectionStatus)
  const [refresh, setRefresh] = useState<number>(0)

  useEffect(() => {
    const subscription = rpc.subscribeToServerHealth(
      throttle(() => {
        setRefresh(Math.random())
      }, SHORT_THROTTLE_DURATION)
    )

    return closeSubscription(subscription, rpc)
  }, [rpc, connectionStatus])

  const queryFn: QueryChartData = useCallback(async () => {
    const _refresh = refresh // reference for eslint dependency
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
    const metrics = await rpc.getServerHealth(
      "SELECT * FROM health_metrics WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT 1000",
      [twentyFourHoursAgo]
    )
    return metrics
      .map(
        (metric): StackedAreaData => ({
          assets: ["Memory usage", "Memory total"],
          time: (metric.timestamp / 1000) as Time,
          values: [metric.memoryUsed || 0, metric.memoryTotal || 0],
        })
      )
      .filter((x) => !!x.values[0]) // Ensure no null values are returned
  }, [rpc, refresh])

  return (
    <SingleSeriesChart
      queryFn={queryFn}
      size="medium"
      isMultiArea
      initType="Area"
      hideToolbar
      tooltipOptions={
        {
          priceExtractor: (data: StackedAreaData) => {
            const d = data as StackedAreaData
            return d.values
              .map((value, index) => {
                const assetName = d.assets[index]
                const colorArray = $colorArray.get()
                const assetColor = colorArray[stringToNumber(assetName) % colorArray.length]

                const formattedValue = formatFileSize(value)

                return {
                  color: assetColor,
                  name: assetName,
                  value: formattedValue,
                  valueNumber: value,
                }
              })
              .filter((x) => x.valueNumber !== 0)
              .sort((a, b) => b.valueNumber - a.valueNumber)
          },
          tooltip: {
            compact: true,
          },
        } as Partial<StackedTooltipPrimitiveOptions>
      }
      chartOptions={{
        localization: {
          priceFormatter: (value: number) => formatFileSize(value),
        },
      }}
    />
  )
}
