import { Stack, TextField } from "@mui/material"
import React, { useState } from "react"
import { SectionTitle } from "src/components/SectionTitle"
import { WalletInput } from "src/components/WalletInput"

interface AddressBookFormProps {
  address?: string
  label?: string
}

export function AddressBookForm({ address, label }: AddressBookFormProps) {
  const [value, onChange] = useState(address ?? "")

  return (
    <Stack gap={2} sx={(theme) => ({ [theme.breakpoints.up("md")]: { minWidth: 520 } })}>
      <div>
        <SectionTitle>Address</SectionTitle>
        <WalletInput
          value={value}
          onChange={onChange}
          variant="outlined"
          fullWidth
          size="small"
          required
          name="address"
          disabled={!!address}
          showWallets
          onlyEVM
        />
      </div>
      <div>
        <SectionTitle>Label</SectionTitle>
        <TextField
          variant="outlined"
          fullWidth
          size="small"
          required
          name="label"
          defaultValue={label}
        />
      </div>
    </Stack>
  )
}
