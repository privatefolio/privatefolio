import { extractColumnsFromRow } from "src/api/account/file-imports/csv-utils"
import { createCsvString } from "src/utils/utils"
import { expect, it } from "vitest"

it("extractColumnsFromRow should work", async () => {
  expect(extractColumnsFromRow("hey,boo", 2)).toMatchInlineSnapshot(`
      [
        "hey",
        "boo",
      ]
    `)
})

it("extractColumnsFromRow should work", async () => {
  expect(extractColumnsFromRow('Alice,30,"123 Main St, Springfield"', 3)).toMatchInlineSnapshot(`
    [
      "Alice",
      "30",
      "123 Main St, Springfield",
    ]
  `)
})

it("extractColumnsFromRow should work", async () => {
  expect(extractColumnsFromRow('hey,{"foo":"bar"}', 2)).toMatchInlineSnapshot(`
    [
      "hey",
      "}",
    ]
  `)
})

it("extractColumnsFromRow should work", async () => {
  expect(extractColumnsFromRow('hey,"{"foo":"bar"}"', 2)).toMatchInlineSnapshot(`
    [
      "hey",
      "{"foo":"bar"}",
    ]
  `)
})

it("extractColumnsFromRow should work", async () => {
  expect(extractColumnsFromRow('hey,1,true,0.1,"2"', 5)).toMatchInlineSnapshot(`
      [
        "hey",
        "1",
        "true",
        "0.1",
        "2",
      ]
    `)
})

it("createCsvString should work", async () => {
  expect(
    createCsvString([
      [
        "i'm a string",
        4200,
        true,
        "true",
        0.1,
        undefined,
        "undefined",
        { foo: "bar" },
        '{"foo": "bar"}',
        //
      ],
    ])
  ).toMatchInlineSnapshot(
    `""i'm a string","4200","true","true","0.1","","undefined","{""foo"":""bar""}","{""foo"": ""bar""}""`
  )
})

it("createCsvString should work", async () => {
  const row = [{ foo: "bar" }, true, "hey", 42]

  const asCsv = createCsvString([row])
  const parsedRow = extractColumnsFromRow(asCsv, row.length)

  expect(parsedRow).toMatchInlineSnapshot(`
    [
      "{"foo":"bar"}",
      "true",
      "hey",
      "42",
    ]
  `)
})

it("extractColumnsFromRow should work", async () => {
  const stringified = createCsvString([
    [
      {
        assetIds: ["ethereum:0x0000000000000000000000000000000000000000:ETH"],
        integration: "etherscan",
        logs: 16,
        operations: ["Deposit", "Withdraw", "Fee"],
        platform: "ethereum",
        rows: 9,
        transactions: 9,
        wallets: ["0xf98c96b5d10faafc2324847c82305bd5fd7e5ad3"],
      },
    ],
  ])

  const result = extractColumnsFromRow(stringified)

  expect(result).toMatchInlineSnapshot(`
    [
      "{"assetIds":["ethereum:0x0000000000000000000000000000000000000000:ETH"],"integration":"etherscan","logs":16,"operations":["Deposit","Withdraw","Fee"],"platform":"ethereum","rows":9,"transactions":9,"wallets":["0xf98c96b5d10faafc2324847c82305bd5fd7e5ad3"]}",
    ]
  `)

  expect(JSON.parse(result[0])).toMatchInlineSnapshot(`
    {
      "assetIds": [
        "ethereum:0x0000000000000000000000000000000000000000:ETH",
      ],
      "integration": "etherscan",
      "logs": 16,
      "operations": [
        "Deposit",
        "Withdraw",
        "Fee",
      ],
      "platform": "ethereum",
      "rows": 9,
      "transactions": 9,
      "wallets": [
        "0xf98c96b5d10faafc2324847c82305bd5fd7e5ad3",
      ],
    }
  `)
})
