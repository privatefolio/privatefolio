import { AddRounded } from "@mui/icons-material"
import { Button, Chip, Stack, TextField } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { SectionTitle } from "src/components/SectionTitle"
import { useConfirm } from "src/hooks/useConfirm"
import { Tag } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { logAndReportError } from "src/utils/error-utils"
import { $rpc } from "src/workers/remotes"

interface TagManagerProps {
  itemId: string
  itemType: "transaction" | "auditLog" | "trade"
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>
  tags: Tag[]
}

export function TagManager({ tags, setTags, itemId, itemType }: TagManagerProps) {
  const confirm = useConfirm()
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const handleAddTag = async () => {
    const { confirmed, event } = await confirm({
      confirmText: "Add",
      content: (
        <Stack gap={2} sx={{ minWidth: 300 }}>
          <div>
            <SectionTitle>Tag name</SectionTitle>
            <TextField variant="outlined" fullWidth size="small" required name="tagName" />
          </div>
        </Stack>
      ),
      focusInput: "tagName",
      title: "Add new tag",
    })

    if (confirmed && event) {
      const formData = new FormData(event.target as HTMLFormElement)
      const tagName = (formData.get("tagName") as string).trim()

      if (!tagName) return

      try {
        if (itemType === "transaction") {
          await rpc.assignTagToTransaction(activeAccount, itemId, tagName)
          const updatedTags = await rpc.getTagsForTransaction(activeAccount, itemId)
          setTags(updatedTags)
        } else if (itemType === "auditLog") {
          await rpc.assignTagToAuditLog(activeAccount, itemId, tagName)
          const updatedTags = await rpc.getTagsForAuditLog(activeAccount, itemId)
          setTags(updatedTags)
        } else {
          await rpc.assignTagToTrade(activeAccount, itemId, tagName)
          const updatedTags = await rpc.getTagsForTrade(activeAccount, itemId)
          setTags(updatedTags)
        }
      } catch (error) {
        logAndReportError(error, "Failed to add tag")
      }
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    try {
      if (itemType === "transaction") {
        await rpc.removeTagFromTransaction(activeAccount, itemId, tagId)
        const updatedTags = await rpc.getTagsForTransaction(activeAccount, itemId)
        setTags(updatedTags)
      } else if (itemType === "auditLog") {
        await rpc.removeTagFromAuditLog(activeAccount, itemId, tagId)
        const updatedTags = await rpc.getTagsForAuditLog(activeAccount, itemId)
        setTags(updatedTags)
      } else {
        await rpc.removeTagFromTrade(activeAccount, itemId, tagId)
        const updatedTags = await rpc.getTagsForTrade(activeAccount, itemId)
        setTags(updatedTags)
      }
    } catch (error) {
      logAndReportError(error, "Failed to remove tag")
    }
  }

  return (
    <div>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {tags.map((tag) => (
          <Chip
            variant="outlined"
            sx={{ borderRadius: 2 }}
            key={tag.id}
            label={tag.name}
            onDelete={() => handleDeleteTag(tag.id)}
          />
        ))}
        <Button
          variant="outlined"
          size="small"
          color="secondary"
          onClick={handleAddTag}
          startIcon={<AddRounded />}
        >
          Add tag
        </Button>
      </Stack>
    </div>
  )
}
