import { CachedRounded } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

export function NetworthActions() {
  return (
    <>
      <Tooltip title="Refresh networth">
        <IconButton
          color="secondary"
          onClick={() => {
            $rpc.get().enqueueFetchPrices($activeAccount.get(), "user")
            $rpc.get().enqueueRefreshBalances($activeAccount.get(), "user")
            $rpc.get().enqueueRefreshNetworth($activeAccount.get(), "user")
          }}
        >
          <CachedRounded fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  )
}
