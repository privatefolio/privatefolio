import { useStore } from "@nanostores/react"
import React, { useCallback, useEffect, useState } from "react"
import { PercentChart } from "src/components/PercentChart"
import { QueryChartData } from "src/components/SingleSeriesChart"
import { ChartData, Time } from "src/interfaces"
import { $connectionStatus } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

export function CpuUsageChart() {
  const rpc = useStore($rpc)
  const connectionStatus = useStore($connectionStatus)
  const [chartRefresh, setChartRefresh] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === "connected") {
        setChartRefresh(Date.now())
      }
    }, 60 * 1_000)

    return () => clearInterval(interval)
  }, [connectionStatus])

  const cpuUsageQueryFn: QueryChartData = useCallback(async () => {
    const _refresh = chartRefresh // reference for eslint dependency
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
  }, [rpc, chartRefresh])

  return <PercentChart queryFn={cpuUsageQueryFn} size="medium" />
}
