import { CheckRounded } from "@mui/icons-material"
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
  /**
   * For uncontrolled inputs
   */
  disableLabels?: boolean
  onChange: (value: string) => void
  onlyEVM?: boolean
  showAddressBook?: boolean
  showWallets?: boolean
  value: string
}

const placeholderEvm = "0x000…"
const placeholderAll = ""

export function AddressInput(props: AddressInputProps) {
  const {
    value,
    onChange,
    showAddressBook,
    showWallets,
    onlyEVM = false,
    disableLabels = false,
    ...rest
  } = props
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
    } else if (onlyEVM || (newValue as string).startsWith("0x")) {
      setError("Invalid EVM address")
      setSuccess(false)
    } else {
      setSuccess(false)
      setError(null)
    }

    onChange(newValue)
  }

  const endAdornment = success ? (
    <InputAdornment position="end">
      <CheckRounded style={{ color: "green" }} />
    </InputAdornment>
  ) : null

  const displayAddresBook = showAddressBook && addressBook && Object.keys(addressBook).length > 0
  const displayWallets = showWallets && unlabelledWallets && unlabelledWallets.length > 0

  if (displayAddresBook || displayWallets) {
    const options: string[] = []

    if (displayAddresBook) {
      options.push(...Object.keys(addressBook))
    }

    if (displayWallets) {
      options.push(...unlabelledWallets)
    }

    options.sort((a, b) => addressBook[a]?.localeCompare(addressBook[b] ?? "") ?? 0)

    return (
      <Autocomplete
        freeSolo
        disableClearable
        openOnFocus
        options={options}
        filterOptions={(options, state) => {
          const query = state.inputValue.toLowerCase().trim()
          return options.filter(
            (option) =>
              option.toLowerCase().includes(query) ||
              addressBook[option]?.toLowerCase().includes(query)
          )
        }}
        groupBy={(option) => (addressBook[option] ? "Address book" : "My wallets")}
        getOptionLabel={(option) => (disableLabels ? option : addressBook[option] || option)}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option}>
            {addressBook[option] ? (
              <>
                <Typography variant="body2">{addressBook[option]}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: MonoFont, marginLeft: "auto" }}
                >
                  {formatHex(option)}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ fontFamily: MonoFont }} component={Truncate}>
                {option}
              </Typography>
            )}
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            {...rest}
            autoComplete="off"
            placeholder={onlyEVM ? placeholderEvm : placeholderAll}
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
        value={value}
        onChange={(event, newValue) => {
          handleChange(newValue)
        }}
        onInputChange={(event, newInputValue) => {
          handleChange(newInputValue)
        }}
      />
    )
  }

  return (
    <TextField
      autoComplete="off"
      placeholder={onlyEVM ? placeholderEvm : placeholderAll}
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

  return <AddressInput value={value} onChange={onChange} {...rest} disableLabels />
}
