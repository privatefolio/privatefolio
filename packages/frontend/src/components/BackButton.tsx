import { KeyboardBackspace } from "@mui/icons-material"
import { Button, ButtonProps } from "@mui/material"
import React, { useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { isInputFocused } from "src/utils/browser-utils"

import { Key } from "./SearchBar/Key"

type BackButtonProps = ButtonProps & {
  fallback?: string
}

export function BackButton({ fallback, sx = {}, ...rest }: BackButtonProps) {
  const navigate = useNavigate()

  const idx = window.history.state?.idx ?? 0
  const canGoBack = idx > 0

  const handleClick = useCallback(() => {
    if (canGoBack || !fallback) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }, [canGoBack, fallback, navigate])

  const hide = !canGoBack && !fallback

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInputFocused()) return
      if (event.key === "Backspace" && !hide) {
        handleClick()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleClick, hide])

  return (
    <Button
      onClick={handleClick}
      size="small"
      color="secondary"
      sx={{
        "& .MuiButton-endIcon span": {
          fontSize: "0.75rem !important",
        },
        alignSelf: "flex-start",
        borderRadius: 16,
        opacity: hide ? 0 : 1,
        paddingLeft: 1,
        paddingRight: 2,
        paddingY: 0.25,
        ...sx,
      }}
      startIcon={<KeyboardBackspace sx={{ pointerEvents: "none" }} />}
      endIcon={<Key>BKSP</Key>}
      {...rest}
    />
  )
}
