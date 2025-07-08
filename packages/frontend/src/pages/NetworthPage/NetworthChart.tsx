import { useStore } from "@nanostores/react"
import { debounce } from "lodash-es"
import React, { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { DEFAULT_DEBOUNCE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { $quoteCurrency } from "src/stores/device-settings-store"
import { closeSubscription } from "src/utils/browser-utils"
import { aggregateCandles, createValueFormatter } from "src/utils/chart-utils"

import { QueryChartData, SingleSeriesChart, TooltipOpts } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

function NetworthChartBase() {
  const activeAccount = useStore($activeAccount)
  // hack to  refresh the chart
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)

  useEffect(() => {
    const subscription = rpc.subscribeToNetworth(
      activeAccount,
      debounce(() => {
        setRefresh(Math.random())
      }, DEFAULT_DEBOUNCE_DURATION)
    )

    return closeSubscription(subscription, rpc)
  }, [rpc, activeAccount, connectionStatus])

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)
      const networth = await rpc.getNetworth(activeAccount)
      return aggregateCandles(networth, interval)
    },
    [rpc, activeAccount, refresh]
  )

  const currency = useStore($quoteCurrency)
  const { isMobile } = useBreakpoints()

  const chartOptions = useMemo(
    () => ({
      localization: {
        priceFormatter: createValueFormatter(currency, isMobile),
      },
    }),
    [currency, isMobile]
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
