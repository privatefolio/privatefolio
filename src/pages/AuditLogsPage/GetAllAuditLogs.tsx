import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded"
import { CircularProgress, ListItemIcon, ListItemText, MenuItem, Stack } from "@mui/material"
import React, { useState } from "react"
import ExportToCsv, { CsvData } from "src/components/ExportToCsv"
import { $activeAccount } from "src/stores/account-store"
import { formatDateWithHour } from "src/utils/formatting-utils"
import { clancy } from "src/workers/remotes"

interface handleClose {
  handleClose: () => void
}

export function GetAllAuditLogs(props: handleClose) {
  const { handleClose } = props
  const [data, setData] = useState<CsvData>([])
  const [loading, setLoading] = useState<boolean>(false)

  if (loading) {
    return (
      <MenuItem dense disabled>
        <Stack direction="row">
          <ListItemIcon>
            <CircularProgress size="1rem" />
          </ListItemIcon>
          <ListItemText>Generating...</ListItemText>
        </Stack>
      </MenuItem>
    )
  }

  if (!data.length) {
    return (
      <MenuItem
        dense
        onClick={() => {
          setLoading(true)

          clancy.findAuditLogs({}, $activeAccount.get()).then((auditLogs) => {
            const rows = auditLogs.map((x) => [
              x._id,
              formatDateWithHour(x.timestamp, {
                timeZone: "UTC",
                timeZoneName: "short",
              }),
              x.platform,
              x.wallet,
              x.operation,
              x.change,
              x.balance,
              x.txId,
            ])

            // setTimeout(() => {
            setData([
              [
                "Identifier",
                "Timestamp",
                "Platform",
                "Wallet",
                "Operation",
                "Change",
                "New Balance",
                "Transaction ID",
              ],
              ...rows,
            ])
            setLoading(false)
            // }, 11115000)
          })
        }}
      >
        <Stack direction="row">
          <ListItemIcon>
            <ExitToAppRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to csv. all audit logs</ListItemText>
        </Stack>
      </MenuItem>
    )
  }

  if (data.length) {
    return (
      <>
        <MenuItem
          dense
          onClick={() => {
            handleClose()
          }}
        >
          <ExportToCsv
            data={data}
            filename="audit-logs.csv"
            text="Download csv. with all audit logs"
          />
        </MenuItem>
      </>
    )
  }
}
