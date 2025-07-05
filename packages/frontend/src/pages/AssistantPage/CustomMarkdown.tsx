import { Paper, Table, TableCell, TableRow, Typography, TypographyProps } from "@mui/material"
import Markdown from "markdown-to-jsx"
import React from "react"

import { ThinkComponent } from "./ThinkComponent"

const CustomTable = ({ children }: { children: React.ReactNode }) => (
  <Paper sx={{ width: "fit-content" }}>
    <Table size="small" sx={{ width: "auto" }}>
      {children}
    </Table>
  </Paper>
)

export function CustomMarkdown(props: { children: string } & TypographyProps) {
  const { children, ...rest } = props

  return (
    <Typography
      component="div"
      sx={{
        "& a": {
          "&:hover": {
            textDecoration: "underline",
          },
          color: "primary.main",
          textDecoration: "none",
        },
        "& b, & strong": {
          fontWeight: "500",
        },
        "& code": {
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          borderRadius: 1,
          px: 0.5,
          py: 0.125,
        },
        "& h3": {
          fontWeight: "500",
          // marginY: 1,
        },
        "& p": {
          marginX: 1,
        },
        "& table img": {
          width: 30,
        },
        "html[data-mui-color-scheme='dark'] &": {
          fontWeight: "300",
        },
        // "& li": {
        //   marginY: 0.25,
        // },
        // "& ul, & ol": {
        //   marginY: 1,
        // },
        // fontWeight: "300",
      }}
      {...rest}
    >
      <Markdown
        options={{
          overrides: {
            table: CustomTable,
            td: TableCell,
            th: {
              component: TableCell,
              props: { variant: "head" },
            },
            think: ThinkComponent,
            tr: TableRow,
          },
        }}
      >
        {children}
      </Markdown>
    </Typography>
  )
}
