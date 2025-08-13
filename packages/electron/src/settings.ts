import { app } from "electron"
import { join } from "path"

import { isProduction } from "./environment-utils"

const userDataPath = isProduction ? app.getPath("userData") : join("..", "backend")

const DEFAULT_DATA_LOCATION = "./data"
export const DATA_LOCATION = join(userDataPath, DEFAULT_DATA_LOCATION)

export const SERVER_LOGS_LOCATION = `${DATA_LOCATION}/server-logs`

export const SERVER_PORT = isProduction ? 5555 : Number(process.env.SERVER_PORT) || 4001
export const APP_ID_FILENAME = ".app-id"
