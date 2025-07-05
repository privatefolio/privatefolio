import * as colors from "@mui/material/colors"

import { memoize, pipe } from "./fp-utils"

export const toCharArray = (text: string) => text.split("")
export const toAsciiArray = (charArray: string[]) => charArray.map((char) => char.charCodeAt(0))
export const sumArray = (noArray: number[]) => noArray.reduce((x, y) => x + y, 0)

export const toAsciiSum = pipe(toCharArray, toAsciiArray, sumArray)

export const yellow = colors.yellow[900]
export const yellowBright = colors.yellow[600]

export const colorArray = [
  colors.amber[800],
  colors.blue[500],
  colors.blueGrey[500],
  colors.brown[500],
  // colors.common[500],
  colors.cyan[500],
  colors.deepOrange[500],
  colors.deepPurple[800],
  colors.green[500],
  // colors.grey[500],
  colors.indigo[500],
  colors.lightBlue[500],
  colors.lightGreen[500],
  // colors.lime[500],
  colors.orange[500],
  colors.pink[500],
  colors.purple[800],
  colors.red[500],
  colors.teal[500],
  yellow,
  // part 2
  colors.amber[900],
  colors.blue[800],
  colors.blueGrey[800],
  colors.brown[800],
  // colors.common[500],
  colors.cyan[800],
  colors.deepOrange[800],
  colors.deepPurple[800],
  colors.green[800],
  // colors.grey[500],
  colors.indigo[800],
  colors.lightBlue[800],
  colors.lightGreen[800],
  // colors.lime[500],
  colors.orange[800],
  colors.pink[800],
  colors.purple[800],
  colors.red[800],
  colors.teal[800],
  yellow,
]

export const stringToColor = memoize(
  pipe(
    // trace(0),
    toCharArray,
    // trace(1),
    toAsciiArray,
    // trace(2),
    sumArray,
    // trace(3),
    (sum: number) => sum % colorArray.length,
    // trace(4),
    (colorIndex: number) => colorArray[colorIndex]
  )
)

export { profitColor as greenColor, lossColor as redColor } from "./chart-utils"
