import { Refresh } from "@mui/icons-material"
import { IconButton, MenuItem, Select, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $rpc } from "src/workers/remotes"

const OPTIONS = [
  { label: "1 second", value: 1 },
  { label: "1 minute", value: 60 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "30 minutes", value: 1800 },
]

export function ServerHealthActions() {
  const [interval, setInterval] = React.useState<number>(60)
  const rpc = useStore($rpc)

  return (
    <Tooltip title="Refresh health metrics">
      <IconButton
        onClick={() => {
          rpc.monitorServerHealth()
        }}
      >
        <Refresh fontSize="small" />
      </IconButton>
    </Tooltip>
  )

  return (
    <Select
      value={interval}
      onChange={(e) => setInterval(Number(e.target.value))}
      variant="outlined"
      size="small"
      sx={{ minWidth: 120 }}
    >
      {OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}
