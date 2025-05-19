import { deleteAccount, getAccount } from "src/api/accounts-api"
import { expect, it } from "vitest"

it("should have a sqlite database connection", async () => {
  const accountName = Math.random().toString(36).substring(7)
  const account = await getAccount(accountName)

  await account.execute("CREATE TABLE my_key_value (key TEXT PRIMARY KEY, value TEXT)")
  await account.execute("INSERT INTO my_key_value (key, value) VALUES (?, ?)", ["foo", "bar"])

  const result = await account.execute(`SELECT * from my_key_value`)
  expect(result[0]).toMatchInlineSnapshot(`
    [
      "foo",
      "bar",
    ]
  `)

  await account.execute("DROP TABLE my_key_value")
  await expect(
    account.execute(`SELECT * FROM my_key_value`)
  ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Failed to execute query: SELECT * FROM my_key_value, error: Error: SQLITE_ERROR: no such table: my_key_value]`)
})

it("should reset the database", async () => {
  const accountName = Math.random().toString(36).substring(7)
  const account = await getAccount(accountName)

  await account.execute("CREATE TABLE my_key_value (key TEXT PRIMARY KEY, value TEXT)")
  await account.execute("INSERT INTO my_key_value (key, value) VALUES (?, ?)", ["foo", "bar"])

  await deleteAccount(accountName)

  await expect(
    account.execute(`SELECT * FROM my_key_value`)
  ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Failed to execute query: SELECT * FROM my_key_value, error: Error: SQLITE_ERROR: no such table: my_key_value]`)
})
