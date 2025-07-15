import { ResolutionString } from "src/interfaces"
import { asUTC } from "src/utils/formatting-utils"
import { floorTimestamp, roundTimestamp } from "src/utils/utils"
import { expect, it } from "vitest"

it("floorTimestamp should work", () => {
  expect(floorTimestamp(1741772853994, "1S" as ResolutionString)).toMatchInlineSnapshot(
    `1741772853000`
  )
  expect(roundTimestamp(1741772853994, "1S" as ResolutionString)).toMatchInlineSnapshot(
    `1741772854000`
  )

  expect(asUTC(new Date("2025-03-12 09:47:34"))).toMatchInlineSnapshot(`1741772854000`)
})
