import { useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import { debounce } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { ChartData } from "src/interfaces"
import { DEFAULT_DEBOUNCE_DURATION } from "src/settings"
import { $quoteCurrency } from "src/stores/account-settings-store"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { closeSubscription } from "src/utils/browser-utils"
import {
  aggregateByWeek,
  createValueFormatter,
  lossColor,
  neutralColor,
  profitColor,
} from "src/utils/chart-utils"

import { QueryChartData, SingleSeriesChart, TooltipOpts } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

export function PnLChart() {
  const activeAccount = useStore($activeAccount)
  // hack to  refresh the chart
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    const subscription = $rpc.get().subscribeToNetworth(
      activeAccount,
      debounce(() => {
        setRefresh(Math.random())
      }, DEFAULT_DEBOUNCE_DURATION)
    )

    return closeSubscription(subscription, $rpc.get())
  }, [activeAccount, connectionStatus])

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)
      const balances = await $rpc.get().getNetworth(activeAccount)

      const data = balances.map((balance) => ({
        color: balance.change === 0 ? neutralColor : balance.change > 0 ? profitColor : lossColor,
        time: balance.time,
        value: balance.change,
      }))

      let result: ChartData[]

      if (interval === "1w") {
        result = aggregateByWeek(data).map((x) => ({
          ...x,
          color: x.value === 0 ? neutralColor : x.value > 0 ? profitColor : lossColor,
        }))
      } else {
        result = data
      }

      return result
    },
    [activeAccount, refresh]
  )

  const currency = useStore($quoteCurrency)
  const isMobile = useMediaQuery("(max-width: 599px)")

  const chartOptions = useMemo(
    () => ({
      localization: {
        priceFormatter: createValueFormatter(currency),
      },
    }),
    [currency]
  )

  const debugMode = useStore($debugMode)

  const tooltipOptions: TooltipOpts = useMemo(
    () => ({
      currencySymbol: currency.symbol,
      significantDigits: isMobile ? currency.significantDigits : currency.maxDigits,
      tooltip: {
        compact: isMobile,
        dateSecondary: !debugMode,
        showTime: debugMode,
      },
    }),
    [currency, debugMode, isMobile]
  )

  return (
    <SingleSeriesChart
      size="medium"
      queryFn={queryFn}
      tooltipOptions={tooltipOptions}
      chartOptions={chartOptions}
      initType="Histogram"
      allowedCursorModes={["move"]}
    />
  )
}
