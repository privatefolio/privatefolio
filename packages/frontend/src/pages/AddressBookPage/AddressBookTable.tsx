import { Add, MenuBookRounded } from "@mui/icons-material"
import { Button, Stack, TextField, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useCallback, useMemo } from "react"
import { AddressInputUncontrolled } from "src/components/AddressInput"
import { AttentionBlock } from "src/components/AttentionBlock"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { SectionTitle } from "src/components/SectionTitle"
import { useConfirm } from "src/hooks/useConfirm"
import { LabeledAddress } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $addressBook, $inMemoryDataQueryTime } from "src/stores/metadata-store"
import { HeadCell } from "src/utils/table-utils"
import { $rpc } from "src/workers/remotes"

import { AddressBookTableRow } from "./AddressBookTableRow"

export function AddressBookTable() {
  const addressBook = useStore($addressBook)
  const queryTime = useStore($inMemoryDataQueryTime)

  const rows: LabeledAddress[] = useMemo(
    () =>
      queryTime === null
        ? []
        : Object.keys(addressBook).reduce((acc, id) => {
            acc.push({ id, label: addressBook[id] })
            return acc
          }, [] as LabeledAddress[]),
    [queryTime, addressBook]
  )

  const headCells: HeadCell<LabeledAddress>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Address",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: "50%" },
      },
      {
        key: "label",
        label: "Label",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: "50%" },
      },
      {
        sx: { maxWidth: 60, minWidth: 60, width: 60 },
      },
    ],
    []
  )

  const confirm = useConfirm()

  const handleAddNewRow = useCallback(async () => {
    const { confirmed, event } = await confirm({
      confirmText: "Add",
      content: (
        <Stack gap={2} sx={{ minWidth: 464 }}>
          <div>
            <SectionTitle>Address</SectionTitle>
            <AddressInputUncontrolled
              variant="outlined"
              fullWidth
              size="small"
              required
              name={"address"}
            />
          </div>
          <div>
            <SectionTitle>Label</SectionTitle>
            <TextField variant="outlined" fullWidth size="small" required name="label" />
          </div>
        </Stack>
      ),
      title: "Add wallet or smart contract to address book",
    })

    if (confirmed && event) {
      const formData = new FormData(event.target as HTMLFormElement)
      const address = formData.get("address") as string
      const label = (formData.get("label") as string).trim()

      if (!label) return

      const addressBook = $addressBook.get()
      const newAddressBook = Object.assign({}, addressBook, { [address]: label })

      $rpc.get().setValue("address_book", JSON.stringify(newAddressBook), $activeAccount.get())
      $addressBook.set(newAddressBook)
    }
  }, [confirm])

  return (
    <>
      <MemoryTable<LabeledAddress>
        initOrderBy="id"
        initOrderDir="asc"
        headCells={headCells}
        TableRowComponent={AddressBookTableRow}
        rows={rows}
        rowCount={rows.length}
        queryTime={queryTime}
        defaultRowsPerPage={10}
        emptyContent={
          <Button sx={{ padding: 4 }} onClick={handleAddNewRow}>
            <Typography color="text.secondary" variant="body2" component="div">
              <Stack alignItems="center">
                <MenuBookRounded sx={{ height: 64, width: 64 }} />
                <span>
                  Click to <u>label a wallet or a smart contract</u>.
                </span>
              </Stack>
            </Typography>
          </Button>
        }
        addNewRow={
          <AttentionBlock component={Button} onClick={handleAddNewRow} fullWidth>
            <Add sx={{ height: 20, width: 20 }} />
            <span>
              Click to <u>label a wallet or a smart contract</u>.
            </span>
          </AttentionBlock>
        }
      />
    </>
  )
}
