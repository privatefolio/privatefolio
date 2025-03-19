import { Delete, Edit } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow, TextField, Tooltip } from "@mui/material"
import React, { useCallback } from "react"
import { useConfirm } from "src/hooks/useConfirm"
import { Tag } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

interface TagsTableRowProps {
  row: Tag
}

export function TagsTableRow({ row }: TagsTableRowProps) {
  const confirm = useConfirm()

  const handleEdit = useCallback(async () => {
    const { confirmed, event } = await confirm({
      confirmText: "Save",
      content: (
        <Stack gap={2} sx={{ minWidth: 464 }}>
          <div>
            <TextField
              variant="outlined"
              fullWidth
              size="small"
              required
              name="tagName"
              defaultValue={row.name}
            />
          </div>
        </Stack>
      ),
      title: "Edit tag",
    })

    if (confirmed && event) {
      const formData = new FormData(event.target as HTMLFormElement)
      const tagName = (formData.get("tagName") as string).trim()

      if (!tagName || tagName === row.name) return

      await $rpc.get().updateTag($activeAccount.get(), row.id, tagName)
    }
  }, [confirm, row])

  const handleDelete = useCallback(async () => {
    const { confirmed } = await confirm({
      confirmText: "Delete",
      content: "Are you sure you want to delete this tag? This action cannot be undone.",
      title: "Delete tag",
      variant: "danger",
    })

    if (confirmed) {
      await $rpc.get().deleteTag($activeAccount.get(), row.id)
    }
  }, [confirm, row.id])

  return (
    <TableRow hover>
      <TableCell>{row.name}</TableCell>
      <TableCell variant="actionList">
        <Stack direction="row" alignItems="center" justifyContent="flex-end">
          <Tooltip title="Edit tag">
            <IconButton size="small" onClick={handleEdit}>
              <Edit fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete tag">
            <IconButton size="small" onClick={handleDelete}>
              <Delete fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
