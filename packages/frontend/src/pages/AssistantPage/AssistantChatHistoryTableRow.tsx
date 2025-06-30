import { TableCell, TableRow, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { memo } from "react"
import { AppLink } from "src/components/AppLink"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ChatConversation } from "src/interfaces"
import { $activeAccountPath } from "src/stores/account-store"
import { TableRowComponentProps } from "src/utils/table-utils"

function AssistantChatHistoryTableRowBase(props: TableRowComponentProps<ChatConversation>) {
  const { row, relativeTime, ...rest } = props
  const { id, startTime, firstMessage, messageCount, model } = row

  const truncatedMessage =
    firstMessage.length > 100 ? `${firstMessage.substring(0, 100)}...` : firstMessage

  const activeAccountPath = useStore($activeAccountPath)

  return (
    <TableRow
      hover
      sx={{ cursor: "pointer" }}
      component={AppLink}
      href={`${activeAccountPath}/assistant?conversation=${id}`}
      {...rest}
    >
      <TableCell>
        <TimestampBlock timestamp={startTime} relative={relativeTime} />
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
          {truncatedMessage}
        </Typography>
      </TableCell>
    </TableRow>
  )
}

export const AssistantChatHistoryTableRow = memo(AssistantChatHistoryTableRowBase)
