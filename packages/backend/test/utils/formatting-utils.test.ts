import {
  getAutoFormatDigits,
  getDecimalPrecision,
  getMinimumDecimalPrecision,
} from "src/utils/formatting-utils"
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

it("getAutoFormatDigits should work", () => {
  expect(getAutoFormatDigits(5000)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 2,
      "minimumFractionDigits": 2,
    }
  `)
  expect(getAutoFormatDigits(-5000)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 2,
      "minimumFractionDigits": 2,
    }
  `)
  expect(getAutoFormatDigits(0.005)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 3,
      "minimumFractionDigits": 3,
    }
  `)
  expect(getAutoFormatDigits(0.00000690108)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 9,
      "minimumFractionDigits": 9,
    }
  `)
  expect(getAutoFormatDigits(50000, 4)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 4,
      "minimumFractionDigits": 4,
    }
  `)
  expect(getAutoFormatDigits(0.005, 2)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 3,
      "minimumFractionDigits": 2,
    }
  `)
  expect(getAutoFormatDigits(0)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 0,
      "minimumFractionDigits": 0,
    }
  `)
  expect(getAutoFormatDigits(123.45)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": undefined,
      "minimumFractionDigits": undefined,
    }
  `)
  expect(getAutoFormatDigits(123.45, 5)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 5,
      "minimumFractionDigits": 5,
    }
  `)
  expect(getAutoFormatDigits(1)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": undefined,
      "minimumFractionDigits": undefined,
    }
  `)
  expect(getAutoFormatDigits(1000)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": undefined,
      "minimumFractionDigits": undefined,
    }
  `)
  expect(getAutoFormatDigits(10000)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 2,
      "minimumFractionDigits": 2,
    }
  `)
  expect(getAutoFormatDigits(10001)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 0,
      "minimumFractionDigits": 0,
    }
  `)
  //
  expect(getAutoFormatDigits(-0.0045198197500000425)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 6,
      "minimumFractionDigits": 6,
    }
  `)
  expect(getAutoFormatDigits(-0.0045198197500000425, 2)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 6,
      "minimumFractionDigits": 2,
    }
  `)
  expect(getAutoFormatDigits(-0.005715244299999256)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 6,
      "minimumFractionDigits": 6,
    }
  `)
  expect(getAutoFormatDigits(-0.005715244299999256, 2)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 6,
      "minimumFractionDigits": 2,
    }
  `)
  expect(getAutoFormatDigits(-12.798353622471069)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": undefined,
      "minimumFractionDigits": undefined,
    }
  `)
  expect(getAutoFormatDigits(-12.798353622471069, 2)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 2,
      "minimumFractionDigits": 2,
    }
  `)
  expect(getAutoFormatDigits(-751.7936902746409)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": undefined,
      "minimumFractionDigits": undefined,
    }
  `)
  expect(getAutoFormatDigits(-751.7936902746409, 2)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 2,
      "minimumFractionDigits": 2,
    }
  `)
  expect(getAutoFormatDigits(0.000005)).toMatchInlineSnapshot(`
    {
      "maximumFractionDigits": 6,
      "minimumFractionDigits": 6,
    }
  `)
  // expect(getAutoFormatDigits(0)).toMatchInlineSnapshot()
})
