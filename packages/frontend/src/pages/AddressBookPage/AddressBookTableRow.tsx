import { EditRounded, HighlightOffRounded } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { useConfirm } from "src/hooks/useConfirm"
import { LabeledAddress } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $addressBook } from "src/stores/metadata-store"
import { $rpc } from "src/workers/remotes"

import { TableRowComponentProps } from "../../utils/table-utils"
import { AddressBookForm } from "./AddressBookForm"

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

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const confirm = useConfirm()

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell variant="clickable">
          <IdentifierBlock id={wallet} size="medium" variant="tablecell" />
        </TableCell>
        <TableCell>{label}</TableCell>
        <TableCell variant="actionList">
          <Stack direction="row" justifyContent="flex-end">
            <Tooltip title="Edit label">
              <IconButton
                size="small"
                color="secondary"
                onClick={async () => {
                  const { confirmed, event } = await confirm({
                    confirmText: "Save",
                    content: <AddressBookForm address={wallet} label={label} />,
                    focusInput: "label",
                    title: "Edit address book",
                  })

                  if (confirmed && event) {
                    const formData = new FormData(event.target as HTMLFormElement)
                    const newLabel = (formData.get("label") as string).trim()

                    if (!newLabel || newLabel === label) return

                    const addressBook = $addressBook.get()
                    const newAddressBook = { ...addressBook, [wallet]: newLabel }
                    await rpc.setValue(
                      activeAccount,
                      "address_book",
                      JSON.stringify(newAddressBook)
                    )
                    $addressBook.set(newAddressBook)
                  }
                }}
              >
                <EditRounded fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton
                size="small"
                color="secondary"
                onClick={async () => {
                  const addressBook = $addressBook.get()
                  const newAddressBook = Object.assign({}, addressBook)
                  delete newAddressBook[wallet]

                  await rpc.setValue(activeAccount, "address_book", JSON.stringify(newAddressBook))
                  $addressBook.set(newAddressBook)
                }}
              >
                <HighlightOffRounded fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
    </>
  )
}
