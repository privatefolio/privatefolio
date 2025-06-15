import { getDecimalPrecision, getMinimumDecimalPrecision } from "src/utils/formatting-utils"
import { expect, it } from "vitest"

it("getDecimalPrecision should work", () => {
  expect(getDecimalPrecision(-0.00000690108)).toBe(11)
  expect(getDecimalPrecision(3.14)).toBe(2)
  expect(getDecimalPrecision(42)).toBe(0)
  expect(getDecimalPrecision(0.001)).toBe(3)
  expect(getDecimalPrecision(1.23456789)).toBe(8)
  expect(getDecimalPrecision(0)).toBe(0)
  expect(getDecimalPrecision(Infinity)).toBe(0)
  expect(getDecimalPrecision(NaN)).toBe(0)
})

it("getMinimumDecimalPrecision should work", () => {
  expect(getMinimumDecimalPrecision(-0.00000690108)).toBe(6)
  expect(getMinimumDecimalPrecision(0.005)).toBe(3)
  expect(getMinimumDecimalPrecision(0.1)).toBe(1)
  expect(getMinimumDecimalPrecision(1.23)).toBe(1)
  expect(getMinimumDecimalPrecision(42)).toBe(0)
  expect(getMinimumDecimalPrecision(0.001)).toBe(3)
  expect(getMinimumDecimalPrecision(0.0001)).toBe(4)
  expect(getMinimumDecimalPrecision(Infinity)).toBe(0)
  expect(getMinimumDecimalPrecision(NaN)).toBe(0)
})
