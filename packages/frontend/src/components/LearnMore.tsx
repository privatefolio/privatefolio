import { InfoOutlined } from "@mui/icons-material"
import { IconButton, Stack, Tooltip } from "@mui/material"
import React from "react"

export function LearnMore({
  children,
  title,
}: {
  children: React.ReactNode
  title: React.ReactNode
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ marginBottom: 0.5 }}>
      {children}
      <Tooltip title={title}>
        <IconButton size="small" aria-label="Learn more about this" color="secondary">
          <InfoOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
