import { WarningRounded } from "@mui/icons-material"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material"
import React, { FormEvent, ReactNode, useCallback } from "react"
import { noop } from "src/utils/utils"

interface ConfirmDialogProps {
  confirmText?: string
  content: string | ReactNode
  dismissable?: boolean
  onClose: (confirmed: boolean, event?: FormEvent<HTMLFormElement>) => void
  open: boolean
  title: string
  variant?: "danger" | "warning" | "info" | "success"
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    open,
    onClose,
    title,
    content,
    variant,
    dismissable = true,
    confirmText = "Confirm",
  } = props

  const handleCancel = () => onClose(false)

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      onClose(true, event)
    },
    [onClose]
  )

  return (
    <Dialog open={open} onClose={dismissable ? handleCancel : noop}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <span>{title}</span>
            {/* {variant === "danger" && <ErrorRounded color="error" />} */}
            {variant === "warning" && <WarningRounded color="warning" />}
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">{content}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="secondary" sx={{ paddingX: 2 }}>
            Cancel
          </Button>
          <Button type="submit" color="primary" sx={{ paddingX: 2 }} autoFocus>
            {confirmText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
