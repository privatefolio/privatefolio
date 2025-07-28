import { InfoOutlined } from "@mui/icons-material"
import { IconButton, Stack, Tooltip } from "@mui/material"
import React, { useState } from "react"

export function LearnMore({
  children,
  title,
}: {
  children: React.ReactNode
  title: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      // sx={{ marginBottom: 0.5 }}
    >
      {children}
      <Tooltip title={title} open={open} onClose={() => setOpen(false)} leaveTouchDelay={5_000}>
        <IconButton
          size="small"
          aria-label="Learn more about this"
          color="secondary"
          sx={{ cursor: "help" }}
          onClick={() => setOpen(true)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <InfoOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
