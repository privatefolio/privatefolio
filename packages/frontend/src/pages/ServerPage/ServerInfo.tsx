import { Paper, Skeleton, Stack, Typography, TypographyProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { $activeAccount } from "src/stores/account-store"

import { MonoFont } from "../../theme"
import { formatNumber } from "../../utils/formatting-utils"
import { $rpc } from "../../workers/remotes"
import { DatabaseInfo } from "./DatabaseInfo"
import { PortfolioInfo } from "./PortfolioInfo"

function SectionTitle(props: TypographyProps) {
  return <Typography variant="body2" {...props} />
}

export function ServerInfo() {
  const [listenerCount, setListenerCount] = useState<number | null>(null)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Server info - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  useEffect(() => {
    const interval = setInterval(() => {
      rpc.getListenerCount().then(setListenerCount)
    }, 1000)

    return () => clearInterval(interval)
  }, [rpc])

  return (
    <>
      <Stack direction={{ md: "row" }} gap={1}>
        <Paper sx={{ minWidth: 340 }}>
          <Stack sx={{ paddingX: 2, paddingY: 1 }} gap={1}>
            <Stack direction="row" justifyContent="space-between">
              <SectionTitle>Active connections</SectionTitle>
              {listenerCount === null ? (
                <Skeleton height={20} width={80} />
              ) : (
                <Typography fontFamily={MonoFont} variant="body2">
                  <span>{formatNumber(listenerCount)}</span>
                </Typography>
              )}
            </Stack>
          </Stack>
        </Paper>
        <DatabaseInfo />
        <PortfolioInfo />
      </Stack>
    </>
  )
}
