import { upsertAuditLogs } from "src/api/account/audit-logs-api"
import * as dailyPricesApi from "src/api/account/daily-prices-api"
import {
  computeTrades,
  getAccountPnL,
  getTradeAuditLogs,
  getTradePnL,
  getTrades,
  getTradesFullQuery,
  getTradeTransactions,
} from "src/api/account/trades-api"
import { upsertTransactions } from "src/api/account/transactions-api"
import { AuditLog, AuditLogOperation, ProgressUpdate, Transaction } from "src/interfaces"
import { ONE_DAY_TIME } from "src/utils/formatting-utils"
import { describe, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

describe("trades-api", () => {
  it("should compute trades from audit logs", async () => {
    // Mock getPricesForAsset to return some test price data
    vi.spyOn(dailyPricesApi, "getPricesForAsset").mockResolvedValue([
      { time: 1600041600 - ONE_DAY_TIME, value: 1000 },
      { time: 1600041600, value: 1500 },
      { time: 1600041600 + ONE_DAY_TIME, value: 2000 },
      { time: 1600041600 + 2 * ONE_DAY_TIME, value: 2500 },
      { time: 1600041600 + 3 * ONE_DAY_TIME, value: 3000 },
    ])

    const auditLogs: AuditLog[] = [
      {
        assetId: "ethereum:ETH",
        balance: "1.5",
        change: "1.5",
        id: "1",
        importIndex: 1,
        operation: "Deposit" as AuditLogOperation,
        platform: "ethereum",
        timestamp: 1600000000000, // Sep 13, 2020
        txId: "tx1",
        wallet: "0x123",
      },
      {
        assetId: "ethereum:ETH",
        balance: "0.5",
        change: "-1.0",
        id: "2",
        importIndex: 2,
        operation: "Withdraw" as AuditLogOperation,
        platform: "ethereum",
        timestamp: 1600100000000, // Sep 14, 2020
        txId: "tx2",
        wallet: "0x123",
      },
      {
        assetId: "ethereum:ETH",
        balance: "0",
        change: "-0.5",
        id: "3",
        importIndex: 3,
        operation: "Withdraw" as AuditLogOperation,
        platform: "ethereum",
        timestamp: 1600200000000, // Sep 15, 2020
        txId: "tx3",
        wallet: "0x123",
      },
    ]

    const transactions: Transaction[] = [
      {
        fee: "0.001",
        feeAsset: "ethereum:ETH",
        id: "tx1",
        importIndex: 1,
        incoming: "1.5",
        incomingAsset: "ethereum:ETH",
        metadata: { txHash: "0xabc1" },
        platform: "ethereum",
        timestamp: 1600000000000, // Sep 13, 2020
        type: "Deposit",
        wallet: "0x123",
      },
      {
        fee: "0.001",
        feeAsset: "ethereum:ETH",
        id: "tx2",
        importIndex: 2,
        metadata: { txHash: "0xabc2" },
        outgoing: "1.0",
        outgoingAsset: "ethereum:ETH",
        platform: "ethereum",
        timestamp: 1600100000000, // Sep 14, 2020
        type: "Withdraw",
        wallet: "0x123",
      },
      {
        fee: "0.001",
        feeAsset: "ethereum:ETH",
        id: "tx3",
        importIndex: 3,
        metadata: { txHash: "0xabc3" },
        outgoing: "0.5",
        outgoingAsset: "ethereum:ETH",
        platform: "ethereum",
        timestamp: 1600200000000, // Sep 15, 2020
        type: "Withdraw",
        wallet: "0x123",
      },
      {
        fee: "0.001",
        feeAsset: "ethereum:ETH",
        id: "tx1-usdt",
        importIndex: 1,
        metadata: { txHash: "0xabc1" },
        outgoing: "2250",
        outgoingAsset: "ethereum:USDT",
        platform: "ethereum",
        timestamp: 1600000000000, // Sep 13, 2020
        type: "Deposit",
        wallet: "0x123",
      },
    ]

    await upsertAuditLogs(accountName, auditLogs)
    await upsertTransactions(accountName, transactions)

    const updates: ProgressUpdate[] = []

    // Compute trades
    await computeTrades(accountName, async (update) => {
      updates.push(update)
    })

    // Get the computed trades
    const trades = await getTrades(accountName, await getTradesFullQuery())

    // Reset mocks
    vi.restoreAllMocks()

    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching audit logs
      10,Processing 3 audit logs
      20,Found 1 asset groups
      90,Processed 1/1 asset groups
      80,Trades computation completed
      82,Processing 1 trades
      98,Processed 1/1 trades
      100,PnL computation completed"
    `)

    expect(trades).toMatchInlineSnapshot(`
      [
        {
          "amount": 1.5,
          "assetId": "ethereum:ETH",
          "auditLogIds": [
            "1",
            "2",
            "3",
          ],
          "balance": 0,
          "closedAt": 1600200000000,
          "cost": [],
          "createdAt": 1600000000000,
          "duration": 200000000,
          "fees": [
            [
              "ethereum:ETH",
              "0.001",
              "0",
              "tx1",
              1600000000000,
            ],
            [
              "ethereum:ETH",
              "0.001",
              "0",
              "tx2",
              1600100000000,
            ],
            [
              "ethereum:ETH",
              "0.001",
              "0",
              "tx3",
              1600200000000,
            ],
          ],
          "id": "2097354210",
          "proceeds": [],
          "tradeNumber": 1,
          "tradeStatus": "closed",
          "tradeType": "Long",
          "txIds": [
            "tx1",
            "tx2",
            "tx3",
          ],
        },
      ]
    `)

    // Test the new getTradeAuditLogs function
    const tradeAuditLogs = await getTradeAuditLogs(accountName, trades[0].id)
    expect(tradeAuditLogs).toMatchInlineSnapshot(`
      [
        "1",
        "2",
        "3",
      ]
    `)

    // Test the new getTradeTransactions function
    const tradeTransactions = await getTradeTransactions(accountName, trades[0].id)
    expect(tradeTransactions).toMatchInlineSnapshot(`
      [
        "tx1",
        "tx2",
        "tx3",
      ]
    `)

    const tradePnL = await getTradePnL(accountName, trades[0].id)
    const accountPnL = await getAccountPnL(accountName)

    // Verify trade PnL data
    expect(tradePnL).toMatchInlineSnapshot(`
      [
        {
          "cost": 0,
          "fees": 0,
          "id": "2097354210_1599868800000",
          "pnl": 0,
          "positionValue": 0,
          "proceeds": 0,
          "timestamp": 1599868800000,
          "tradeId": "2097354210",
        },
        {
          "cost": 0,
          "fees": 0,
          "id": "2097354210_1599955200000",
          "pnl": 1500,
          "positionValue": 1500,
          "proceeds": 0,
          "timestamp": 1599955200000,
          "tradeId": "2097354210",
        },
        {
          "cost": 0,
          "fees": 0,
          "id": "2097354210_1600041600000",
          "pnl": 750,
          "positionValue": 750,
          "proceeds": 0,
          "timestamp": 1600041600000,
          "tradeId": "2097354210",
        },
        {
          "cost": 0,
          "fees": 0,
          "id": "2097354210_1600128000000",
          "pnl": 0,
          "positionValue": 0,
          "proceeds": 0,
          "timestamp": 1600128000000,
          "tradeId": "2097354210",
        },
        {
          "cost": 0,
          "fees": 0,
          "id": "2097354210_1600214400000",
          "pnl": 0,
          "positionValue": 0,
          "proceeds": 0,
          "timestamp": 1600214400000,
          "tradeId": "2097354210",
        },
        {
          "cost": 0,
          "fees": 0,
          "id": "2097354210_1600300800000",
          "pnl": 0,
          "positionValue": 0,
          "proceeds": 0,
          "timestamp": 1600300800000,
          "tradeId": "2097354210",
        },
      ]
    `)

    expect(accountPnL).toMatchInlineSnapshot(`
      [
        {
          "cost": 0,
          "fees": 0,
          "pnl": 0,
          "positionValue": 0,
          "proceeds": 0,
          "timestamp": 1599868800000,
        },
        {
          "cost": 0,
          "fees": 0,
          "pnl": 1500,
          "positionValue": 1500,
          "proceeds": 0,
          "timestamp": 1599955200000,
        },
        {
          "cost": 0,
          "fees": 0,
          "pnl": 750,
          "positionValue": 750,
          "proceeds": 0,
          "timestamp": 1600041600000,
        },
        {
          "cost": 0,
          "fees": 0,
          "pnl": 0,
          "positionValue": 0,
          "proceeds": 0,
          "timestamp": 1600128000000,
        },
        {
          "cost": 0,
          "fees": 0,
          "pnl": 0,
          "positionValue": 0,
          "proceeds": 0,
          "timestamp": 1600214400000,
        },
        {
          "cost": 0,
          "fees": 0,
          "pnl": 0,
          "positionValue": 0,
          "proceeds": 0,
          "timestamp": 1600300800000,
        },
      ]
    `)
  })
})
