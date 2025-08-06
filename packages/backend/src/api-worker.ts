import "./error-catcher"

import { expose } from "comlink"

import { api } from "./api/api"
import { logger } from "./logger"

expose(api)
logger.info("Worker ready")
