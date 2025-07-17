import { mkdir } from "fs/promises"
import path from "path"
import { getAsset } from "src/api/account/assets-api"
import { isServer } from "src/utils/environment-utils"
import { getFullMetadata } from "../metadata/coingecko/coingecko-asset-api"
import { getInvestmentDb } from "./db"
import { Plan, PlanCoin } from "./types"

export * from "./types"

const DB_VERSION = 3

// Helper to map array results from DB to object
function mapPlan(row: any[]): Plan {
  return {
    id: row[0],
    name: row[1],
    budget: row[2],
    createdAt: row[3],
    updatedAt: row[4],
    lastCalculatedAt: row[5],
    calculationStatus: row[6],
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
    let currentVersion = versionRow ? parseInt(versionRow[0] as string, 10) : 0

    if (currentVersion < DB_VERSION) {
      console.log(
        `Upgrading investment planner database for ${accountName} from version ${currentVersion} to ${DB_VERSION}...`
      )

      if (currentVersion < 1) {
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
      }

      if (currentVersion < 2) {
        await db.execute(`ALTER TABLE plans ADD COLUMN lastCalculatedAt DATETIME;`)
        await db.execute(`
          CREATE TABLE IF NOT EXISTS plan_calculation_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            planId INTEGER NOT NULL,
            coinId TEXT NOT NULL,
            name TEXT,
            price REAL,
            amountToInvest REAL,
            coinsToBuy REAL,
            error TEXT,
            calculatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (planId) REFERENCES plans(id) ON DELETE CASCADE
          );
        `)
      }

      if (currentVersion < 3) {
        await db.execute(
          `ALTER TABLE plans ADD COLUMN calculationStatus TEXT NOT NULL DEFAULT 'idle';`
        )
      }

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
    lastCalculatedAt: undefined,
    calculationStatus: "idle",
  }
  return createPlan(accountName, newPlanData)
}

async function processPlanCalculation(accountName: string, id: number): Promise<void> {
  const plan = await getPlan(accountName, id)
  if (!plan) {
    console.error("Plan not found for processing:", id)
    return
  }

  try {
    let totalFixedAmount = 0
    plan.coins.forEach((c) => {
      if (c.amount) {
        totalFixedAmount += c.amount
      }
    })

    if (totalFixedAmount > plan.budget) {
      throw new Error(`Total fixed amount (${totalFixedAmount}) exceeds budget (${plan.budget}).`)
    }

    const remainingBudget = plan.budget - totalFixedAmount
    let totalPercentage = 0
    plan.coins.forEach((c) => {
      if (c.percentage) {
        totalPercentage += c.percentage
      }
    })

    if (totalPercentage > 100) {
      throw new Error(`Total percentage (${totalPercentage}%) exceeds 100%.`)
    }

    for (const coin of plan.coins) {
      let result: any = { coinId: coin.coinId }
      try {
        const asset = await getAsset(accountName, coin.coinId)
        if (!asset || !asset.coingeckoId) {
          throw new Error("Asset not found or does not have a Coingecko ID")
        }

        const metadata = await getFullMetadata(asset.coingeckoId)
        const price = metadata.market_data?.current_price?.usd

        if (!price) {
          throw new Error("Could not fetch current price")
        }

        let amountToInvest = 0
        if (coin.amount) {
          amountToInvest = coin.amount
        } else if (coin.percentage) {
          amountToInvest = (remainingBudget * coin.percentage) / 100
        }

        const coinsToBuy = price > 0 ? amountToInvest / price : 0

        result = {
          ...result,
          name: asset.name,
          price: price,
          amountToInvest: amountToInvest,
          coinsToBuy: coinsToBuy,
        }
      } catch (error) {
        result.error = error instanceof Error ? error.message : "An unknown error occurred"
        // We still save the partial result with the error message
      }

      await withDb(accountName, (db) =>
        db.execute(
          `INSERT INTO plan_calculation_results (planId, coinId, name, price, amountToInvest, coinsToBuy, error)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            result.coinId,
            result.name,
            result.price,
            result.amountToInvest,
            result.coinsToBuy,
            result.error,
          ]
        )
      )
    }

    // If we reach here, all coins were processed (some might have errors, but the process itself completed)
    await withDb(accountName, (db) =>
      db.execute("UPDATE plans SET calculationStatus = 'completed' WHERE id = ?", [id])
    )
  } catch (error) {
    console.error(`Calculation failed for plan ${id}:`, error)
    await withDb(accountName, (db) =>
      db.execute("UPDATE plans SET calculationStatus = 'failed' WHERE id = ?", [id])
    )
  }
}

export async function startPlanCalculation(accountName: string, id: number): Promise<void> {
  // Clear previous results for this plan
  await withDb(accountName, (db) =>
    db.execute("DELETE FROM plan_calculation_results WHERE planId = ?", [id])
  )

  // Set the calculation start time and status
  await withDb(accountName, (db) =>
    db.execute(
      "UPDATE plans SET lastCalculatedAt = ?, calculationStatus = 'in_progress' WHERE id = ?",
      [new Date().toISOString(), id]
    )
  )

  // Fire-and-forget the actual processing
  processPlanCalculation(accountName, id)
}

export async function getPlanCalculationResult(accountName: string, planId: number): Promise<any> {
  const plan = await getPlan(accountName, planId)
  if (!plan) {
    return { error: "Plan not found" }
  }

  const calculations = await withDb(accountName, (db) =>
    db.execute("SELECT * FROM plan_calculation_results WHERE planId = ?", [planId])
  )

  let totalFixedAmount = 0
  plan.coins.forEach((c) => {
    if (c.amount) {
      totalFixedAmount += c.amount
    }
  })

  const remainingBudget = plan.budget - totalFixedAmount
  let totalPercentage = 0
  plan.coins.forEach((c) => {
    if (c.percentage) {
      totalPercentage += c.percentage
    }
  })

  return {
    calculations: (calculations as any[]).map((row: any[]) => ({
      id: row[0],
      planId: row[1],
      coinId: row[2],
      name: row[3],
      price: row[4],
      amountToInvest: row[5],
      coinsToBuy: row[6],
      error: row[7],
      calculatedAt: row[8],
    })),
    totalFixedAmount,
    remainingBudget,
    totalPercentage,
  }
} 