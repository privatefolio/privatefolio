import { upsertServerTasks } from "src/api/account/server-tasks-api"
import { TaskStatus } from "src/interfaces"
import { describe, expect, it } from "vitest"

const accountName = Math.random().toString(36).substring(7)

describe("server tasks", () => {
  it("should upsert a new server task", async () => {
    //
    const results = await upsertServerTasks(accountName, [
      {
        createdAt: 1,
        description: "fetch foo from bar",
        name: "fetch foo",
        priority: 2,
        status: TaskStatus.Queued,
        trigger: "cron",
      },
      {
        createdAt: 1,
        description: "fetch foo from bar",
        name: "fetch foo",
        priority: 9,
        status: TaskStatus.Queued,
        trigger: "user",
      },
    ])

    expect(results).toMatchInlineSnapshot(`
      [
        {
          "createdAt": 1,
          "description": "fetch foo from bar",
          "id": 1,
          "name": "fetch foo",
          "priority": 2,
          "status": "queued",
          "trigger": "cron",
        },
        {
          "createdAt": 1,
          "description": "fetch foo from bar",
          "id": 2,
          "name": "fetch foo",
          "priority": 9,
          "status": "queued",
          "trigger": "user",
        },
      ]
    `)
  })
})
