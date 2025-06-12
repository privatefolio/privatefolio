import { Add, LabelRounded } from "@mui/icons-material"
import { Button, Stack, TextField, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useCallback, useEffect, useState } from "react"
import { AttentionBlock } from "src/components/AttentionBlock"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { SectionTitle } from "src/components/SectionTitle"
import { useConfirm } from "src/hooks/useConfirm"
import { Tag } from "src/interfaces"
import { SHORT_THROTTLE_DURATION } from "src/settings"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { TagsTableRow } from "./TagsTableRow"

export function TagsTable() {
  const [tags, setTags] = useState<Tag[]>([])
  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [refresh, setRefresh] = useState(0)
  const accountName = useStore($activeAccount)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const fetchTags = useCallback(async () => {
    const start = Date.now()

    const result = await rpc.getTags(accountName)
    setTags(result)

    setQueryTime(Date.now() - start)
  }, [accountName, rpc])

  useEffect(() => {
    fetchTags()
  }, [fetchTags, refresh])

  useEffect(() => {
    const subscription = rpc.subscribeToTags(
      accountName,
      throttle(
        () => {
          console.log("Refreshing tags")
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
  }, [accountName, connectionStatus, rpc])

  const headCells: HeadCell<Tag>[] = [
    {
      key: "name",
      label: "Tag name",
      sortable: true,
      sx: { maxWidth: 400, minWidth: 200, width: "100%" },
    },
    {
      sx: { maxWidth: 60, minWidth: 60, width: 60 },
    },
  ]

  const confirm = useConfirm()

  const handleAddNewRow = useCallback(async () => {
    const { confirmed, event } = await confirm({
      confirmText: "Add",
      content: (
        <Stack gap={2} sx={{ minWidth: 464 }}>
          <div>
            <SectionTitle>Tag name</SectionTitle>
            <TextField
              autoFocus
              variant="outlined"
              fullWidth
              size="small"
              required
              name="tagName"
            />
          </div>
        </Stack>
      ),
      title: "Add new tag",
    })

    if (confirmed && event) {
      const formData = new FormData(event.target as HTMLFormElement)
      const tagName = (formData.get("tagName") as string).trim()

      if (!tagName) return

      await rpc.upsertTag(activeAccount, tagName)
    }
  }, [confirm, rpc, activeAccount])

  return (
    <MemoryTable<Tag>
      initOrderBy="name"
      initOrderDir="asc"
      headCells={headCells}
      TableRowComponent={TagsTableRow}
      rows={tags}
      rowCount={tags.length}
      queryTime={queryTime}
      defaultRowsPerPage={10}
      emptyContent={
        <Button sx={{ padding: 4 }} onClick={handleAddNewRow}>
          <Typography color="text.secondary" variant="body2" component="div">
            <Stack alignItems="center">
              <LabelRounded sx={{ height: 64, width: 64 }} />
              <span>
                Click to <u>add a new tag</u>, which can be used to label transactions & audit logs.
              </span>
            </Stack>
          </Typography>
        </Button>
      }
      addNewRow={
        <AttentionBlock component={Button} onClick={handleAddNewRow} fullWidth>
          <Add sx={{ height: 20, width: 20 }} />
          <span>
            Click to <u>add a new tag</u>.
          </span>
        </AttentionBlock>
      }
    />
  )
}
