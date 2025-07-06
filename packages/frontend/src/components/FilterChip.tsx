import { alpha, Chip, ChipProps, lighten } from "@mui/material"
import React from "react"

type FilterChipProps = Omit<ChipProps, "color"> & {
  color: string
}

export function FilterChip({ color, ...rest }: FilterChipProps) {
  return (
    <Chip
      variant="outlined"
      sx={{
        "& .MuiChip-deleteIcon": {
          color,
        },
        "& .MuiChip-deleteIcon:hover": {
          color: lighten(color, 0.25),
        },
        background: alpha(color, 0.15),
        border: `1px solid ${alpha(color, 0.25)}`,
        borderRadius: 2,
        color,
        fontWeight: 500,
        paddingX: 0.25,
      }}
      {...rest}
    />
  )
}
