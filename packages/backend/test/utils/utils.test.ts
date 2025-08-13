import { randomUUID } from "@privatefolio/commons/utils"
import { expect, it } from "vitest"

it("randomUUID should work", () => {
  expect(randomUUID().length).toMatchInlineSnapshot(`36`)
  expect(randomUUID().split("-").length).toMatchInlineSnapshot(`5`)
})
