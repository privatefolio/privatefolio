import { InfoOutlined } from "@mui/icons-material"
import { Alert, AlertProps } from "@mui/material"
import React from "react"

export function Callout({ sx, ...rest }: AlertProps) {
  return (
    <Alert
      icon={<InfoOutlined fontSize="inherit" />}
      variant="outlined"
      sx={{
        "& .MuiAlert-icon": {
          color: "var(--mui-palette-secondary-main)",
        },
        borderColor: "var(--mui-palette-TableCell-border)",
        color: "var(--mui-palette-secondary-main)",
        ...sx,
      }}
      {...rest}
    />
  )
}
