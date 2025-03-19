import { HighlightOffRounded } from "@mui/icons-material"
import { IconButton, TableCell, TableRow, Tooltip } from "@mui/material"
import React from "react"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { LabeledAddress } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $addressBook } from "src/stores/metadata-store"
import { $rpc } from "src/workers/remotes"

import { TableRowComponentProps } from "../../utils/table-utils"

export function AddressBookTableRow(props: TableRowComponentProps<LabeledAddress>) {
  const {
    row,
    relativeTime: _relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    ...rest
  } = props
  const { id: wallet, label } = row

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell variant="clickable">
          <IdentifierBlock id={wallet} size="medium" variant="tablecell" />
        </TableCell>
        <TableCell>{label}</TableCell>
        <TableCell variant="actionList">
          <Tooltip title="Remove">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => {
                const walletLabels = $addressBook.get()
                const newWalletLabels = Object.assign({}, walletLabels)
                delete newWalletLabels[wallet]

                $rpc
                  .get()
                  .setValue("wallet_labels", JSON.stringify(newWalletLabels), $activeAccount.get())
                $addressBook.set(newWalletLabels)
              }}
            >
              <HighlightOffRounded fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    </>
  )
}
