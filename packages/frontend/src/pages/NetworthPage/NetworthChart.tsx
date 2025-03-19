import { useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import { debounce } from "lodash-es"
import React, { memo, useCallback, useEffect, useMemo, useState } from "react"
import { DEFAULT_DEBOUNCE_DURATION } from "src/settings"
import { $quoteCurrency } from "src/stores/account-settings-store"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { closeSubscription } from "src/utils/browser-utils"
import { aggregateByWeek, createValueFormatter } from "src/utils/chart-utils"

import { QueryChartData, SingleSeriesChart, TooltipOpts } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

function NetworthChartBase() {
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

    return closeSubscription(subscription)
  }, [activeAccount, connectionStatus])

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)
      const networth = await $rpc.get().getNetworth(activeAccount)
      return interval === "1w" ? aggregateByWeek(networth) : networth
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
    />
  )
}

export const NetworthChart = memo(NetworthChartBase)
