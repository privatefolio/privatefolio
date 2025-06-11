import { useStore } from "@nanostores/react"
import React, { useCallback } from "react"
import { Time } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { aggregateByWeek, neutralColor } from "src/utils/chart-utils"

import { QueryChartData, SingleSeriesChart } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

type BalanceChartProps = {
  assetId: string
}

export function BalanceChart(props: BalanceChartProps) {
  const { assetId } = props

  const activeAccount = useStore($activeAccount)

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      const balanceMaps = await $rpc.get().getBalances(activeAccount)

      let hasHadABalance = false
      let lastNonZeroIndex = -1
      let records = balanceMaps.map((item, index) => {
        const value = Number(item[assetId]) || 0

        if (!hasHadABalance && value > 0) hasHadABalance = true

        if (value !== 0) {
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

      return interval === "1w" ? aggregateByWeek(records) : records
    },
    [activeAccount, assetId]
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
