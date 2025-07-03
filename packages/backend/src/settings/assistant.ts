import { Tool } from "ai"
import { getMyAssets } from "src/api/account/assets-api"
import { getBalancesAt } from "src/api/account/balances-api"
import { getConnections } from "src/api/account/connections-api"
import { getMyPlatforms } from "src/api/account/platforms-api"
import { z } from "zod"

export const MAX_STEPS = 5

export const getAssistantSystemPrompt = () => {
  const timestamp = Date.now()

  return `You are a portfolio analysis assistant for Privatefolio. 
You have access to the user's complete portfolio data and can help them analyze their investments, transactions, and balances.
The current timestamp is ${timestamp}.

You can use the following tools to access their data:
- web_search_preview: Search the web/internet for information
- getBalancesAt: Get current asset balances at any timestamp (in milliseconds)
- getMyAssets: Get all assets in the portfolio with details
- getConnections: Get configured platform connections
- getPlatforms: Get all platforms used by the account

Use these tools to provide accurate, data-driven answers about their portfolio. 
When analyzing data, be specific and cite actual numbers. You can write SQL queries to filter data as needed.

Be helpful, concise, and focus on actionable insights.
You can use a maximum of ${MAX_STEPS} tools.`
}

export function getAssistantTools(accountName: string) {
  return {
    getBalancesAt: {
      description: "Get current balances for all assets in the portfolio.",
      execute: async ({ timestamp }: { timestamp?: number }) => {
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
    },
    getConnections: {
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
    },
    getMyAssets: {
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
    },
    getPlatforms: {
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
    },
  } satisfies Record<string, Tool>
}
