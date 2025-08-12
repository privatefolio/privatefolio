// import { readdir } from "fs/promises"
// import { join } from "path"

// import { getLogFilePath, logger, setupLogger } from "../../electron/src/logger"
// import { SERVER_LOGS_LOCATION } from "./settings/settings"
// import { logAndReportError } from "./utils/error-utils"
// import { safeRemove } from "./utils/file-utils"
// import { ONE_DAY } from "./utils/formatting-utils"

// const msUntilMidnight = () => {
//   const now = new Date()
//   const next = new Date(now)
//   next.setDate(now.getDate() + 1)
//   next.setHours(0, 0, 0, 0)
//   return next.getTime() - now.getTime()
// }

// async function deleteOldLogFiles() {
//   // delete log files older than 60 days
//   const files = await readdir(SERVER_LOGS_LOCATION)
//   const now = Date.now()
//   // files are named like "2025-08-06.log"
//   for (const file of files) {
//     const date = file.split(".")[0]
//     const fileDate = new Date(date).getTime()
//     const daysDifference = (now - fileDate) / ONE_DAY
//     if (daysDifference > 60) {
//       const filePath = join(SERVER_LOGS_LOCATION, file)
//       logger.info("Deleting old log file", { date, filePath })
//       try {
//         await safeRemove(filePath)
//       } catch (error) {
//         logAndReportError(error, "Failed to delete old log file", { filePath })
//       }
//     }
//   }
// }

// deleteOldLogFiles().then()

// // Set up log rotation at midnight and every 24h thereafter
// async function rotateLogFile() {
//   logger.info("Cron: Rotating log file")
//   const newLogFilePath = getLogFilePath()
//   await setupLogger(newLogFilePath)
//   await deleteOldLogFiles()
// }

// setTimeout(() => {
//   rotateLogFile()
//   setInterval(rotateLogFile, ONE_DAY)
// }, msUntilMidnight())

// logger.info("Cron: rotating log file scheduled", {
//   nextRotation: new Date(Date.now() + msUntilMidnight()).toISOString(),
// })
