// import InfoRoundedIcon from "@mui/icons-material/InfoRounded"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { Stack, Typography } from "@mui/material"
import React from "react"

interface hiddenBalancesN {
  hiddenBalancesN: number
}

export function InformativeRowHiddenBalances(props: hiddenBalancesN) {
  const { hiddenBalancesN } = props
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        gap={1}
        alignItems="center"
        color="text.secondary"
      >
        <InfoOutlinedIcon sx={{ height: 20, width: 20 }} />
        <Typography
          color="text.secondary"
          variant="body2"
          component="div"
          sx={{ minHeight: 22, width: "100%" }}
        >
          <span>{hiddenBalancesN} Hidden balances</span>
        </Typography>
      </Stack>
    </>
  )
}
