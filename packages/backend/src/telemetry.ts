import { access, mkdir, readFile, writeFile } from "fs/promises"
import { PostHog } from "posthog-node"
import { environment, randomUUID, runtime } from "src/utils/utils"

import { AUTH_DATA_DIR, SERVER_ID_FILE } from "./settings/settings"

export async function getServerId() {
  try {
    await access(AUTH_DATA_DIR)
  } catch {
    await mkdir(AUTH_DATA_DIR, { recursive: true })
  }

  try {
    await access(SERVER_ID_FILE)
    const serverId = await readFile(SERVER_ID_FILE, "utf8")
    return serverId
  } catch {
    const serverId = randomUUID()
    await writeFile(SERVER_ID_FILE, serverId, "utf8")
    return serverId
  }
}

export class Telemetry extends PostHog {
  constructor(serverId: string) {
    super("phc_6vlr4ItLrmAGdVewHWNFEsL4P5mPuG9Z7ewgwrsOGef", {
      host: "https://eu.i.posthog.com",
    })

    console.log("Telemetry enabled.")
    process.on("uncaughtException", (error) => {
      this.captureException(error, serverId, {
        environment,
        runtime,
      })
    })
  }
}
