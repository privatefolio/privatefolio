import { upsertAuditLogs } from "src/api/account/audit-logs-api"
import * as dailyPricesApi from "src/api/account/daily-prices-api"
import { getValue } from "src/api/account/kv-api"
import {
  computeTrades,
  getAccountPnL,
  getTradePnL,
  getTrades,
  getTradesFullQuery,
} from "src/api/account/trades-api"
import { upsertTransactions } from "src/api/account/transactions-api"
import { AuditLog, AuditLogOperation, ProgressUpdate, Timestamp, Transaction } from "src/interfaces"
import { ONE_DAY, ONE_DAY_TIME } from "src/utils/formatting-utils"
import { describe, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

describe("trades-api", () => {
  it("should compute trades from audit logs", async () => {
    // arrange
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
      {
        assetId: "ethereum:ETH",
        balance: "-1",
        change: "-1",
        id: "4",
        importIndex: 4,
        operation: "Withdraw" as AuditLogOperation,
        platform: "ethereum",
        timestamp: 1600200000000 + 5 * ONE_DAY, // Sep 20, 2020
        txId: "tx4",
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
      {
        id: "tx4",
        importIndex: 4,
        metadata: { txHash: "0xabc4" },
        outgoing: "1.5",
        outgoingAsset: "ethereum:ETH",
        platform: "ethereum",
        timestamp: 1600200000000 + 5 * ONE_DAY, // Sep 20, 2020
        type: "Withdraw",
        wallet: "0x123",
      },
    ]
    await upsertAuditLogs(accountName, auditLogs)
    await upsertTransactions(accountName, transactions)
  })

  it.sequential("should compute trades", async () => {
    // arrange
    vi.spyOn(dailyPricesApi, "getPricesForAsset").mockImplementation(
      async (
        _accountName: string,
        _assetId: string,
        _timestamp?: Timestamp,
        start?: Timestamp,
        end?: Timestamp
      ) => {
        return [
          { time: 1600041600 - ONE_DAY_TIME, value: 1000 },
          { time: 1600041600, value: 1500 },
          { time: 1600041600 + ONE_DAY_TIME, value: 2000 },
          { time: 1600041600 + 2 * ONE_DAY_TIME, value: 2500 },
          { time: 1600041600 + 3 * ONE_DAY_TIME, value: 3000 },
          { time: 1600041600 + 4 * ONE_DAY_TIME, value: 3500 },
          { time: 1600041600 + 5 * ONE_DAY_TIME, value: 4000 },
          { time: 1600041600 + 6 * ONE_DAY_TIME, value: 4500 },
          { time: 1600041600 + 7 * ONE_DAY_TIME, value: 5000 },
          { time: 1600041600 + 8 * ONE_DAY_TIME, value: 5500 },
          { time: 1600041600 + 9 * ONE_DAY_TIME, value: 6000 },
        ].filter((x) => x.time >= start / 1000 && x.time <= end / 1000)
      }
    )
    const updates: ProgressUpdate[] = []
    // act
    await computeTrades(accountName, async (update) => {
      updates.push(update)
    })
    // assert
    const trades = await getTrades(accountName, await getTradesFullQuery())
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Fetching audit logs
      10,Processing 4 audit logs
      20,Found 1 asset groups
      80,Processed 1/1 asset groups
      80,Setting trades cursor to Sep 15, 2020
      80,Trades computation completed
      82,Processing 2 trades
      90,Processed 1/2 trades
      98,Processed 2/2 trades
      98,Setting profit & loss cursor to Sep 23, 2020
      100,PnL computation completed"
    `)
    expect(trades).toMatchInlineSnapshot(`
      [
        {
          "amount": "1.5",
          "assetId": "ethereum:ETH",
          "auditLogIds": [
            "1",
            "2",
            "3",
          ],
          "balance": "0",
          "closedAt": 1600200000000,
          "cost": [],
          "createdAt": 1600000000000,
          "deposits": [
            [
              "ethereum:ETH",
              "1.5",
              "0",
              "tx1",
              1600000000000,
            ],
            [
              "ethereum:ETH",
              "-1.0",
              "0",
              "tx2",
              1600100000000,
            ],
            [
              "ethereum:ETH",
              "-0.5",
              "0",
              "tx3",
              1600200000000,
            ],
          ],
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
        {
          "amount": "1",
          "assetId": "ethereum:ETH",
          "auditLogIds": [
            "4",
          ],
          "balance": "-1",
          "cost": [],
          "createdAt": 1600632000000,
          "deposits": [
            [
              "ethereum:ETH",
              "-1.5",
              "0",
              "tx4",
              1600632000000,
            ],
          ],
          "fees": [],
          "id": "2551033095",
          "proceeds": [],
          "tradeNumber": 2,
          "tradeStatus": "open",
          "tradeType": "Short",
          "txIds": [
            "tx4",
          ],
        },
      ]
    `)
    const tradePnL0 = await getTradePnL(accountName, trades[0].id)
    expect(tradePnL0).toMatchInlineSnapshot(`
      [
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2097354210_1599868800000",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1599868800000,
          "tradeId": "2097354210",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2097354210_1599955200000",
          "pnl": "1500",
          "positionValue": "1500",
          "proceeds": "0",
          "timestamp": 1599955200000,
          "tradeId": "2097354210",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2097354210_1600041600000",
          "pnl": "750",
          "positionValue": "750",
          "proceeds": "0",
          "timestamp": 1600041600000,
          "tradeId": "2097354210",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2097354210_1600128000000",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1600128000000,
          "tradeId": "2097354210",
        },
      ]
    `)
    const tradePnL1 = await getTradePnL(accountName, trades[1].id)
    expect(tradePnL1).toMatchInlineSnapshot(`
      [
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600473600000",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1600473600000,
          "tradeId": "2551033095",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600560000000",
          "pnl": "-4500",
          "positionValue": "-4500",
          "proceeds": "0",
          "timestamp": 1600560000000,
          "tradeId": "2551033095",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600646400000",
          "pnl": "-5000",
          "positionValue": "-5000",
          "proceeds": "0",
          "timestamp": 1600646400000,
          "tradeId": "2551033095",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600732800000",
          "pnl": "-5500",
          "positionValue": "-5500",
          "proceeds": "0",
          "timestamp": 1600732800000,
          "tradeId": "2551033095",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600819200000",
          "pnl": "-6000",
          "positionValue": "-6000",
          "proceeds": "0",
          "timestamp": 1600819200000,
          "tradeId": "2551033095",
        },
      ]
    `)
    const accountPnL = await getAccountPnL(accountName)
    expect(accountPnL).toMatchInlineSnapshot(`
      [
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1599868800000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "1500",
          "positionValue": "1500",
          "proceeds": "0",
          "timestamp": 1599955200000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "750",
          "positionValue": "750",
          "proceeds": "0",
          "timestamp": 1600041600000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1600128000000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1600473600000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "-4500",
          "positionValue": "-4500",
          "proceeds": "0",
          "timestamp": 1600560000000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "-5000",
          "positionValue": "-5000",
          "proceeds": "0",
          "timestamp": 1600646400000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "-5500",
          "positionValue": "-5500",
          "proceeds": "0",
          "timestamp": 1600732800000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "-6000",
          "positionValue": "-6000",
          "proceeds": "0",
          "timestamp": 1600819200000,
        },
      ]
    `)
    expect(await getValue<Timestamp>(accountName, "tradesCursor")).toMatchInlineSnapshot(
      `1600200000000`
    )
  })

  it.sequential("should refresh trades", async () => {
    // arrange
    vi.spyOn(dailyPricesApi, "getPricesForAsset").mockImplementation(
      async (
        _accountName: string,
        _assetId: string,
        _timestamp?: Timestamp,
        start?: Timestamp,
        end?: Timestamp
      ) => {
        return [
          { time: 1600041600 - ONE_DAY_TIME, value: 1000 },
          { time: 1600041600, value: 1500 },
          { time: 1600041600 + ONE_DAY_TIME, value: 2000 },
          { time: 1600041600 + 2 * ONE_DAY_TIME, value: 2500 },
          { time: 1600041600 + 3 * ONE_DAY_TIME, value: 3000 },
          { time: 1600041600 + 4 * ONE_DAY_TIME, value: 3500 },
          { time: 1600041600 + 5 * ONE_DAY_TIME, value: 4000 },
          { time: 1600041600 + 6 * ONE_DAY_TIME, value: 4500 },
          { time: 1600041600 + 7 * ONE_DAY_TIME, value: 5000 },
          { time: 1600041600 + 8 * ONE_DAY_TIME, value: 5500 },
          { time: 1600041600 + 9 * ONE_DAY_TIME, value: 6543 },
        ].filter((x) => x.time >= start / 1000 && x.time <= end / 1000)
      }
    )
    const updates: ProgressUpdate[] = []
    // act
    await computeTrades(accountName, async (update) => {
      updates.push(update)
    })
    // assert
    expect(updates.join("\n")).toMatchInlineSnapshot(`
      "0,Refreshing trades starting Sep 15, 2020
      0,Fetching audit logs
      10,Processing 1 audit logs
      20,Found 1 asset groups
      20,Found 1 open trades
      80,Processed 1/1 asset groups
      80,Trades computation completed
      80,Refreshing PnL starting Sep 23, 2020
      82,Processing 2 trades
      90,Processed 1/2 trades
      98,Processed 2/2 trades
      98,Setting profit & loss cursor to Sep 23, 2020
      100,PnL computation completed"
    `)
    const trades = await getTrades(accountName, await getTradesFullQuery())
    expect(trades).toMatchInlineSnapshot(`
      [
        {
          "amount": "1.5",
          "assetId": "ethereum:ETH",
          "auditLogIds": [
            "1",
            "2",
            "3",
          ],
          "balance": "0",
          "closedAt": 1600200000000,
          "cost": [],
          "createdAt": 1600000000000,
          "deposits": [
            [
              "ethereum:ETH",
              "1.5",
              "0",
              "tx1",
              1600000000000,
            ],
            [
              "ethereum:ETH",
              "-1.0",
              "0",
              "tx2",
              1600100000000,
            ],
            [
              "ethereum:ETH",
              "-0.5",
              "0",
              "tx3",
              1600200000000,
            ],
          ],
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
        {
          "amount": "1",
          "assetId": "ethereum:ETH",
          "auditLogIds": [
            "4",
          ],
          "balance": "-1",
          "cost": [],
          "createdAt": 1600632000000,
          "deposits": [
            [
              "ethereum:ETH",
              "-1.5",
              "0",
              "tx4",
              1600632000000,
            ],
          ],
          "fees": [],
          "id": "2551033095",
          "proceeds": [],
          "tradeNumber": 2,
          "tradeStatus": "open",
          "tradeType": "Short",
          "txIds": [
            "tx4",
          ],
        },
      ]
    `)
    const tradePnL0 = await getTradePnL(accountName, trades[0].id)
    expect(tradePnL0).toMatchInlineSnapshot(`
      [
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2097354210_1599868800000",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1599868800000,
          "tradeId": "2097354210",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2097354210_1599955200000",
          "pnl": "1500",
          "positionValue": "1500",
          "proceeds": "0",
          "timestamp": 1599955200000,
          "tradeId": "2097354210",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2097354210_1600041600000",
          "pnl": "750",
          "positionValue": "750",
          "proceeds": "0",
          "timestamp": 1600041600000,
          "tradeId": "2097354210",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2097354210_1600128000000",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1600128000000,
          "tradeId": "2097354210",
        },
      ]
    `)
    const tradePnL1 = await getTradePnL(accountName, trades[1].id)
    expect(tradePnL1).toMatchInlineSnapshot(`
      [
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600473600000",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1600473600000,
          "tradeId": "2551033095",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600560000000",
          "pnl": "-4500",
          "positionValue": "-4500",
          "proceeds": "0",
          "timestamp": 1600560000000,
          "tradeId": "2551033095",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600646400000",
          "pnl": "-5000",
          "positionValue": "-5000",
          "proceeds": "0",
          "timestamp": 1600646400000,
          "tradeId": "2551033095",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600732800000",
          "pnl": "-5500",
          "positionValue": "-5500",
          "proceeds": "0",
          "timestamp": 1600732800000,
          "tradeId": "2551033095",
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "id": "2551033095_1600819200000",
          "pnl": "-6543",
          "positionValue": "-6543",
          "proceeds": "0",
          "timestamp": 1600819200000,
          "tradeId": "2551033095",
        },
      ]
    `)
    const accountPnL = await getAccountPnL(accountName)
    expect(accountPnL).toMatchInlineSnapshot(`
      [
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1599868800000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "1500",
          "positionValue": "1500",
          "proceeds": "0",
          "timestamp": 1599955200000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "750",
          "positionValue": "750",
          "proceeds": "0",
          "timestamp": 1600041600000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1600128000000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "0",
          "positionValue": "0",
          "proceeds": "0",
          "timestamp": 1600473600000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "-4500",
          "positionValue": "-4500",
          "proceeds": "0",
          "timestamp": 1600560000000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "-5000",
          "positionValue": "-5000",
          "proceeds": "0",
          "timestamp": 1600646400000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "-5500",
          "positionValue": "-5500",
          "proceeds": "0",
          "timestamp": 1600732800000,
        },
        {
          "cost": "0",
          "deposits": "0",
          "fees": "0",
          "pnl": "-6543",
          "positionValue": "-6543",
          "proceeds": "0",
          "timestamp": 1600819200000,
        },
      ]
    `)
    expect(await getValue<Timestamp>(accountName, "tradesCursor")).toMatchInlineSnapshot(
      `1600200000000`
    )
  })
})
