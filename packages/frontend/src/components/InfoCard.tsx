import { Paper, PaperProps, Skeleton, Stack, StackProps, Typography } from "@mui/material"
import React from "react"
import { MonoFont } from "src/theme"

interface InfoCardRowProps {
  title: string
  value: string | number | React.ReactNode
}

export function InfoCardRow(props: InfoCardRowProps) {
  const { title, value } = props

  return (
    <Stack direction="row" justifyContent="space-between" gap={5}>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {value === null ? (
        <Skeleton height={20} width={100} />
      ) : value === undefined ? (
        <Typography variant="body2" color="text.secondary">
          <span>Unknown</span>
        </Typography>
      ) : (
        <Typography fontFamily={MonoFont} variant="body2" component="div">
          <span>{value}</span>
        </Typography>
      )}
    </Stack>
  )
}

export function InfoCard(props: PaperProps) {
  return (
    <Paper sx={{ minWidth: 340, paddingX: 2, paddingY: 1 }} component={Stack} gap={1} {...props} />
  )
}

export function InfoCards(props: StackProps) {
  return <Stack direction={{ md: "row" }} gap={1} {...props} />
}
