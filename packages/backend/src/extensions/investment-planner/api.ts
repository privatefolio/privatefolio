import { mkdir } from "fs/promises"
import path from "path"
import { getAsset } from "src/api/account/assets-api"
import { isServer } from "src/utils/environment-utils"
import { getFullMetadata } from "../metadata/coingecko/coingecko-asset-api"
import { getInvestmentDb } from "./db"
import { Plan, PlanCoin } from "./types"

export * from "./types"

const DB_VERSION = 1

// Helper to map array results from DB to object
function mapPlan(row: any[]): Plan {
  return {
    id: row[0],
    name: row[1],
    budget: row[2],
    createdAt: row[3],
    updatedAt: row[4],
    coins: [], // This will be populated in getPlan
  }
}

async function withDb<T>(accountName: string, fn: (db: any) => Promise<T>): Promise<T> {
  if (!accountName) throw new Error("Account name is required.")
  const db = await getInvestmentDb(accountName)
  try {
    return await fn(db)
  } finally {
    await db.close()
  }
}

export async function initialize(accountName: string) {
  const DEFAULT_DATA_LOCATION = "./data"
  const DATA_LOCATION =
    isServer && process.env.DATA_LOCATION ? process.env.DATA_LOCATION : DEFAULT_DATA_LOCATION
  const EXTENSION_DB_LOCATION = path.join(DATA_LOCATION, "extensions", "investment-planner")

  await mkdir(EXTENSION_DB_LOCATION, { recursive: true })

  return withDb(accountName, async (db) => {
    await db.execute(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`)
    const versionRow = (await db.execute(`SELECT value FROM meta WHERE key = 'version'`))[0]
    const currentVersion = versionRow ? parseInt(versionRow[0] as string, 10) : 0

    if (currentVersion < DB_VERSION) {
      console.log(
        `Upgrading investment planner database for ${accountName} from version ${currentVersion} to ${DB_VERSION}...`
      )

      await db.execute(`
          CREATE TABLE IF NOT EXISTS plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            budget REAL NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `)
      await db.execute(`
          CREATE TABLE IF NOT EXISTS plan_coins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            planId INTEGER NOT NULL,
            coinId TEXT NOT NULL,
            percentage REAL,
            amount REAL,
            FOREIGN KEY (planId) REFERENCES plans(id) ON DELETE CASCADE
          );
        `)
      await db.execute(`
          CREATE TRIGGER IF NOT EXISTS update_plans_updatedAt
          AFTER UPDATE ON plans
          FOR EACH ROW
          BEGIN
            UPDATE plans SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
          END;
        `)
      await db.execute("INSERT OR REPLACE INTO meta (key, value) VALUES ('version', ?)", [
        DB_VERSION.toString(),
      ])
      console.log(
        `Investment planner database for ${accountName} initialized/upgraded successfully.`
      )
    }
  })
}

export async function getPlans(accountName: string): Promise<Plan[]> {
  const rows = (await withDb(accountName, (db) =>
    db.execute("SELECT * FROM plans ORDER BY updatedAt DESC")
  )) as any[]
  return rows.map(mapPlan)
}

export async function getPlan(accountName: string, id: number): Promise<Plan | undefined> {
  return withDb(accountName, async (db) => {
    const planResult = await db.execute("SELECT * FROM plans WHERE id = ?", [id])
    if (!planResult || planResult.length === 0) return undefined
    const plan = mapPlan(planResult[0] as any[])
    const coinsResult = await db.execute("SELECT * FROM plan_coins WHERE planId = ?", [id])
    plan.coins = (coinsResult as any[]).map(
      (row: any[]) =>
        ({
          id: row[0],
          planId: row[1],
          coinId: row[2],
          percentage: row[3],
          amount: row[4],
        } as PlanCoin)
    )
    return plan
  })
}

export async function createPlan(
  accountName: string,
  plan: Omit<Plan, "id" | "createdAt" | "updatedAt">
): Promise<Plan> {
  const planId = await withDb(accountName, async (db) => {
    const { name, budget, coins } = plan
    await db.execute("INSERT INTO plans (name, budget) VALUES (?, ?)", [name, budget])
    const result = await db.execute("SELECT last_insert_rowid()")
    const newPlanId = result[0][0] as number
    for (const coin of coins) {
      await db.execute(
        "INSERT INTO plan_coins (planId, coinId, percentage, amount) VALUES (?, ?, ?, ?)",
        [newPlanId, coin.coinId, coin.percentage, coin.amount]
      )
    }
    return newPlanId
  })
  return (await getPlan(accountName, planId))!
}

export async function updatePlan(
  accountName: string,
  id: number,
  plan: Omit<Plan, "id" | "createdAt" | "updatedAt">
): Promise<Plan> {
  await withDb(accountName, async (db) => {
    const { name, budget, coins } = plan
    await db.execute("UPDATE plans SET name = ?, budget = ? WHERE id = ?", [name, budget, id])
    await db.execute("DELETE FROM plan_coins WHERE planId = ?", [id])
    for (const coin of coins) {
      await db.execute(
        "INSERT INTO plan_coins (planId, coinId, percentage, amount) VALUES (?, ?, ?, ?)",
        [id, coin.coinId, coin.percentage, coin.amount]
      )
    }
  })
  return (await getPlan(accountName, id))!
}

export function deletePlan(accountName: string, id: number): Promise<void> {
  return withDb(accountName, (db) => db.execute("DELETE FROM plans WHERE id = ?", [id]))
}

export async function duplicatePlan(accountName: string, id: number): Promise<Plan> {
  const originalPlan = await getPlan(accountName, id)
  if (!originalPlan) {
    throw new Error("Plan not found")
  }
  const newPlanData: Omit<Plan, "id" | "createdAt" | "updatedAt"> = {
    name: `${originalPlan.name} (Copy)`,
    budget: originalPlan.budget,
    coins: originalPlan.coins.map((c) => ({
      coinId: c.coinId,
      percentage: c.percentage,
      amount: c.amount,
      planId: undefined,
      id: undefined,
    })),
  }
  return createPlan(accountName, newPlanData)
}

export async function calculatePlan(accountName: string, id: number): Promise<any> {
  const plan = await getPlan(accountName, id)
  if (!plan) {
    throw new Error("Plan not found")
  }

  const calculations = []
  let totalFixedAmount = 0;
  plan.coins.forEach(c => {
      if (c.amount) {
        totalFixedAmount += c.amount;
      }
  })

  if (totalFixedAmount > plan.budget) {
      return { error: `Total fixed amount (${totalFixedAmount}) exceeds budget (${plan.budget}).` };
  }

  const remainingBudget = plan.budget - totalFixedAmount;
  let totalPercentage = 0;
  plan.coins.forEach(c => {
      if(c.percentage) {
          totalPercentage += c.percentage;
      }
  })

  if (totalPercentage > 100) {
      return { error: `Total percentage (${totalPercentage}%) exceeds 100%.` };
  }


  for (const coin of plan.coins) {
    const asset = await getAsset(accountName, coin.coinId)
    if (!asset || !asset.coingeckoId) {
      calculations.push({
        coinId: coin.coinId,
        error: "Asset not found or does not have a Coingecko ID",
      })
      continue
    }

    try {
      const metadata = await getFullMetadata(asset.coingeckoId)
      const price = metadata.market_data?.current_price?.usd

      if (!price) {
        calculations.push({
          coinId: coin.coinId,
          error: "Could not fetch current price",
        })
        continue
      }

      let amountToInvest = 0
      if (coin.amount) {
          amountToInvest = coin.amount;
      } else if (coin.percentage) {
        amountToInvest = (remainingBudget * coin.percentage) / 100
      }

      const coinsToBuy = price > 0 ? amountToInvest / price : 0;

      calculations.push({
        coinId: coin.coinId,
        name: asset.name,
        price: price,
        amountToInvest: amountToInvest,
        coinsToBuy: coinsToBuy,
      })
    } catch (error) {
      calculations.push({
        coinId: coin.coinId,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    }
  }

  return {
      calculations,
      totalFixedAmount,
      remainingBudget,
      totalPercentage
  };
} 