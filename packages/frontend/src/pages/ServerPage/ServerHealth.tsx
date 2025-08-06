import { LinearProgress, Paper, Skeleton, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { formatDistance } from "date-fns"
import React, { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { InfoCard, InfoCardRow, InfoCards } from "src/components/InfoCard"
import { NavTab } from "src/components/NavTab"
import { Tabs } from "src/components/Tabs"
import { ServerHealthMetric } from "src/interfaces"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { MonoFont } from "src/theme"
import { formatNumber } from "src/utils/formatting-utils"
import { $rpc } from "src/workers/remotes"

import { CpuUsageChart } from "./health/CpuUsageChart"
import { MemoryUsageChart } from "./health/MemoryUsageChart"

interface HealthStats {
  avgCpuUsage: number
  avgMemoryUsage: number
  count: number
  maxCpuUsage: number
  maxMemoryUsage: number
  minCpuUsage: number
  minMemoryUsage: number
}

export function ServerHealth() {
  const activeAccount = useStore($activeAccount)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)
  const [searchParams] = useSearchParams()
  const subTab = searchParams.get("subtab") || "cpu"
  const [currentMetrics, setCurrentMetrics] = useState<ServerHealthMetric | null>(null)
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [listenerCount, setListenerCount] = useState<number | null>(null)

  useEffect(() => {
    document.title = `Server health - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const fetchHealthData = useCallback(async () => {
    try {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
      const [current, stats] = await Promise.all([
        rpc.getCurrentSystemMetrics(),
        rpc.getHealthStats(twentyFourHoursAgo),
      ])
      setCurrentMetrics(current)
      setHealthStats(stats)
    } catch (error) {
      console.error("Failed to fetch health data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [rpc])

  useEffect(() => {
    fetchHealthData()
  }, [fetchHealthData])

  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === "connected") {
        fetchHealthData()
      }
    }, 5_000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [connectionStatus, fetchHealthData, activeAccount])

  useEffect(() => {
    const interval = setInterval(() => {
      rpc.computeListenerCount().then(setListenerCount)
    }, 1_000)

    return () => clearInterval(interval)
  }, [rpc])

  if (isLoading) {
    return <DefaultSpinner wrapper />
  }

  if (!currentMetrics) {
    return (
      <Paper sx={{ padding: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Unable to load server health data
        </Typography>
      </Paper>
    )
  }

  return (
    <Stack gap={2}>
      <InfoCards>
        <InfoCard>
          <InfoCardRow
            title="CPU usage"
            value={
              <Stack direction="row" alignItems="center" gap={1}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(currentMetrics.cpuUsage, 100)}
                  color={
                    currentMetrics.cpuUsage > 80
                      ? "error"
                      : currentMetrics.cpuUsage > 60
                        ? "warning"
                        : "success"
                  }
                  sx={{ borderRadius: 3, height: 4, width: 60 }}
                />
                <Typography fontFamily={MonoFont} variant="body2" sx={{ width: 45 }} align="right">
                  {currentMetrics.cpuUsage.toFixed(1)}%
                </Typography>
              </Stack>
            }
          />
          <InfoCardRow
            title="Memory usage"
            value={
              <Stack direction="row" alignItems="center" gap={1}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(currentMetrics.memoryUsage, 100)}
                  color={
                    currentMetrics.memoryUsage > 85
                      ? "error"
                      : currentMetrics.memoryUsage > 70
                        ? "warning"
                        : "success"
                  }
                  sx={{ borderRadius: 3, height: 4, width: 60 }}
                />
                <Typography fontFamily={MonoFont} variant="body2" sx={{ width: 45 }} align="right">
                  {currentMetrics.memoryUsage.toFixed(1)}%
                </Typography>
              </Stack>
            }
          />
          {currentMetrics.diskUsage !== undefined && (
            <InfoCardRow
              title="Disk"
              value={
                <Stack direction="row" alignItems="center" gap={1}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(currentMetrics.diskUsage, 100)}
                    color={
                      currentMetrics.diskUsage > 90
                        ? "error"
                        : currentMetrics.diskUsage > 80
                          ? "warning"
                          : "success"
                    }
                    sx={{ borderRadius: 3, height: 4, width: 60 }}
                  />
                  <Typography
                    fontFamily={MonoFont}
                    variant="body2"
                    sx={{ width: 45 }}
                    align="right"
                  >
                    {currentMetrics.diskUsage.toFixed(1)}%
                  </Typography>
                </Stack>
              }
            />
          )}
        </InfoCard>

        <InfoCard>
          <InfoCardRow
            title="Uptime"
            value={formatDistance(0, currentMetrics.uptime, {
              includeSeconds: true,
            })}
          />
          {currentMetrics.processCount && (
            <InfoCardRow title="Process count" value={formatNumber(currentMetrics.processCount)} />
          )}
          <InfoCardRow
            title="Active connections"
            value={
              listenerCount === null ? (
                <Skeleton height={20} width={40} />
              ) : (
                formatNumber(listenerCount)
              )
            }
          />
        </InfoCard>

        {healthStats && (
          <InfoCard>
            <InfoCardRow title="Avg CPU usage" value={`${healthStats.avgCpuUsage.toFixed(1)}%`} />
            <InfoCardRow title="Max CPU usage" value={`${healthStats.maxCpuUsage.toFixed(1)}%`} />
            <InfoCardRow
              title="Avg memory usage"
              value={`${healthStats.avgMemoryUsage.toFixed(1)}%`}
            />
            <InfoCardRow
              title="Max memory usage"
              value={`${healthStats.maxMemoryUsage.toFixed(1)}%`}
            />
          </InfoCard>
        )}
      </InfoCards>

      <div>
        <Tabs value={subTab} defaultValue={subTab}>
          <NavTab value="cpu" to={`?tab=health&subtab=cpu`} label="CPU usage" />
          <NavTab value="memory" to={`?tab=health&subtab=memory`} label="Memory usage" />
        </Tabs>
        {subTab === "cpu" && <CpuUsageChart />}
        {subTab === "memory" && <MemoryUsageChart />}
      </div>
    </Stack>
  )
}
