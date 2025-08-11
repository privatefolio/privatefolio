import { SdStorageRounded } from "@mui/icons-material"
import { Stack, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { InfoCard, InfoCardRow } from "src/components/InfoCard"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"

import { MonoFont } from "../../theme"
import { formatFileSize, formatNumber } from "../../utils/formatting-utils"
import { $rpc } from "../../workers/remotes"

export function DatabaseInfo() {
  const [storageUsage, setStorageUsage] = useState<number | null>(null)
  const [auditLogs, setAuditLogs] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<number | null>(null)
  const connectionStatus = useStore($connectionStatus)

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    function fetchData() {
      rpc.getDiskUsage(activeAccount).then(setStorageUsage)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // if (!window.navigator.storage) {
      //   setStorageUsage(0)
      //   return
      // }

      // window.navigator.storage.estimate().then((estimate: any) => {
      //   setStorageUsage(estimate.usageDetails?.indexedDB ?? null)
      // })
    }

    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, 2500)

    return () => clearInterval(interval)
  }, [connectionStatus, rpc, activeAccount])

  useEffect(() => {
    function fetchData() {
      rpc.countAuditLogs(activeAccount).then(setAuditLogs)
    }

    fetchData()
  }, [connectionStatus, rpc, activeAccount])

  useEffect(() => {
    function fetchData() {
      rpc.countTransactions(activeAccount).then(setTransactions)
    }

    fetchData()
  }, [connectionStatus, rpc, activeAccount])

  return (
    <InfoCard>
      <InfoCardRow
        title="Disk Usage"
        value={
          storageUsage === null ? null : storageUsage === 0 ? undefined : (
            <Tooltip
              title={
                <Stack>
                  <span>{formatFileSize(storageUsage, true)}</span>
                  <i className="secondary">
                    <span>{formatNumber(storageUsage)} Bytes</span>
                  </i>
                </Stack>
              }
            >
              <Stack direction="row" gap={1}>
                <SdStorageRounded fontSize="small" />
                <Typography fontFamily={MonoFont} variant="body2">
                  <span>{formatFileSize(storageUsage)}</span>
                </Typography>
              </Stack>
            </Tooltip>
          )
        }
      />

      <InfoCardRow
        title="Audit logs"
        value={auditLogs === null ? auditLogs : <span>{formatNumber(auditLogs)}</span>}
      />

      <InfoCardRow
        title="Transactions"
        value={transactions === null ? transactions : <span>{formatNumber(transactions)}</span>}
      />
    </InfoCard>
  )
}
