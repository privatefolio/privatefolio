import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { QueryTableData, RemoteTable } from "src/components/EnhancedTable/RemoteTable"
import { ChatConversation } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { AssistantChatHistoryTableRow } from "./AssistantChatHistoryTableRow"

export function AssistantChatHistoryTable() {
  const accountName = useStore($activeAccount)
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)

  useEffect(() => {
    document.title = `Assistant history - ${accountName} - Privatefolio`
  }, [accountName])

  useEffect(() => {
    const subscription = rpc.subscribeToChatHistory(
      accountName,
      throttle(
        () => {
          console.log("Refreshing conversation history")
          setRefresh(Math.random())
        },
        SHORT_THROTTLE_DURATION,
        {
          leading: false,
          trailing: true,
        }
      )
    )

    return closeSubscription(subscription, rpc)
  }, [rpc, accountName, connectionStatus])

  const queryFn: QueryTableData<ChatConversation> = useCallback(
    async (filters, rowsPerPage, page, order, signal) => {
      const _refresh = refresh // reference the dependency for eslint(react-hooks/exhaustive-deps)

      const orderQuery = order === "asc" ? "ORDER BY startTime ASC" : "ORDER BY lastTime DESC"
      const limitQuery = `LIMIT ${rowsPerPage} OFFSET ${page * rowsPerPage}`

      // Build custom query for conversation summaries with pagination
      const query = `
        SELECT 
          conversationId,
          MIN(timestamp) as startTime,
          MAX(timestamp) as lastTime,
          (SELECT message FROM chat_history ch1 WHERE ch1.conversationId = chat_history.conversationId ORDER BY timestamp ASC LIMIT 1) as firstMessage
        FROM chat_history 
        GROUP BY conversationId 
        ${orderQuery} 
        ${limitQuery}
      `

      const conversations = await rpc.getConversationSummaries(accountName, query)

      if (signal?.aborted) throw new Error(signal.reason)

      const getCount = () => rpc.countConversations(accountName)

      return [conversations, getCount]
    },
    [rpc, accountName, refresh]
  )

  const headCells = useMemo<HeadCell<ChatConversation>[]>(
    () => [
      {
        key: "startTime",
        label: "Started",
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
        timestamp: true,
      },
      {
        key: "firstMessage",
        label: "First message",
        sx: { width: "100%" },
      },
    ],
    []
  )

  return (
    <RemoteTable
      initOrderBy="startTime"
      headCells={headCells}
      queryFn={queryFn}
      TableRowComponent={AssistantChatHistoryTableRow}
      emptyContent="No conversation history."
    />
  )
}
