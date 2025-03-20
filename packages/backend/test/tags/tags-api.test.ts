import {
  assignTagToAuditLog,
  assignTagToTransaction,
  getTag,
  getTags,
  getTagsForAuditLog,
  getTagsForTransaction,
  upsertTag,
  upsertTags,
} from "src/api/account/tags-api"
import { describe, expect, it } from "vitest"

const accountName = Math.random().toString(36).substring(7)

describe("tags", () => {
  it("should create and retrieve tags", async () => {
    // arrange
    const tagNames = ["defi", "staking", "trading"]

    // act
    const tags = await upsertTags(accountName, tagNames)
    const allTags = await getTags(accountName)

    // assert
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "name": "defi",
        },
        {
          "id": 2,
          "name": "staking",
        },
        {
          "id": 3,
          "name": "trading",
        },
      ]
    `)
    expect(allTags).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "name": "defi",
        },
        {
          "id": 2,
          "name": "staking",
        },
        {
          "id": 3,
          "name": "trading",
        },
      ]
    `)
  })

  it("should handle duplicate tag names", async () => {
    // arrange
    const tagNames = ["spam", "spam", "unknown"]

    // act
    const tags = await upsertTags(accountName, tagNames)

    // assert
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "id": 4,
          "name": "spam",
        },
        {
          "id": 5,
          "name": "unknown",
        },
      ]
    `)
  })

  it("should create and retrieve a single tag", async () => {
    // arrange
    const tagName = "yield"

    // act
    const tag = await upsertTag(accountName, tagName)
    const retrievedTag = await getTag(accountName, tag.id)

    // assert
    expect(tag).toMatchInlineSnapshot(`
      {
        "id": 6,
        "name": "yield",
      }
    `)
    expect(retrievedTag).toMatchInlineSnapshot(`
      {
        "id": 6,
        "name": "yield",
      }
    `)
  })

  it("should assign and retrieve audit log tags", async () => {
    // arrange
    const auditLogId = "test_audit_log_" + Math.random().toString(36).substring(7)
    const tagNames = ["bridge", "crosschain"]

    // act
    await assignTagToAuditLog(accountName, auditLogId, tagNames[0])
    await assignTagToAuditLog(accountName, auditLogId, tagNames[1])
    const tags = await getTagsForAuditLog(accountName, auditLogId)

    // assert
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "id": 7,
          "name": "bridge",
        },
        {
          "id": 8,
          "name": "crosschain",
        },
      ]
    `)
  })

  it("should assign and retrieve transaction tags", async () => {
    // arrange
    const transactionId = "test_transaction_" + Math.random().toString(36).substring(7)
    const tagNames = ["swap", "liquidity"]

    // act
    await assignTagToTransaction(accountName, transactionId, tagNames[0])
    await assignTagToTransaction(accountName, transactionId, tagNames[1])
    const tags = await getTagsForTransaction(accountName, transactionId)

    // assert
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "id": 9,
          "name": "swap",
        },
        {
          "id": 10,
          "name": "liquidity",
        },
      ]
    `)
  })

  it("should handle duplicate tag assignments", async () => {
    // arrange
    const auditLogId = "test_audit_log_" + Math.random().toString(36).substring(7)
    const tagName = "airdrop"

    // act
    await assignTagToAuditLog(accountName, auditLogId, tagName)
    await assignTagToAuditLog(accountName, auditLogId, tagName)
    const tags = await getTagsForAuditLog(accountName, auditLogId)

    // assert
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "id": 11,
          "name": "airdrop",
        },
      ]
    `)
  })
})
