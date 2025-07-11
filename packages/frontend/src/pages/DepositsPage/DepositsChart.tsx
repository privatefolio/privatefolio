import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { Time } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { $quoteCurrency } from "src/stores/device-settings-store"
import { closeSubscription } from "src/utils/browser-utils"
import { aggregateCandles, createValueFormatter } from "src/utils/chart-utils"

import { QueryChartData, SingleSeriesChart, TooltipOpts } from "../../components/SingleSeriesChart"
import { $rpc } from "../../workers/remotes"

export function DepositsChart() {
  const activeAccount = useStore($activeAccount)
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)

  useEffect(() => {
    const subscription = rpc.subscribeToPnl(
      activeAccount,
      throttle(() => {
        setRefresh(Math.random())
      }, SHORT_THROTTLE_DURATION)
    )

    return closeSubscription(subscription, rpc)
  }, [activeAccount, connectionStatus, rpc])

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)

      const pnlData = await rpc.getAccountPnL(activeAccount)
      const values = pnlData.map((pnl) => {
        return {
          time: (pnl.timestamp / 1000) as Time,
          value: Number(pnl.deposits),
        }
      })

      return aggregateCandles(values, interval)
    },
    [activeAccount, refresh, rpc]
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
      initType="Baseline"
    />
  )
}
