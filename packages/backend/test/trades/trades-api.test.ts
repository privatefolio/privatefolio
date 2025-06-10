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
  it("should have no trades initially", async () => {
    const trades = await getTrades(accountName)
    expect(trades).toHaveLength(0)
  })

  it("should compute trades from audit logs", async () => {
    // Create some simple audit logs
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

    // Add mock transactions
    const transactions: Transaction[] = [
      {
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
    ]

    // Mock the getAuditLogs and getTransactionsByTxHash functions
    vi.spyOn(auditLogsApi, "getAuditLogs").mockResolvedValue(auditLogs)

    vi.spyOn(transactionsApi, "getTransactionsByTxHash").mockImplementation((accountName, txId) => {
      const tx = transactions.find((t) => t.id === txId)
      return Promise.resolve(tx ? [tx] : [])
    })

    const progressUpdates: ProgressUpdate[] = []

    // Compute trades
    await computeTrades(accountName, async (update) => {
      progressUpdates.push(update)
    })

    // Get the computed trades
    const trades = await getTrades(accountName, await getTradesFullQuery())

    // Reset mocks
    vi.restoreAllMocks()

    // Verify the results
    expect(progressUpdates).toHaveLength(5) // Progress updates
    expect(progressUpdates[0]).toEqual([0, "Fetching audit logs"])
    expect(progressUpdates[4]).toEqual([100, "Trades computation completed"])

    expect(trades).toHaveLength(1)
    expect(trades[0]).toMatchObject({
      amount: 1.5,
      assetId: "ethereum:ETH",
      balance: 0,
      closedAt: 1600200000000,
      createdAt: 1600000000000,
      duration: 200000000,
      isOpen: false,
    })

    // Test the new getTradeAuditLogs function
    const tradeAuditLogs = await getTradeAuditLogs(accountName, trades[0].id)
    expect(tradeAuditLogs).toHaveLength(3)
    expect(tradeAuditLogs).toContain("1")
    expect(tradeAuditLogs).toContain("2")
    expect(tradeAuditLogs).toContain("3")

    // Test the new getTradeTransactions function
    const tradeTransactions = await getTradeTransactions(accountName, trades[0].id)
    expect(tradeTransactions).toHaveLength(3)
    expect(tradeTransactions).toContain("tx1")
    expect(tradeTransactions).toContain("tx2")
    expect(tradeTransactions).toContain("tx3")
  })
})
