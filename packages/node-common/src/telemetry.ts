import { Logger } from "@logtape/logtape"
import { PostHog } from "posthog-node"

export class Telemetry extends PostHog {
  constructor(logger: Logger) {
    super("phc_6vlr4ItLrmAGdVewHWNFEsL4P5mPuG9Z7ewgwrsOGef", {
      host: "https://eu.i.posthog.com",
    })

    logger.info("Telemetry enabled")
  }
}

// export const telemetry = new Telemetry()
