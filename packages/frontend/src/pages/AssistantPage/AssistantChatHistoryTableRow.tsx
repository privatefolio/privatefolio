import { TableCell, TableRow, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { memo } from "react"
import { AppLink } from "src/components/AppLink"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ChatConversation } from "src/interfaces"
import { $activeAccountPath } from "src/stores/account-store"
import { TableRowComponentProps } from "src/utils/table-utils"

function AssistantChatHistoryTableRowBase(props: TableRowComponentProps<ChatConversation>) {
  const {
    row,
    relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    ...rest
  } = props
  const { id, startTime, firstMessage } = row

  const truncatedMessage =
    firstMessage.length > 100 ? `${firstMessage.substring(0, 100)}...` : firstMessage

  const activeAccountPath = useStore($activeAccountPath)

  return (
    <TableRow hover {...rest}>
      <TableCell>
        <TimestampBlock timestamp={startTime} relative={relativeTime} />
      </TableCell>
      <TableCell variant="clickable">
        <AppLink href={`${activeAccountPath}/assistant?conversation=${id}`}>
          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
            {truncatedMessage}
          </Typography>
        </AppLink>
      </TableCell>
    </TableRow>
  )
}

export const AssistantChatHistoryTableRow = memo(AssistantChatHistoryTableRowBase)
