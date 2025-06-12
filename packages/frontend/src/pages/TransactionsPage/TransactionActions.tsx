import {
  CallMergeRounded,
  DownloadRounded,
  MoreHoriz,
  Paid,
  PaidOutlined,
  RemoveCircle,
} from "@mui/icons-material"
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
import { Transaction } from "src/interfaces"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { handleExportTransactionsRequest } from "src/utils/backup-utils"
import { downloadCsv } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

interface TransactionActionsProps {
  tableDataRef: MutableRefObject<Transaction[]>
  toggleAddTransactionDrawer: () => void
}

export function TransactionActions(props: TransactionActionsProps) {
  const { tableDataRef, toggleAddTransactionDrawer: _toggleAddTransactionDrawer } = props
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

  const showQuotedAmounts = useStore($showQuotedAmounts)

  return (
    <Stack direction="row">
      {/* <Tooltip title="Add Transaction">
        <IconButton
          color="secondary"
          onClick={() => {
            handleClose()
            toggleAddTransactionDrawer()
          }}
        >
          <Add fontSize="small" />
        </IconButton>
      </Tooltip> */}
      <Tooltip
        title={showQuotedAmounts ? "Show amounts in Base Asset" : "Show amounts in Quote Currency"}
      >
        <IconButton
          color="secondary"
          onClick={() => {
            $showQuotedAmounts.set(!showQuotedAmounts)
          }}
        >
          {showQuotedAmounts ? <Paid fontSize="small" /> : <PaidOutlined fontSize="small" />}
        </IconButton>
      </Tooltip>
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
        <MenuItem
          dense
          onClick={() => {
            const data = transformTransactionsToCsv(tableDataRef.current)
            downloadCsv(data, `${activeAccount}-transactions.csv`)
            handleClose()
          }}
        >
          <ListItemAvatar>
            <DownloadRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Export table</ListItemText>
        </MenuItem>
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
            <RemoveCircle fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Detect spam transactions</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  )
}
