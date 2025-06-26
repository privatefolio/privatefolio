import { Button, ButtonProps, Tooltip } from "@mui/material"
import React from "react"

import { CircularSpinner } from "./CircularSpinner"

type LoadingButtonProps = ButtonProps & {
  loading?: boolean
  loadingText?: string
  tooltip?: string
}

export function LoadingButton(props: LoadingButtonProps) {
  const { loading, loadingText, tooltip, ...rest } = props

  return (
    <Tooltip title={tooltip}>
      <span>
        <Button
          disabled={loading}
          {...rest}
          startIcon={loading ? <CircularSpinner size={14} /> : rest.startIcon}
        >
          {loading ? loadingText : rest.children}
        </Button>
      </span>
    </Tooltip>
  )
}
