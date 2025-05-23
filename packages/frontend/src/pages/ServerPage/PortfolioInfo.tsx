import { Paper, Skeleton, Stack, Typography, TypographyProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"

import { Timestamp } from "../../interfaces"
import { $filterOptionsMap } from "../../stores/metadata-store"
import { MonoFont } from "../../theme"
import { formatDate, formatNumber } from "../../utils/formatting-utils"
import { $rpc } from "../../workers/remotes"

function SectionTitle(props: TypographyProps) {
  return <Typography variant="body2" {...props} />
}

export function PortfolioInfo() {
  const [genesis, setGenesis] = useState<Timestamp | null>(null)
  const [lastTx, setLastTx] = useState<Timestamp | null>(null)

  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    function fetchData() {
      $rpc.get().getValue<Timestamp>($activeAccount.get(), "genesis", 0).then(setGenesis)
    }

    fetchData()

    const subscription = $rpc
      .get()
      .subscribeToKV<Timestamp>($activeAccount.get(), "genesis", setGenesis)

    return closeSubscription(subscription, $rpc.get())
  }, [connectionStatus])

  useEffect(() => {
    function fetchData() {
      $rpc.get().getValue<Timestamp>($activeAccount.get(), "lastTx", 0).then(setLastTx)
    }

    fetchData()

    const subscription = $rpc
      .get()
      .subscribeToKV<Timestamp>($activeAccount.get(), "lastTx", setLastTx)

    return closeSubscription(subscription, $rpc.get())
  }, [connectionStatus])

  const filterMap = useStore($filterOptionsMap)

  return (
    <Paper sx={{ minWidth: 340 }}>
      <Stack sx={{ paddingX: 2, paddingY: 1 }} gap={1}>
        <Stack direction="row" justifyContent="space-between">
          <SectionTitle>Unique assets</SectionTitle>
          {filterMap.assetId === undefined ? (
            <Skeleton height={20} width={80} />
          ) : (
            <Typography fontFamily={MonoFont} variant="body2">
              <span>{formatNumber(filterMap.assetId.length)}</span>
            </Typography>
          )}
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <SectionTitle>Portfolio genesis</SectionTitle>
          {genesis === null ? (
            <Skeleton height={20} width={80} />
          ) : (
            <Typography fontFamily={MonoFont} variant="body2">
              {genesis === 0 ? (
                <Typography color="text.secondary" component="span" variant="inherit">
                  Unknown
                </Typography>
              ) : (
                <span>{formatDate(genesis)}</span>
              )}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <SectionTitle>Last transaction</SectionTitle>
          {lastTx === null ? (
            <Skeleton height={20} width={80} />
          ) : (
            <Typography fontFamily={MonoFont} variant="body2">
              {lastTx === 0 ? (
                <Typography color="text.secondary" component="span" variant="inherit">
                  Unknown
                </Typography>
              ) : (
                <span>{formatDate(lastTx)}</span>
              )}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}
