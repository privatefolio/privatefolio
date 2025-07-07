import { Tool, tool } from "ai"
import { getMyAssets } from "src/api/account/assets-api"
import { getBalancesAt } from "src/api/account/balances-api"
import { getConnections } from "src/api/account/connections-api"
import { getMyPlatforms } from "src/api/account/platforms-api"
import { z } from "zod"

export const MAX_STEPS = 5

export const getAssistantSystemPrompt = (tools: Record<string, Tool>) => {
  if (Object.keys(tools).length === 0) return ""
  const timestamp = Date.now()

  return `You are a portfolio analysis assistant for Privatefolio. 
You have access to the user's complete portfolio data and can help them analyze their investments, transactions, and balances.
The current timestamp is ${timestamp}.

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
      execute: async ({ timestamp }) => {
        try {
          const balances = await getBalancesAt(accountName, timestamp)
          return { balances }
        } catch (error) {
          return { error: `Failed to get balances: ${error}` }
        }
      },
      id: "privatefolio.getBalancesAt",
      parameters: z.object({
        timestamp: z
          .number()
          .describe(
            "Unix timestamp (in milliseconds) to get balances at; omit for the latest balance"
          ),
      }),
    }),
    getConnections: tool({
      description: "Get all platform connections configured in the portfolio.",
      execute: async () => {
        try {
          const connections = await getConnections(accountName)
          return { connections }
        } catch (error) {
          return { error: `Failed to get connections: ${error}` }
        }
      },
      id: "privatefolio.getConnections",
      parameters: z.object({}),
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
      id: "privatefolio.getMyAssets",
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
      id: "privatefolio.getPlatforms",
      parameters: z.object({}),
    }),
  })
}
