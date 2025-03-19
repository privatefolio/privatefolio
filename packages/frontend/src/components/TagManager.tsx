import { AddRounded } from "@mui/icons-material"
import { Button, Chip, Stack, TextField } from "@mui/material"
import React from "react"
import { SectionTitle } from "src/components/SectionTitle"
import { useConfirm } from "src/hooks/useConfirm"
import { Tag } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

interface TagManagerProps {
  itemId: string
  itemType: "transaction" | "auditLog" | "trade"
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>
  tags: Tag[]
}

export function TagManager({ tags, setTags, itemId, itemType }: TagManagerProps) {
  const confirm = useConfirm()

  const handleAddTag = async () => {
    const { confirmed, event } = await confirm({
      confirmText: "Add",
      content: (
        <Stack gap={2} sx={{ minWidth: 300 }}>
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

      try {
        if (itemType === "transaction") {
          await $rpc.get().assignTagToTransaction($activeAccount.get(), itemId, tagName)
          const updatedTags = await $rpc.get().getTagsForTransaction($activeAccount.get(), itemId)
          setTags(updatedTags)
        } else if (itemType === "auditLog") {
          await $rpc.get().assignTagToAuditLog($activeAccount.get(), itemId, tagName)
          const updatedTags = await $rpc.get().getTagsForAuditLog($activeAccount.get(), itemId)
          setTags(updatedTags)
        } else {
          await $rpc.get().assignTagToTrade($activeAccount.get(), itemId, tagName)
          const updatedTags = await $rpc.get().getTagsForTrade($activeAccount.get(), itemId)
          setTags(updatedTags)
        }
      } catch (error) {
        console.error("Failed to add tag:", error)
      }
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    try {
      if (itemType === "transaction") {
        await $rpc.get().removeTagFromTransaction($activeAccount.get(), itemId, tagId)
        const updatedTags = await $rpc.get().getTagsForTransaction($activeAccount.get(), itemId)
        setTags(updatedTags)
      } else if (itemType === "auditLog") {
        await $rpc.get().removeTagFromAuditLog($activeAccount.get(), itemId, tagId)
        const updatedTags = await $rpc.get().getTagsForAuditLog($activeAccount.get(), itemId)
        setTags(updatedTags)
      } else {
        await $rpc.get().removeTagFromTrade($activeAccount.get(), itemId, tagId)
        const updatedTags = await $rpc.get().getTagsForTrade($activeAccount.get(), itemId)
        setTags(updatedTags)
      }
    } catch (error) {
      console.error("Failed to remove tag:", error)
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
