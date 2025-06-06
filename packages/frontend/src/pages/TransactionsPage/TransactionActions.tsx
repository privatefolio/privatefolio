import {
  Add,
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
import React, { MutableRefObject } from "react"
// import { exportTransactionsToCsv } from "src/extensions/file-imports/csv-export-utils"
import { Transaction } from "src/interfaces"
import { $showQuotedAmounts } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { $rpc } from "src/workers/remotes"

interface TransactionActionsProps {
  tableDataRef: MutableRefObject<Transaction[]>
  toggleAddTransactionDrawer: () => void
}

export function TransactionActions(props: TransactionActionsProps) {
  const { tableDataRef, toggleAddTransactionDrawer } = props
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const showQuotedAmounts = useStore($showQuotedAmounts)

  return (
    <Stack direction="row">
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
            // const data = exportTransactionsToCsv(tableDataRef.current)
            // downloadCsv(data, `${$activeAccount.get()}-transactions.csv`)
            // handleClose()
          }}
        >
          <ListItemAvatar>
            <DownloadRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Export table</ListItemText>
        </MenuItem>
        {/* <MenuItem
          dense
          onClick={() => {
            $rpc.get().enqueueExportAllTransactions($activeAccount.get(), "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <DownloadRounded fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Export all transactions</ListItemText>
        </MenuItem> */}
        <MenuItem
          dense
          onClick={() => {
            $rpc.get().enqueueAutoMerge($activeAccount.get(), "user")
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
            $rpc.get().enqueueDetectSpamTransactions($activeAccount.get(), "user")
            handleClose()
          }}
        >
          <ListItemAvatar>
            <RemoveCircle fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Detect spam transactions</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            handleClose()
            toggleAddTransactionDrawer()
          }}
        >
          <ListItemAvatar>
            <Add fontSize="small" />
          </ListItemAvatar>
          <ListItemText>Add Transaction</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  )
}
