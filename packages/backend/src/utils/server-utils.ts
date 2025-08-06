import { exec } from "child_process"
import fs from "fs/promises"
import os from "os"
import { ServerHealthMetric, SystemInfo } from "src/interfaces"
import { APP_VERSION } from "src/server-env"
import { promisify } from "util"

const execAsync = promisify(exec)

// CPU usage tracking variables
let lastCpuUsage: NodeJS.CpuUsage | null = null
let lastCpuTime: number | null = null

/**
 * Calculate CPU usage percentage based on previous measurement
 */
export function calculateCpuUsage(): number {
  const currentCpuUsage = process.cpuUsage()
  const currentTime = Date.now()

  if (lastCpuUsage && lastCpuTime) {
    const cpuDelta = process.cpuUsage(lastCpuUsage)
    const timeDelta = currentTime - lastCpuTime

    // Convert microseconds to milliseconds
    const totalCpuTime = (cpuDelta.user + cpuDelta.system) / 1000
    const usage = Math.min(100, (totalCpuTime / timeDelta) * 100)

    lastCpuUsage = currentCpuUsage
    lastCpuTime = currentTime

    return Math.round(usage * 100) / 100 // Round to 2 decimal places
  }

  lastCpuUsage = currentCpuUsage
  lastCpuTime = currentTime
  return 0 // Return 0 for first measurement
}

/**
 * Get the current process count for the system
 */
export async function getProcessCount(): Promise<number | null> {
  try {
    if (os.platform() === "linux") {
      const procDir = await fs.readdir("/proc")
      // Count numeric directories (PIDs)
      return procDir.filter((name) => /^\d+$/.test(name)).length
    } else if (os.platform() === "darwin") {
      // On macOS, we could use ps command, but for simplicity return null
      return null
    } else if (os.platform() === "win32") {
      // On Windows, we could use wmic, but for simplicity return null
      return null
    }
    return null
  } catch (error) {
    console.warn("Could not get process count:", error)
    return null
  }
}

/**
 * Get disk usage information for the current directory
 */
export async function getDiskUsage(): Promise<{
  total: number
  usagePercent: number
  used: number
} | null> {
  try {
    const currentDir = process.cwd()

    if (os.platform() === "linux" || os.platform() === "darwin") {
      // Use df command to get disk usage information
      const { stdout } = await execAsync(`df -k "${currentDir}"`)
      const lines = stdout.trim().split("\n")

      // Skip header line and get the data line
      // df output format: Filesystem 1K-blocks Used Available Use% Mounted on
      const dataLine = lines[lines.length - 1] // Last line contains the data
      const columns = dataLine.split(/\s+/)

      // Extract values (in 1K blocks)
      const totalBlocks = parseInt(columns[1], 10)
      const usedBlocks = parseInt(columns[2], 10)

      if (isNaN(totalBlocks) || isNaN(usedBlocks)) {
        console.warn("Could not parse df output:", dataLine)
        return null
      }

      // Convert from 1K blocks to bytes
      const total = totalBlocks * 1024
      const used = usedBlocks * 1024
      const usagePercent = Math.round((used / total) * 10000) / 100 // Round to 2 decimal places

      return {
        total,
        usagePercent,
        used,
      }
    } else if (os.platform() === "win32") {
      // Use wmic command for Windows
      const drive = currentDir.charAt(0) // Get drive letter (e.g., 'C')
      const { stdout } = await execAsync(
        `wmic logicaldisk where "DeviceID='${drive}:'" get Size,FreeSpace /format:csv`
      )

      const lines = stdout.trim().split("\n")
      // Find the data line (not the header)
      const dataLine = lines.find((line) => line.includes(drive + ":"))

      if (!dataLine) {
        console.warn("Could not find drive information in wmic output")
        return null
      }

      const columns = dataLine.split(",")
      const freeSpace = parseInt(columns[1], 10)
      const totalSpace = parseInt(columns[2], 10)

      if (isNaN(freeSpace) || isNaN(totalSpace)) {
        console.warn("Could not parse wmic output:", dataLine)
        return null
      }

      const used = totalSpace - freeSpace
      const usagePercent = Math.round((used / totalSpace) * 10000) / 100 // Round to 2 decimal places

      return {
        total: totalSpace,
        usagePercent,
        used,
      }
    }

    return null
  } catch (error) {
    console.warn("Could not get disk usage:", error)
    return null
  }
}

export async function getSystemMetrics(): Promise<ServerHealthMetric> {
  const cpuUsage = calculateCpuUsage()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const processCount = await getProcessCount()
  const diskUsage = await getDiskUsage()

  return {
    cpuUsage,
    diskTotal: diskUsage?.total,
    diskUsage: diskUsage?.usagePercent,
    diskUsed: diskUsage?.used,
    memoryTotal: totalMem,
    memoryUsage: Math.round((usedMem / totalMem) * 10000) / 100,
    memoryUsed: usedMem,
    processCount,
    timestamp: Date.now(),
    uptime: os.uptime() * 1000, // Convert seconds to milliseconds
  }
}

export function createSystemInfo(): SystemInfo {
  const cpus = os.cpus()
  const cpuModel = cpus[0]?.model || "Unknown"
  // cpuModel = cpuModel.replace("Processor", "").trim()

  return {
    cpuCores: cpus.length,
    cpuModel,
    memory: os.totalmem(),
    nodeVersion: process.version,
    platform: os.platform(),
    version: APP_VERSION,
  }
}
