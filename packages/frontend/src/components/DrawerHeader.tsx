import { CloseRounded } from "@mui/icons-material"
import { IconButton, Stack, StackProps, Typography } from "@mui/material"
import React from "react"

type DrawerHeaderProps = { children: React.ReactNode; toggleOpen: () => void } & StackProps

export function DrawerHeader(props: DrawerHeaderProps) {
  const { children, toggleOpen, ...rest } = props

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      marginBottom={1.5}
      {...rest}
    >
      <Typography variant="subtitle1" letterSpacing="0.025rem">
        {children}
      </Typography>
      <IconButton onClick={toggleOpen} edge="end" color="secondary" aria-label="Close dialog">
        <CloseRounded fontSize="small" />
      </IconButton>
    </Stack>
  )
}
