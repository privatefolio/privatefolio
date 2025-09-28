import { upsertAuditLog } from "src/api/account/audit-logs-api"
import { fetchDailyPrices, getPricesForAsset } from "src/api/account/daily-prices-api"
import { US_SEC_PLATFORM_ID } from "src/extensions/metadata/us-sec-api"
import { ProgressUpdate } from "src/interfaces"
import { formatDate } from "src/utils/formatting-utils"
import { assertTimeConsistency } from "src/utils/test-utils"
import { expect, it } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const AMD_ID = `${US_SEC_PLATFORM_ID}:amd`

it("should fetch AMD prices using Yahoo", async () => {
  // arrange
  await upsertAuditLog(accountName, {
    assetId: AMD_ID,
    balance: "4",
    change: "4",
    id: "1",
    importIndex: 1,
    operation: "Buy",
    platformId: US_SEC_PLATFORM_ID,
    timestamp: Date.UTC(2008, 0, 1, 0, 0, 0, 0),
    wallet: "0x123",
  })
  const updates: ProgressUpdate[] = []
  // act
  await fetchDailyPrices(accountName, undefined, async (state) => updates.push(state), undefined, {
    until: Date.UTC(2011, 0, 1, 0, 0, 0, 0), // 1 Jan
  })
  const records = await getPricesForAsset(accountName, AMD_ID)
  // assert
  expect(records.length).toMatchInlineSnapshot(`1095`)
  expect(updates).toMatchInlineSnapshot(`
    [
      [
        1,
        "Fetching asset prices for 1 assets",
      ],
      [
        2,
        "Fetching asset prices in batches of 10",
      ],
      [
        undefined,
        "Fetched AMD using Yahoo! from Jul 15, 2008 to Dec 31, 2010",
      ],
      [
        undefined,
        "Fetched AMD using Yahoo! from Jan 02, 2008 to Jul 14, 2008",
      ],
      [
        100,
      ],
    ]
  `)
  expect(records.slice(0, 3)).toMatchInlineSnapshot(`
    [
      {
        "close": 7.139999866485596,
        "high": 7.400000095367432,
        "low": 7.019999980926514,
        "open": 7.400000095367432,
        "time": 1199232000,
        "value": 7.139999866485596,
        "volume": 46057300,
      },
      {
        "close": 6.769999980926514,
        "high": 7.179999828338623,
        "low": 6.75,
        "open": 7.150000095367432,
        "time": 1199318400,
        "value": 6.769999980926514,
        "volume": 34787400,
      },
      {
        "close": 6.25,
        "high": 6.639999866485596,
        "low": 6.099999904632568,
        "open": 6.639999866485596,
        "time": 1199404800,
        "value": 6.25,
        "volume": 51476400,
      },
    ]
  `)
  expect(records.slice(-3)).toMatchInlineSnapshot(`
    [
      {
        "close": 8.079999923706055,
        "high": 8.149999618530273,
        "low": 8.0600004196167,
        "open": 8.100000381469727,
        "time": 1293580800,
        "value": 8.079999923706055,
        "volume": 6926400,
      },
      {
        "close": 8.140000343322754,
        "high": 8.149999618530273,
        "low": 8.100000381469727,
        "open": 8.100000381469727,
        "time": 1293667200,
        "value": 8.140000343322754,
        "volume": 6213500,
      },
      {
        "close": 8.180000305175781,
        "high": 8.1899995803833,
        "low": 8.050000190734863,
        "open": 8.140000343322754,
        "time": 1293753600,
        "value": 8.180000305175781,
        "volume": 7971200,
      },
    ]
  `)
  expect(formatDate((records[0].time as number) * 1000)).toMatchInlineSnapshot(`"Jan 02, 2008"`)
  expect(formatDate((records[records.length - 1].time as number) * 1000)).toMatchInlineSnapshot(
    `"Dec 31, 2010"`
  )
  assertTimeConsistency(records)
})
