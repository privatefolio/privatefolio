import { alpha } from "@mui/material"
import { atom } from "nanostores"

import { logAtoms } from "./browser-utils"
import { lossColor as redColor, neutralColor, profitColor as greenColor } from "./chart-utils"
import { memoize, pipe } from "./fp-utils"

const toCharArray = (text: string) => text.split("")
const toAsciiArray = (charArray: string[]) => charArray.map((char) => char.charCodeAt(0))
const sumArray = (noArray: number[]) => noArray.reduce((x, y) => x + y, 0)

export const $colorArray = atom<string[]>([
  "#1976d2",
  "#0097a7",
  "#2e7d32",
  "#1a237e",
  "#827717",
  "#e65100",
  "#ad1457",
  "#9c27b0",
  "#e53935",
  "#f9a825",
])

logAtoms({ $colorArray })

export const stringToNumber = memoize(
  pipe(
    // trace(0),
    toCharArray,
    // trace(1),
    toAsciiArray,
    // trace(2),
    sumArray
    // trace(3),
  )
)

export { greenColor, redColor }

export const getHistogramColor = (value: number) => {
  if (value > 0) {
    return alpha(greenColor, 0.5)
  } else if (value < 0) {
    return alpha(redColor, 0.5)
  }
  return alpha(neutralColor, 0.5)
}
