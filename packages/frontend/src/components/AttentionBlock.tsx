import { Button, Stack, StackProps, StackTypeMap } from "@mui/material"
import React from "react"

export function AttentionBlock<
  D extends React.ElementType = StackTypeMap["defaultComponent"],
  P = Record<string, never>,
>(props: StackProps<D, P>) {
  return (
    <Stack
      direction="row"
      gap={1}
      alignItems="center"
      sx={(theme) => ({
        borderRadius: 0,
        color: "text.secondary",
        justifyContent: "flex-start",
        ...(props.component === Button
          ? {
              paddingX: 2,
              paddingY: 1,
            }
          : {}),
        textAlign: "start",
        ...theme.typography.body2,
      })}
      {...props}
    />
  )
}
