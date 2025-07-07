import { atom } from "nanostores"

import { ResolutionString } from "../interfaces"

export const supportedIntervals: ResolutionString[] = [
  "1d" as ResolutionString,
  "3d" as ResolutionString,
  "1w" as ResolutionString,
  "1m" as ResolutionString,
]

export const $favoriteIntervals = atom<ResolutionString[]>([
  // "1s" as ResolutionString,
  // "1m" as ResolutionString,
  "1h" as ResolutionString,
  "1d" as ResolutionString,
  "3d" as ResolutionString,
  "1w" as ResolutionString,
  "1m" as ResolutionString,
])

export const INTERVAL_LABEL_MAP: Record<ResolutionString, string> = {
  ["1d" as ResolutionString]: "1 day",
  ["3d" as ResolutionString]: "3 days",
  ["1h" as ResolutionString]: "1 hour",
  ["1w" as ResolutionString]: "1 week",
  ["1m" as ResolutionString]: "1 month",
}

export const TIME_FRAMES = [
  {
    description: "1 day in 1 minute intervals",
    resolution: "1" as ResolutionString,
    text: "1D",
  },
  {
    description: "1 week in 1 hour intervals",
    resolution: "60" as ResolutionString,
    text: "1W",
  },
  // {
  //   description: "1 month in 1 day intervals",
  //   resolution: "1D" as ResolutionString,
  //   text: "1M",
  // },
  {
    description: "3 months in 1 day intervals",
    resolution: "1D" as ResolutionString,
    text: "3M",
  },
  {
    description: "6 months in 1 day intervals",
    resolution: "1D" as ResolutionString,
    text: "6M",
  },
  // {
  //   description: "Year to day in 1 day intervals",
  //   resolution: "1D" as ResolutionString,
  //   text: "YTD",
  // },
  {
    description: "1 year in 1 day intervals",
    resolution: "1D" as ResolutionString,
    text: "1Y",
  },
  {
    description: "5 years in 1 week intervals",
    resolution: "1W" as ResolutionString,
    text: "5Y",
  },
  {
    description: "10 years in 1 week intervals",
    resolution: "1W" as ResolutionString,
    text: "10Y",
  },
]
