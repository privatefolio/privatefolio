import { CallMergeRounded, DownloadRounded, MoreHoriz, PhishingRounded } from "@mui/icons-material"
import {
  IconButton,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { transformTransactionsToCsv } from "privatefolio-backend/build/src/utils/csv-export-utils"
import React, { MutableRefObject } from "react"
import { HideSpamToggle } from "src/components/HideSpamToggle"
import { QuoteCurrencyToggle } from "src/components/QuoteCurrencyToggle"
import { Transaction } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { handleExportTransactionsRequest } from "src/utils/backup-utils"
import { downloadCsv } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

interface TransactionActionsProps {
  tableDataRef?: MutableRefObject<Transaction[]>
}

export function TransactionActions(props: TransactionActionsProps) {
  const { tableDataRef } = props
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  return (
    <Stack direction="row">
      <QuoteCurrencyToggle />
      <HideSpamToggle />
      <Tooltip title="Actions">
        <IconButton color="secondary" onClick={handleClick}>
          <MoreHoriz fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        {tableDataRef && (
          <MenuItem
            dense
            onClick={() => {
              const data = transformTransactionsToCsv(tableDataRef?.current ?? [])
              downloadCsv(data, `${activeAccount}-transactions.csv`)
              handleClose()
            }}
          >
            <ListItemAvatar>
              <DownloadRounded fontSize="small" />
            </ListItemAvatar>
            <ListItemText>Export table</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          dense
          onClick={() => {
            handleExportTransactionsRequest(rpc, activeAccount)
            handleClose()
          }}
        >
          <ListItemAvatar>
            <DownloadRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Export all transactions</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            rpc.enqueueAutoMerge(activeAccount, "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <CallMergeRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Auto-merge transactions</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            rpc.enqueueDetectSpamTransactions(activeAccount, "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <PhishingRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Detect spam transactions</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  )
}
