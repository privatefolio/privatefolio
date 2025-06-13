import * as auditLogsApi from "src/api/account/audit-logs-api"
import {
  computeTrades,
  getTradeAuditLogs,
  getTrades,
  getTradesFullQuery,
  getTradeTransactions,
} from "src/api/account/trades-api"
import * as transactionsApi from "src/api/account/transactions-api"
import { AuditLog, AuditLogOperation, ProgressUpdate, Transaction } from "src/interfaces"
import { describe, expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

describe("trades-api", () => {
  it("should compute trades from audit logs", async () => {
    const auditLogs: AuditLog[] = [
      {
        assetId: "ethereum:ETH",
        balance: "1.5",
        change: "1.5",
        id: "1",
        importIndex: 1,
        operation: "Deposit" as AuditLogOperation,
        platform: "ethereum",
        timestamp: 1600000000000,
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
        timestamp: 1600100000000,
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
        timestamp: 1600200000000,
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
        timestamp: 1600000000000,
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
        timestamp: 1600100000000,
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
        timestamp: 1600200000000,
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
        timestamp: 1600000000000,
        type: "Deposit",
        wallet: "0x123",
      },
    ]

    // Mock the getAuditLogs and getTransactionsByTxHash functions
    vi.spyOn(auditLogsApi, "getAuditLogs").mockResolvedValue(auditLogs)

    vi.spyOn(transactionsApi, "getTransaction").mockImplementation((accountName, txId) => {
      const tx = transactions.find((t) => t.id === txId)
      return Promise.resolve(tx)
    })

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
      100,Trades computation completed"
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
            ],
            [
              "ethereum:ETH",
              "0.001",
            ],
            [
              "ethereum:ETH",
              "0.001",
            ],
          ],
          "id": "trade_2097354210",
          "profit": [],
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
  })
})
