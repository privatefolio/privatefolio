import { useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useCallback, useMemo } from "react"
import { SqlParam, Time, Timestamp } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $quoteCurrency, $showQuotedAmounts } from "src/stores/device-settings-store"
import { getAssetTicker } from "src/utils/assets-utils"
import {
  aggregateByWeek,
  createNativeAmountFormatter,
  createValueFormatter,
  neutralColor,
} from "src/utils/chart-utils"

import {
  QueryChartData,
  SingleSeriesChart,
  SingleSeriesChartProps,
} from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

type AssetBalanceHistoryProps = {
  assetId: string
  end?: Timestamp
  start?: Timestamp
} & Omit<SingleSeriesChartProps, "queryFn">

export function AssetBalanceHistory(props: AssetBalanceHistoryProps) {
  const { assetId, end, start, ...rest } = props

  const activeAccount = useStore($activeAccount)
  const rpc = useStore($rpc)

  const showQuotedAmounts = useStore($showQuotedAmounts)
  const currency = useStore($quoteCurrency)

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

      const [balanceMaps, assetPrices] = await Promise.all([
        rpc.getBalances(activeAccount, query, params),
        showQuotedAmounts
          ? rpc.getPricesForAsset(activeAccount, assetId, undefined, start, end)
          : Promise.resolve([]),
      ])

      let hasHadABalance = false
      let firstNonZeroIndex = -1
      let lastNonZeroIndex = -1
      let records = balanceMaps.map((item, index) => {
        const balance = Number(item[assetId]) || 0
        const time = (item.timestamp / 1000) as Time

        if (!hasHadABalance && balance > 0) hasHadABalance = true

        if (balance !== 0) {
          if (firstNonZeroIndex === -1) firstNonZeroIndex = index
          lastNonZeroIndex = index
        }

        let price =
          assetPrices[index] && assetPrices[index].time === time ? assetPrices[index].value : 0

        if (showQuotedAmounts && price === 0) {
          price = assetPrices.find((x) => x.time === time)?.value || 0
        }

        return {
          color: !item[assetId] ? neutralColor : undefined,
          time,
          value: showQuotedAmounts ? balance * price : balance,
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
    [rpc, activeAccount, assetId, start, end, showQuotedAmounts]
  )

  const isMobile = useMediaQuery("(max-width: 599px)")

  const chartOptions = useMemo(
    () => ({
      localization: {
        priceFormatter: showQuotedAmounts
          ? createValueFormatter(currency, isMobile)
          : createNativeAmountFormatter(getAssetTicker(assetId)),
      },
    }),
    [showQuotedAmounts, currency, assetId, isMobile]
  )

  const tooltipOptions = useMemo(
    () => ({
      currencySymbol: showQuotedAmounts ? currency.symbol : getAssetTicker(assetId),
      significantDigits: showQuotedAmounts ? currency.maxDigits : undefined,
    }),
    [assetId, showQuotedAmounts, currency]
  )

  return (
    <SingleSeriesChart
      queryFn={queryFn}
      initType="Histogram"
      tooltipOptions={tooltipOptions}
      chartOptions={chartOptions}
      allowedCursorModes={["move", "measure"]}
      {...rest}
    />
  )
}
