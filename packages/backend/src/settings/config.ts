/**
 * This is used to avoid conflicts with other platforms.
 * E.g. "sonic" is both a chain and an exchange on Coingecko.
 */
export enum PlatformPrefix {
  Chain = "chain.",
  Exchange = "ex.",
  App = "app.",
  Gov = "gov.",
}
