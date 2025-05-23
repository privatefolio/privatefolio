import fs from "fs"
import { join } from "path"
import { importFile, subscribeToFileImports } from "src/api/account/file-imports/file-imports-api"
import { getAccount, unsubscribe } from "src/api/accounts-api"
import { EventCause, FileImport, SubscriptionChannel } from "src/interfaces"
import { expect, it, vi } from "vitest"

const accountName = Math.random().toString(36).substring(7)

const mocks = vi.hoisted(() => {
  return {
    readFile: vi.fn(),
  }
})

vi.mock("fs/promises", () => ({
  ...fs.promises,
  readFile: mocks.readFile,
}))

it("should add a file import", async () => {
  // arrange
  const fileName = "coinmama.csv"
  const filePath = join("test/files", fileName)
  const buffer = await fs.promises.readFile(filePath, "utf8")
  mocks.readFile.mockResolvedValue(buffer)
  const events: FileImport[] = []
  const triggers: EventCause[] = []
  const subId = await subscribeToFileImports(accountName, (trigger, fileImport) => {
    triggers.push(trigger)
    events.push(fileImport)
  })
  const fileImport = await importFile(accountName, {
    createdBy: "user",
    id: 0,
    metadata: {
      lastModified: 0,
      size: buffer.length,
      type: "text/csv",
    },
    name: fileName,
    scheduledAt: 0,
    status: "completed",
  })
  // assert
  delete fileImport.timestamp
  expect(fileImport).toMatchInlineSnapshot(`
    {
      "id": "2702913076",
      "lastModified": 0,
      "meta": {
        "assetIds": [
          "coinmama:BTC",
        ],
        "integration": "coinmama",
        "logs": 2,
        "operations": [
          "Buy with Credit Card",
        ],
        "platform": "coinmama",
        "rows": 5,
        "transactions": 2,
        "wallets": [
          "Coinmama Spot",
        ],
      },
      "name": "coinmama.csv",
      "size": 445,
    }
  `)
  expect(triggers).toMatchInlineSnapshot(`
    [
      "created",
    ]
  `)
  expect(events).toMatchInlineSnapshot(`
    [
      {
        "id": "2702913076",
        "lastModified": 0,
        "meta": {
          "assetIds": [
            "coinmama:BTC",
          ],
          "integration": "coinmama",
          "logs": 2,
          "operations": [
            "Buy with Credit Card",
          ],
          "platform": "coinmama",
          "rows": 5,
          "transactions": 2,
          "wallets": [
            "Coinmama Spot",
          ],
        },
        "name": "coinmama.csv",
        "size": 445,
      },
    ]
  `)
  const account = await getAccount(accountName)
  expect(account.eventEmitter.listenerCount(SubscriptionChannel.FileImports)).toMatchInlineSnapshot(
    `1`
  )
  await unsubscribe(subId)
  expect(account.eventEmitter.listenerCount(SubscriptionChannel.FileImports)).toMatchInlineSnapshot(
    `0`
  )
})
