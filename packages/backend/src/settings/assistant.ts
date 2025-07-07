import { Tool, tool } from "ai"
import { getMyAssets } from "src/api/account/assets-api"
import { getBalancesAt } from "src/api/account/balances-api"
import { getMyPlatforms } from "src/api/account/platforms-api"
import { getTrades } from "src/api/account/trades-api"
import { z } from "zod"

export const MAX_STEPS = 5

export const getAssistantSystemPrompt = (tools: Record<string, Tool>) => {
  if (Object.keys(tools).length === 0) return ""
  const timestamp = Date.now()

  return `You are a portfolio analysis assistant for Privatefolio. 
You have access to the user's complete portfolio data and can help them analyze their investments, transactions, and balances.
The current timestamp is ${timestamp} and corresponds to ${new Date(timestamp).toISOString()}.

You can use the following tools to access their data:
${Object.entries(tools)
  .map(([key, tool]) => `${key}: ${tool.description}`)
  .join("\n")}

Use these tools to provide accurate, data-driven answers about their portfolio. 
When analyzing data, be specific and cite actual numbers. You can write SQL queries to filter data as needed.
When you reference a tool, use this xml format: <tool>toolName</tool>.

Be helpful, concise, and focus on actionable insights.
You can use a maximum of ${MAX_STEPS} tools.`
}
// For market analysis, price predictions, or current news about assets, use webSearch to get the latest information.
// Please respond in GitHub Flavored Markdown format.

export function getAssistantTools(accountName: string): Record<string, Tool> {
  return Object.freeze({
    getBalancesAt: tool({
      description: `Get the total asset balances at any timestamp (in milliseconds) across all wallets. It returns Array<Balance>.
export interface Balance {
  assetId: string
  balanceN: number
  id: string 
  price?: {
    value: number
    time: number // unix timestamp in seconds
  }
  value?: number
}`,
      execute: async ({ timestamp }) => await getBalancesAt(accountName, timestamp),
      parameters: z.object({
        timestamp: z
          .number()
          .describe(
            "Unix timestamp (in milliseconds) to get balances at; omit for the latest balance"
          ),
      }),
    }),
    getMyAssets: tool({
      description: "Get all assets in the portfolio with their details.",
      execute: async () => {
        try {
          const assets = await getMyAssets(accountName)
          return { assets }
        } catch (error) {
          return { error: `Failed to get assets: ${error}` }
        }
      },
      parameters: z.object({}),
    }),
    getPlatforms: tool({
      description: "Get all platforms used by this account.",
      execute: async () => {
        try {
          const platforms = await getMyPlatforms(accountName)
          return { platforms }
        } catch (error) {
          return { error: `Failed to get platforms: ${error}` }
        }
      },
      parameters: z.object({}),
    }),
    getTrades: tool({
      description: `Get all trades in the portfolio. It returns Array<Trade>.
export interface Trade {
  amount: number
  assetId: string
  auditLogIds?: string[]
  balance: number
  closedAt?: Timestamp
  cost: TradeCost[]
  createdAt: Timestamp
  deposits: TradeValue[]
  duration?: number
  fees: TradeValue[]
  id: string
  proceeds: TradeValue[]
  tags?: number[]
  tradeNumber: number
  tradeStatus: "open" | "closed"
  tradeType: TradeType
  txIds?: string[]
}
}`,
      execute: async () => await getTrades(accountName),
      parameters: z.object({}),
    }),
  })
}
