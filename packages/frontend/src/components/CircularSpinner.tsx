import {
  Box,
  CircularProgress,
  circularProgressClasses,
  CircularProgressProps,
  SxProps,
} from "@mui/material"
import React from "react"

type CircularSpinnerProps = CircularProgressProps & { bgColor?: string; rootSx?: SxProps }

export function CircularSpinner(props: CircularSpinnerProps) {
  const {
    rootSx = {},
    sx,
    size = 40,
    variant = "indeterminate",
    bgColor = "var(--mui-palette-LinearProgress-secondaryBg)",
    ...rest
  } = props

  return (
    <Box sx={{ height: size, position: "relative", width: size, ...rootSx }}>
      <CircularProgress
        size={size}
        thickness={4}
        {...rest}
        value={100}
        variant="determinate"
        sx={{
          color: bgColor,
          left: 0,
          position: "absolute",
          top: 0,
          ...sx,
        }}
      />
      <CircularProgress
        variant={variant}
        sx={{
          animationDuration: "550ms",
          left: 0,
          position: "absolute",
          top: 0,
          [`& .${circularProgressClasses.circle}`]: {
            strokeLinecap: "round",
          },
          ...sx,
        }}
        size={size}
        thickness={4}
        disableShrink={variant === "indeterminate"}
        {...rest}
      />
    </Box>
  )
}
