import { ServerHealthMetric, SqlParam } from "src/interfaces"
import { transformNullsToUndefined } from "src/utils/db-utils"
import { getSystemMetrics } from "src/utils/server-utils"
import { sql } from "src/utils/sql-utils"

import { getServerDatabase } from "./server-api"
import { ensureSystemInfo } from "./server-info-api"
import { getServerValue, setServerValue } from "./server-kv-api"

const SCHEMA_VERSION = 9

export async function getServerDatabaseWithHealthMetrics() {
  const db = await getServerDatabase()

  const schemaVersion = await getServerValue<number>("health_metrics_schema_version", 0)

  if (schemaVersion < 9) {
    await db.execute(sql`DROP TABLE IF EXISTS health_metrics`)

    await db.execute(sql`
      CREATE TABLE health_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        cpuUsage REAL NOT NULL,
        memoryUsed INTEGER NOT NULL,
        memoryTotal INTEGER NOT NULL,
        memoryUsage REAL NOT NULL,
        diskUsed INTEGER,
        diskTotal INTEGER,
        diskUsage REAL,
        processCount INTEGER,
        uptime INTEGER NOT NULL
      )
    `)

    await db.execute(sql`
      CREATE INDEX idx_health_timestamp 
      ON health_metrics(timestamp)
    `)
  }

  if (schemaVersion !== SCHEMA_VERSION) {
    await setServerValue("health_metrics_schema_version", SCHEMA_VERSION)
  }

  return db
}

export async function getCurrentSystemMetrics(): Promise<ServerHealthMetric> {
  return getSystemMetrics()
}

export async function getLatestHealthMetric(): Promise<ServerHealthMetric | null> {
  return getLatestServerHealthMetric()
}

export async function getServerHealth(
  query = "SELECT * FROM health_metrics ORDER BY timestamp DESC LIMIT 100",
  params?: SqlParam[]
) {
  const db = await getServerDatabaseWithHealthMetrics()

  try {
    const result = await db.execute(query, params)
    return result.map((row) => {
      /* eslint-disable sort-keys-fix/sort-keys-fix */
      const value = {
        id: row[0],
        timestamp: row[1],
        cpuUsage: row[2],
        memoryUsed: row[3],
        memoryTotal: row[4],
        memoryUsage: row[5],
        diskUsed: row[6],
        diskTotal: row[7],
        diskUsage: row[8],
        processCount: row[9],
        uptime: row[10],
      }
      /* eslint-enable */
      transformNullsToUndefined(value)
      return value as ServerHealthMetric
    })
  } catch (error) {
    throw new Error(`Failed to query server health metrics: ${error}`)
  }
}

export async function getHealthStats(
  fromTimestamp?: number,
  toTimestamp?: number
): Promise<{
  avgCpuUsage: number
  avgMemoryUsage: number
  count: number
  maxCpuUsage: number
  maxMemoryUsage: number
  minCpuUsage: number
  minMemoryUsage: number
}> {
  return getServerHealthStats(fromTimestamp, toTimestamp)
}

export async function saveServerHealthMetric(metrics: ServerHealthMetric) {
  const db = await getServerDatabase()

  await db.execute(
    sql`
      INSERT INTO health_metrics (
        timestamp,
        cpuUsage,
        memoryUsed,
        memoryTotal,
        memoryUsage,
        diskUsed,
        diskTotal,
        diskUsage,
        processCount,
        uptime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      metrics.timestamp,
      metrics.cpuUsage,
      metrics.memoryUsed,
      metrics.memoryTotal,
      metrics.memoryUsage,
      metrics.diskUsed || null,
      metrics.diskTotal || null,
      metrics.diskUsage || null,
      metrics.processCount,
      metrics.uptime,
    ]
  )
}

export async function getLatestServerHealthMetric(): Promise<ServerHealthMetric | null> {
  const metrics = await getServerHealth(
    "SELECT * FROM health_metrics ORDER BY timestamp DESC LIMIT 1"
  )
  return metrics[0] || null
}

export async function getServerHealthStats(
  fromTimestamp?: number,
  toTimestamp?: number
): Promise<{
  avgCpuUsage: number
  avgMemoryUsage: number
  count: number
  maxCpuUsage: number
  maxMemoryUsage: number
  minCpuUsage: number
  minMemoryUsage: number
}> {
  const db = await getServerDatabaseWithHealthMetrics()

  let whereClause = ""
  const params: SqlParam[] = []

  if (fromTimestamp || toTimestamp) {
    const conditions: string[] = []
    if (fromTimestamp) {
      conditions.push("timestamp >= ?")
      params.push(fromTimestamp)
    }
    if (toTimestamp) {
      conditions.push("timestamp <= ?")
      params.push(toTimestamp)
    }
    whereClause = `WHERE ${conditions.join(" AND ")}`
  }

  const result = await db.execute(
    sql`
      SELECT 
        COUNT(*) as count,
        AVG(cpuUsage) as avgCpuUsage,
        MAX(cpuUsage) as maxCpuUsage,
        MIN(cpuUsage) as minCpuUsage,
        AVG(memoryUsage) as avgMemoryUsage,
        MAX(memoryUsage) as maxMemoryUsage,
        MIN(memoryUsage) as minMemoryUsage
      FROM health_metrics
      ${whereClause}
    `,
    params
  )

  const _stats = result[0]
  return {
    avgCpuUsage: Math.round((Number(_stats[1]) || 0) * 100) / 100,
    avgMemoryUsage: Math.round((Number(_stats[4]) || 0) * 100) / 100,
    count: Number(_stats[0]) || 0,
    maxCpuUsage: Math.round((Number(_stats[2]) || 0) * 100) / 100,
    maxMemoryUsage: Math.round((Number(_stats[5]) || 0) * 100) / 100,
    minCpuUsage: Math.round((Number(_stats[3]) || 0) * 100) / 100,
    minMemoryUsage: Math.round((Number(_stats[6]) || 0) * 100) / 100,
  }
}

export async function cleanupOldServerHealthMetrics(olderThanTimestamp: number): Promise<number> {
  const db = await getServerDatabase()

  const result = await db.execute(sql`DELETE FROM health_metrics WHERE timestamp < ?`, [
    olderThanTimestamp,
  ])

  return result.length
}

export async function monitorServerHealth() {
  await ensureSystemInfo()

  const metrics = await getSystemMetrics()
  await saveServerHealthMetric(metrics)

  // Optional: Clean up old metrics (older than 30 days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  await cleanupOldServerHealthMetrics(thirtyDaysAgo)

  return metrics
}
