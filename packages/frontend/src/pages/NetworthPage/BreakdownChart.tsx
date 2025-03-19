import { Stack, useMediaQuery } from "@mui/material"
import { useStore } from "@nanostores/react"
import { sql } from "privatefolio-backend/build/src/utils/sql-utils"
import React, { useCallback, useEffect, useMemo } from "react"
import { QueryChartData, SingleSeriesChart, TooltipOpts } from "src/components/SingleSeriesChart"
import { WorkInProgressCallout } from "src/components/WorkInProgressCallout"
import { StackedAreaSeriesOptions } from "src/lightweight-charts/plugins/stacked-area-series/options"
import { $quoteCurrency } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { createValueFormatter } from "src/utils/chart-utils"

import { $rpc } from "../../workers/remotes"

export function BreakdownChart() {
  useEffect(() => {
    document.title = `Breakdown - ${$activeAccount.get()} - Privatefolio`
  }, [])

  const queryFn: QueryChartData = useCallback(async (interval) => {
    const result = await $rpc.get().executeSql(
      $activeAccount.get(),
      sql`
      -- Construct a JSON array of records directly in SQL
      SELECT '[' || GROUP_CONCAT(json_record) || ']' AS json_data
      FROM (
        -- Begin subquery to generate individual JSON records
        WITH
        -- Retrieve all balances ordered by timestamp descending
        all_balances AS (
          SELECT * FROM balances
          ${
            interval === "1w"
              ? `WHERE strftime('%w', datetime(timestamp / 1000, 'unixepoch')) = '1'`
              : ``
          }
          ORDER BY timestamp DESC
        ),
            -- Expand the JSON data field into individual rows of assetIds and balances
            expanded_balances AS (
          SELECT
            b.timestamp,
            e.key AS assetId,
            e.value AS balance
          FROM all_balances b,
          json_each(b.data) e
        ),
        -- Calculate the asset value by multiplying the balance with the asset's price
        values_calculated AS (
          SELECT
            eb.timestamp,
            eb.assetId,
            eb.balance,
            COALESCE(json_extract(dp.price, '$.value'), 0) AS price_value,
            ROUND(CAST(eb.balance AS FLOAT) * COALESCE(json_extract(dp.price, '$.value'), 0), 2) AS asset_value
          FROM expanded_balances eb
          -- Join with daily_prices to get the price at the given timestamp
          LEFT JOIN daily_prices dp ON
            dp.assetId = eb.assetId AND
            dp.timestamp = eb.timestamp - (eb.timestamp % 86400000)
        ),
        -- Get the list of all unique assetIds and their tickers
        assets_list AS (
          SELECT DISTINCT
            eb.assetId,
            CASE
              WHEN eb.assetId IS NULL THEN '-'
              WHEN (LENGTH(eb.assetId) - LENGTH(REPLACE(eb.assetId, ':', ''))) = 1 THEN
                SUBSTR(eb.assetId, INSTR(eb.assetId, ':') + 1)
              ELSE
                SUBSTR(
                  eb.assetId,
                  INSTR(eb.assetId, ':') + INSTR(SUBSTR(eb.assetId, INSTR(eb.assetId, ':') + 1), ':') + 1
                )
            END AS ticker
          FROM expanded_balances eb
        ),
        -- Get the list of all unique timestamps
        timestamps AS (
          SELECT DISTINCT timestamp FROM all_balances
        ),
        -- Create all combinations of timestamps and assets
        timestamp_assets AS (
          SELECT t.timestamp, a.assetId, a.ticker
          FROM timestamps t
          CROSS JOIN assets_list a
        ),
        -- Left join the calculated values to get full values, replacing nulls with zero
        full_values AS (
          SELECT
            ta.timestamp,
            ta.assetId,
            ta.ticker,
            COALESCE(vc.asset_value, 0) AS asset_value
          FROM timestamp_assets ta
          LEFT JOIN values_calculated vc ON vc.timestamp = ta.timestamp AND vc.assetId = ta.assetId
        )
        -- Final selection: construct JSON records for each timestamp
        SELECT
          '{' ||
            '"time":' || (CAST(timestamp AS INTEGER) / 1000) || ',' ||
            '"assets":' || '[' || GROUP_CONCAT(json_quote(ticker) ORDER BY assetId) || ']' || ',' ||
            '"values":' || '[' || GROUP_CONCAT(asset_value ORDER BY assetId) || ']' ||
          '}' AS json_record
        FROM full_values
        GROUP BY timestamp
        ORDER BY timestamp ASC
      ) AS derived_table
      `
    )

    const data = JSON.parse(result[0][0] as string) || []
    return data
  }, [])

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

  const seriesOptions: Partial<StackedAreaSeriesOptions> = useMemo(
    () => ({
      lineWidth: 1,
    }),
    []
  )

  return (
    <Stack gap={1}>
      <SingleSeriesChart
        size="medium"
        queryFn={queryFn}
        tooltipOptions={tooltipOptions}
        chartOptions={chartOptions}
        seriesOptions={seriesOptions}
        allowedCursorModes={["move"]}
        isStackedArea
      />
      <WorkInProgressCallout />
    </Stack>
  )
}
