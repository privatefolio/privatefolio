import { proxy } from "comlink"
import { Cron } from "croner"

import { getAccount } from "./api/accounts-api"
import { Api } from "./api/api"
import { SubscriptionId } from "./interfaces"
import { logger } from "./logger"
import { getCronExpression, isProduction } from "./utils/utils"

/**
 * Account-based crons
 */

const networthCronJobs: Record<string, Cron> = {}
const metadataCronJobs: Record<string, Cron> = {}
const networthIntervalSubs: Record<string, SubscriptionId> = {}
const metadataIntervalSubs: Record<string, SubscriptionId> = {}

export async function setupCronJobs(accountName: string, writeApi: Api) {
  if (!isProduction) return

  await setupNetworthCronJob(accountName, writeApi)
  await setupMetadataCronJob(accountName, writeApi)

  // re-create crons if settings change
  networthIntervalSubs[accountName] = await writeApi.subscribeToSettingsProperty(
    accountName,
    "networthRefreshInterval",
    proxy(async () => {
      const account = await getAccount(accountName)
      account.logger.info(`Networth refresh interval changed, re-creating cron job.`)
      await setupNetworthCronJob(accountName, writeApi)
    })
  )
  metadataIntervalSubs[accountName] = await writeApi.subscribeToSettingsProperty(
    accountName,
    "metadataRefreshInterval",
    proxy(async () => {
      const account = await getAccount(accountName)
      account.logger.info(`Metadata refresh interval changed, re-creating cron job.`)
      await setupMetadataCronJob(accountName, writeApi)
    })
  )
}

export async function setupNetworthCronJob(accountName: string, writeApi: Api) {
  const account = await getAccount(accountName)

  if (networthCronJobs[accountName]) {
    account.logger.info(`Stopping existing networth cron job.`)
    networthCronJobs[accountName].stop()
  }

  const { networthRefreshInterval } = await writeApi.getSettings(accountName)

  account.logger.info(
    `Setting up networth cron job with interval: ${networthRefreshInterval} minutes.`
  )
  try {
    const cronExpression = getCronExpression(networthRefreshInterval)
    account.logger.info(`Networth cron expression: ${cronExpression}`)

    const cronJob = new Cron(cronExpression, async () => {
      account.logger.info(`Cron: re-creating account.`)
      await writeApi.enqueueRefreshBalances(accountName, "cron")
      await writeApi.enqueueFetchPrices(accountName, "cron")
      await writeApi.enqueueRefreshNetworth(accountName, "cron")
      await writeApi.enqueueRefreshTrades(accountName, "cron")
    })
    networthCronJobs[accountName] = cronJob
  } catch (error) {
    account.logger.error(`Error setting up networth cron job:`, { error })
  }
}

export async function setupMetadataCronJob(accountName: string, writeApi: Api) {
  const account = await getAccount(accountName)

  if (metadataCronJobs[accountName]) {
    account.logger.info(`Stopping existing metadata cron job.`)
    metadataCronJobs[accountName].stop()
  }

  const { metadataRefreshInterval } = await writeApi.getSettings(accountName)

  account.logger.info(
    `Setting up metadata cron job with interval: ${metadataRefreshInterval} minutes.`
  )
  try {
    const cronExpression = getCronExpression(metadataRefreshInterval)
    account.logger.info(`Metadata cron expression: ${cronExpression}`)

    const cronJob = new Cron(cronExpression, async () => {
      account.logger.info(`Cron: re-creating metadata.`)
      await writeApi.enqueueRefetchAssets(accountName, "cron")
      await writeApi.enqueueRefetchPlatforms(accountName, "cron")
    })
    metadataCronJobs[accountName] = cronJob
  } catch (error) {
    account.logger.error(`Error setting up metadata cron job:`, { error })
  }
}

export async function stopCronJobs(accountName: string, writeApi: Api) {
  if (networthCronJobs[accountName]) {
    networthCronJobs[accountName].stop()
    delete networthCronJobs[accountName]
  }

  if (metadataCronJobs[accountName]) {
    metadataCronJobs[accountName].stop()
    delete metadataCronJobs[accountName]
  }

  if (networthIntervalSubs[accountName]) {
    await writeApi.unsubscribe(networthIntervalSubs[accountName], false)
    delete networthIntervalSubs[accountName]
  }

  if (metadataIntervalSubs[accountName]) {
    await writeApi.unsubscribe(metadataIntervalSubs[accountName], false)
    delete metadataIntervalSubs[accountName]
  }
}

/**
 * Server crons
 */

let serverHealthCronJob: Cron | null = null
let systemInfoCronJob: Cron | null = null

export async function setupServerCronJobs(writeApi: Api) {
  if (!isProduction) return

  await setupServerHealthCronJob(writeApi)
  await setupSystemInfoCronJob(writeApi)

  // re-create crons if settings change
  await writeApi.subscribeToServerSettingsProperty(
    "healthMetricsInterval",
    proxy(async () => {
      logger.info(`Health metrics interval changed, re-creating cron job.`)
      await setupServerHealthCronJob(writeApi)
    })
  )
  await writeApi.subscribeToServerSettingsProperty(
    "systemInfoInterval",
    proxy(async () => {
      logger.info(`System info interval changed, re-creating cron job.`)
      await setupSystemInfoCronJob(writeApi)
    })
  )
}

export async function setupServerHealthCronJob(writeApi: Api) {
  if (serverHealthCronJob) {
    logger.info(`Stopping existing server health cron job.`)
    serverHealthCronJob.stop()
    serverHealthCronJob = null
  }

  const { healthMetricsInterval } = await writeApi.getServerSettings()

  logger.info(`Setting up server health cron job with interval: ${healthMetricsInterval} minutes.`)
  try {
    const cronExpression = getCronExpression(healthMetricsInterval)
    logger.info(`Server health cron expression: ${cronExpression}`)

    serverHealthCronJob = new Cron(cronExpression, async () => {
      logger.info(`Cron: Collecting server health metrics.`)
      await writeApi.monitorServerHealth()
    })
  } catch (error) {
    logger.error(`Error setting up server health cron job:`, { error })
  }
}

export async function setupSystemInfoCronJob(writeApi: Api) {
  if (systemInfoCronJob) {
    logger.info(`Stopping existing system info cron job.`)
    systemInfoCronJob.stop()
    systemInfoCronJob = null
  }

  const { systemInfoInterval } = await writeApi.getServerSettings()

  logger.info(`Setting up system info cron job with interval: ${systemInfoInterval} minutes.`)
  try {
    const cronExpression = getCronExpression(systemInfoInterval)
    logger.info(`System info cron expression: ${cronExpression}`)

    systemInfoCronJob = new Cron(cronExpression, async () => {
      logger.info(`Cron: re-creating system info.`)
      await writeApi.refreshSystemInfo()
    })
  } catch (error) {
    logger.error(`Error setting up system info cron job:`, { error })
  }
}
