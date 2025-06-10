import { Typography } from "@mui/material"
import React from "react"
import { StaggeredList } from "src/components/StaggeredList"
import { Subheading } from "src/components/Subheading"

export default function FourZeroFourPage({
  show,
  type = "Page",
}: {
  show: boolean
  type?: string
}) {
  return (
    <StaggeredList component="main" gap={1} show={show}>
      <Subheading>
        <span>{type} not found</span>
      </Subheading>
      <Typography paddingX={2} color="text.secondary">
        We cannot find the {type.toLowerCase()} you are looking for.
      </Typography>
    </StaggeredList>
  )
}
