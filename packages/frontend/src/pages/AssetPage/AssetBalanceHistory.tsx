import { useStore } from "@nanostores/react"
import React, { useCallback } from "react"
import { SqlParam, Time, Timestamp } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { aggregateByWeek, neutralColor } from "src/utils/chart-utils"

import { QueryChartData, SingleSeriesChart } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

type AssetBalanceHistoryProps = {
  assetId: string
  end?: Timestamp
  start?: Timestamp
}

export function AssetBalanceHistory(props: AssetBalanceHistoryProps) {
  const { assetId, end, start } = props

  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      let query = "SELECT * FROM balances"
      const params: SqlParam[] = []

      if (start && end) {
        query += " WHERE timestamp >= ? AND timestamp <= ?"
        params.push(start, end)
      } else if (start) {
        query += " WHERE timestamp >= ?"
        params.push(start)
      } else if (end) {
        query += " WHERE timestamp <= ?"
        params.push(end)
      }

      query += " ORDER BY timestamp ASC"

      const balanceMaps = await rpc.getBalances(activeAccount, query, params)

      let hasHadABalance = false
      let firstNonZeroIndex = -1
      let lastNonZeroIndex = -1
      let records = balanceMaps.map((item, index) => {
        const value = Number(item[assetId]) || 0

        if (!hasHadABalance && value > 0) hasHadABalance = true

        if (value !== 0) {
          if (firstNonZeroIndex === -1) firstNonZeroIndex = index
          lastNonZeroIndex = index
        }

        return {
          color: !item[assetId] ? neutralColor : undefined,
          time: (item.timestamp / 1000) as Time,
          value,
        }
      })

      if (!hasHadABalance) return []

      // remove excess of records of zero balances at the end, keep only one
      if (lastNonZeroIndex !== -1) {
        records = records.slice(0, lastNonZeroIndex + 2)
      }

      // remove excess of records of zero balances at the start, keep only one
      if (firstNonZeroIndex !== -1 && firstNonZeroIndex > 0) {
        records = records.slice(firstNonZeroIndex - 1)
      }

      return interval === "1w" ? aggregateByWeek(records) : records
    },
    [rpc, activeAccount, assetId, start, end]
  )

  return (
    <SingleSeriesChart
      queryFn={queryFn}
      initType="Histogram"
      tooltipOptions={{
        currencySymbol: getAssetTicker(assetId),
      }}
      allowedCursorModes={["move", "measure"]}
    />
  )
}
