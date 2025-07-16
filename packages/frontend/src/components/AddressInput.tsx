import { Check } from "@mui/icons-material"
import { Autocomplete, Box, Typography } from "@mui/material"
import InputAdornment from "@mui/material/InputAdornment"
import TextField, { TextFieldProps } from "@mui/material/TextField"
import { useStore } from "@nanostores/react"
import { getAddress, isAddress } from "ethers"
import React, { useMemo, useState } from "react"
import { $addressBook, $filterOptionsMap } from "src/stores/metadata-store"
import { formatHex } from "src/utils/utils"

import { MonoFont } from "../theme"
import { Truncate } from "./Truncate"

type AddressInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  onChange?: (value: string) => void
  showAddressBook?: boolean
  showWallets?: boolean
  value?: string
}

const placeholder = "0x000…"

export function AddressInput(props: AddressInputProps) {
  const { value, onChange, showAddressBook, showWallets, ...rest } = props
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>()
  const addressBook = useStore($addressBook, { keys: showAddressBook ? [] : undefined })
  const filterOptionsMap = useStore($filterOptionsMap, { keys: showWallets ? [] : undefined })
  const unlabelledWallets = useMemo(
    () => filterOptionsMap?.wallet.filter((wallet) => !addressBook[wallet]),
    [filterOptionsMap, addressBook]
  )

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

  const displayAddresBook = showAddressBook && addressBook && Object.keys(addressBook).length > 0
  const displayWallets = showWallets && unlabelledWallets && unlabelledWallets.length > 0

  if (displayAddresBook || displayWallets) {
    const options: { address: string; label?: string }[] = []

    if (displayAddresBook) {
      options.push(
        ...Object.entries(addressBook).map(([address, label]) => ({
          address,
          label,
        }))
      )
    }

    if (displayWallets) {
      options.push(...unlabelledWallets.map((wallet) => ({ address: wallet })))
    }

    options.sort((a, b) => a.label?.localeCompare(b.label ?? "") ?? 0)

    return (
      <Autocomplete
        freeSolo
        disableClearable
        openOnFocus
        options={options}
        groupBy={(option) => (option.label ? "Address book" : "My wallets")}
        getOptionLabel={(option) => (typeof option === "string" ? option : option.address)}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.address}>
            {option.label ? (
              <>
                <Typography variant="body2">{option.label}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: MonoFont, marginLeft: "auto" }}
                >
                  {formatHex(option.address)}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ fontFamily: MonoFont }} component={Truncate}>
                {option.address}
              </Typography>
            )}
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

export type AddressInputUncontrolledProps = Omit<AddressInputProps, "onChange" | "value"> & {
  initialValue?: string
}

export function AddressInputUncontrolled({
  initialValue = "",
  ...rest
}: AddressInputUncontrolledProps) {
  const [value, onChange] = useState(initialValue)

  return <AddressInput value={value} onChange={onChange} {...rest} />
}
