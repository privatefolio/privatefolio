import { PostHog } from "posthog-node"

export class Telemetry extends PostHog {
  constructor() {
    super("phc_6vlr4ItLrmAGdVewHWNFEsL4P5mPuG9Z7ewgwrsOGef", {
      host: "https://eu.i.posthog.com",
    })
  }
}
