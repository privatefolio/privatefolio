import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useCallback, useEffect, useState } from "react"
import { PercentChart } from "src/components/PercentChart"
import { QueryChartData } from "src/components/SingleSeriesChart"
import { ChartData, Time } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { $rpc } from "src/workers/remotes"

export function CpuUsageChart() {
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

  const cpuUsageQueryFn: QueryChartData = useCallback(async () => {
    const _refresh = refresh // reference for eslint dependency
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
    const metrics = await rpc.getServerHealth(
      "SELECT * FROM health_metrics WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT 1000",
      [twentyFourHoursAgo]
    )
    return metrics.map(
      (metric): ChartData => ({
        time: (metric.timestamp / 1000) as Time,
        value: metric.cpuUsage,
      })
    )
  }, [rpc, refresh])

  return <PercentChart queryFn={cpuUsageQueryFn} size="medium" />
}
