import Box from "@mui/material/Box"
import LinearProgress, { LinearProgressProps } from "@mui/material/LinearProgress"
import Typography from "@mui/material/Typography"
import * as React from "react"

export function LinearProgressWithLabel(props: LinearProgressProps & { value?: number }) {
  // alway show 3 digits in total
  const decimals = !props.value ? 0 : props.value < 10 ? 2 : props.value < 100 ? 1 : 0

  return (
    <Box sx={{ alignItems: "center", display: "flex", height: 20.5 }}>
      <Box sx={{ mr: 1, width: "100%" }}>
        <LinearProgress
          variant={typeof props.value === "number" ? "determinate" : "indeterminate"}
          {...props}
        />
      </Box>
      {typeof props.value === "number" && (
        <Box sx={{ minWidth: 40, textAlign: "right" }}>
          <Typography variant="body2" color="text.secondary">{`${(
            Math.floor(props.value * 10 ** decimals) /
            10 ** decimals
          ).toFixed(0)}%`}</Typography>
        </Box>
      )}
    </Box>
  )
}
