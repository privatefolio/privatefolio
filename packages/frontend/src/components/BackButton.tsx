import { KeyboardBackspace } from "@mui/icons-material"
import { Button, ButtonProps } from "@mui/material"
import React, { ReactNode } from "react"
import { Link, LinkProps } from "react-router-dom"

type BackButtonProps = Omit<ButtonProps<"a">, "component"> & LinkProps & { children?: ReactNode }

export function BackButton({ sx = {}, ...rest }: BackButtonProps) {
  return (
    <Button
      component={Link}
      size="small"
      color="secondary"
      sx={{ borderRadius: 16, paddingLeft: 1, paddingRight: 2, ...sx }}
      startIcon={<KeyboardBackspace sx={{ pointerEvents: "none" }} />}
      {...rest}
    />
  )
}
