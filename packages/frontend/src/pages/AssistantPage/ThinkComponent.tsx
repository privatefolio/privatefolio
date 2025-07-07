import { ExpandMore } from "@mui/icons-material"
import { Box, Button } from "@mui/material"
import React, { useState } from "react"
import { BrainSvg } from "src/components/BrainSvg"

export function ThinkComponent({ children }: { children: React.ReactNode }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <>
      <Box
        sx={{
          backgroundColor: "var(--mui-palette-background-paper)",
          borderRadius: 2,
          color: "text.secondary",
          fontStyle: "italic",
          marginBottom: 0.5,
          marginRight: 0.5,
          width: "fit-content",
        }}
      >
        <Button
          onClick={() => setShowDetails(!showDetails)}
          size="small"
          color="secondary"
          startIcon={<BrainSvg sx={{ fontSize: "14px !important" }} />}
          sx={{
            borderRadius: 2,
            fontSize: "0.875rem",
            fontWeight: 400,
            paddingX: 1.25,
            paddingY: 0.5,
          }}
          endIcon={
            <ExpandMore
              sx={{
                transform: showDetails ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
              fontSize="inherit"
            />
          }
        >
          Thinking
        </Button>
        {showDetails && <Box sx={{ paddingBottom: 1, paddingX: 2 }}>{children}</Box>}
      </Box>
    </>
  )
}
