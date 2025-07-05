import { Stack, TextField } from "@mui/material"
import React, { useState } from "react"
import { AddressInput } from "src/components/AddressInput"
import { SectionTitle } from "src/components/SectionTitle"

interface AddressBookFormProps {
  address?: string
  label?: string
}

export function AddressBookForm({ address, label }: AddressBookFormProps) {
  const [value, onChange] = useState(address ?? "")

  return (
    <Stack gap={2} sx={{ "@media (min-width: 900px)": { minWidth: 520 } }}>
      <div>
        <SectionTitle>Address</SectionTitle>
        <AddressInput
          value={value}
          onChange={onChange}
          variant="outlined"
          fullWidth
          size="small"
          required
          name="address"
          disabled={!!address}
          showWallets
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
