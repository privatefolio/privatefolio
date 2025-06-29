import { Check } from "@mui/icons-material"
import { Autocomplete, Box, Typography } from "@mui/material"
import InputAdornment from "@mui/material/InputAdornment"
import TextField, { TextFieldProps } from "@mui/material/TextField"
import { useStore } from "@nanostores/react"
import { getAddress, isAddress } from "ethers"
import React, { useState } from "react"
import { $addressBook } from "src/stores/metadata-store"
import { formatHex } from "src/utils/utils"

import { MonoFont } from "../theme"

type AddressInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  onChange?: (value: string) => void
  showAddressBook?: boolean
  value?: string
}

const placeholder = "0x000…"

export function AddressInput(props: AddressInputProps) {
  const { value, onChange, showAddressBook, ...rest } = props
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>()
  const addressBook = useStore($addressBook, { keys: showAddressBook ? [] : undefined })

  const handleChange = (newValue: string) => {
    if (!newValue) {
      setError(null)
      setSuccess(false)
    } else if (isAddress(newValue)) {
      newValue = getAddress(newValue)
      setSuccess(true)
      setError(null)
    } else {
      setError("Invalid address")
      setSuccess(false)
    }

    onChange?.(newValue)
  }

  const endAdornment = success ? (
    <InputAdornment position="end">
      <Check style={{ color: "green" }} />
    </InputAdornment>
  ) : null

  if (showAddressBook && addressBook && Object.keys(addressBook).length > 0) {
    const options = addressBook
      ? Object.entries(addressBook).map(([address, label]) => ({
          address,
          label,
        }))
      : []

    options.sort((a, b) => a.label.localeCompare(b.label))

    return (
      <Autocomplete
        freeSolo
        disableClearable
        openOnFocus
        options={options}
        getOptionLabel={(option) => (typeof option === "string" ? option : option.address)}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.address}>
            <Typography variant="body2">{option.label}</Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: MonoFont, marginLeft: "auto" }}
            >
              {formatHex(option.address)}
            </Typography>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            {...rest}
            autoComplete="off"
            placeholder={placeholder}
            variant="outlined"
            error={!!error}
            helperText={error}
            multiline
            InputProps={{
              ...params.InputProps,
              endAdornment,
              sx: { fontFamily: MonoFont },
            }}
          />
        )}
        inputValue={value}
        onInputChange={(event, newValue) => {
          handleChange(newValue)
        }}
        onChange={(event, newValue) => {
          if (newValue && typeof newValue === "object") {
            handleChange(newValue.address)
          }
        }}
      />
    )
  }

  return (
    <TextField
      autoComplete="off"
      placeholder={placeholder}
      variant="outlined"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      error={!!error}
      helperText={error}
      multiline
      InputProps={{
        endAdornment,
        sx: { fontFamily: MonoFont },
      }}
      {...rest}
    />
  )
}

export type AddressInputUncontrolledProps = Omit<TextFieldProps, "onChange" | "value"> & {
  initialValue?: string
  showAddressBook?: boolean
}

export function AddressInputUncontrolled({
  initialValue = "",
  ...rest
}: AddressInputUncontrolledProps) {
  const [value, onChange] = useState(initialValue)

  return <AddressInput value={value} onChange={onChange} {...rest} />
}
