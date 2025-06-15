import { useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import { debounce } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { ChartData, Trade } from "src/interfaces"
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

export function PnLChartNew({ trade }: { trade?: Trade }) {
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
  }, [activeAccount, connectionStatus, rpc])

  const queryFn: QueryChartData = useCallback(
    async (interval) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)
      const values = await rpc.getNetworth(activeAccount)

      const data = values.map((value) => ({
        color: value.change === 0 ? neutralColor : value.change > 0 ? profitColor : lossColor,
        time: value.time,
        value: value.change,
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
    [activeAccount, refresh, rpc]
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
