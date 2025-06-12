import { Chip, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { EventCause, Tag } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { $rpc } from "src/workers/remotes"

interface TagListProps {
  itemId: string
  itemType: "transaction" | "auditLog" | "trade"
}

export function TagList({ itemId, itemType }: TagListProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [searchParams, setSearchParams] = useSearchParams()

  const accountName = useStore($activeAccount)
  const [refresh, setRefresh] = useState(0)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  // TODO0: optimize this
  useEffect(() => {
    const subFn =
      itemType === "transaction"
        ? rpc.subscribeToTransactions
        : itemType === "auditLog"
          ? rpc.subscribeToAuditLogs
          : rpc.subscribeToTrades

    const subscription = subFn(
      accountName,
      throttle(
        (_cause: EventCause) => {
          console.log("Refreshing")
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
  }, [rpc, accountName, connectionStatus, itemType])

  useEffect(() => {
    const fetchTags = async () => {
      try {
        if (itemType === "transaction") {
          const fetchedTags = await rpc.getTagsForTransaction(activeAccount, itemId)
          setTags(fetchedTags)
        } else if (itemType === "auditLog") {
          const fetchedTags = await rpc.getTagsForAuditLog(activeAccount, itemId)
          setTags(fetchedTags)
        } else {
          const fetchedTags = await rpc.getTagsForTrade(activeAccount, itemId)
          setTags(fetchedTags)
        }
      } catch (error) {
        console.error(`Failed to fetch tags for ${itemType} ${itemId}:`, error)
      }
    }

    fetchTags()
  }, [rpc, itemId, itemType, refresh, activeAccount])

  const handleTagClick = (tag: Tag) => {
    // Add tag filter to URL
    searchParams.set("tags", tag.id.toString())
    setSearchParams(searchParams)
  }

  if (tags.length === 0) {
    return null
  }

  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap">
      {tags.map((tag) => (
        <Chip
          key={tag.id}
          label={tag.name}
          size="small"
          sx={{ borderRadius: 2 }}
          onClick={() => handleTagClick(tag)}
        />
      ))}
    </Stack>
  )
}
