import { UTCTimestamp } from "lightweight-charts"
import React, { useCallback } from "react"
import { $activeAccount } from "src/stores/account-store"
import { getAssetTicker } from "src/utils/assets-utils"

import { QueryFunction, SingleSeriesChart } from "../../components/SingleSeriesChart"
import { clancy } from "../../workers/remotes"

type BalanceChartProps = {
  symbol: string
}

export function BalanceChart(props: BalanceChartProps) {
  const { symbol: assetId } = props

  const queryFn: QueryFunction = useCallback(async () => {
    const docs = await clancy.getHistoricalBalances($activeAccount.get(), { symbol: assetId })

    const records = docs.map((item) => ({
      color: !item[assetId] ? "gray" : undefined,
      time: (item.timestamp / 1000) as UTCTimestamp,
      value: Number(item[assetId]) || 0,
    }))

    // TODO
    // const previousDay = docs[0].timestamp - 86400000
    // records.unshift({
    //   time: (previousDay / 1000) as UTCTimestamp,
    //   value: 0,
    // })

    return records
  }, [assetId])

  return (
    <SingleSeriesChart
      queryFn={queryFn}
      initType="Histogram"
      tooltipOptions={{
        currencySymbol: getAssetTicker(assetId),
        significantDigits: 18, // TODO
      }}
    />
  )
}
