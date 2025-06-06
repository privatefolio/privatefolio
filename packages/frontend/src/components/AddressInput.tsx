import { Check } from "@mui/icons-material"
import InputAdornment from "@mui/material/InputAdornment"
import TextField, { TextFieldProps } from "@mui/material/TextField"
import { getAddress, isAddress } from "ethers"
import React, { useState } from "react"

import { MonoFont } from "../theme"

type AddressInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  onChange?: (value: string) => void
  value?: string
}

export function AddressInput({ value, onChange, ...rest }: AddressInputProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = event.target.value

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

  return (
    <TextField
      autoComplete="off"
      placeholder="0x000…"
      variant="outlined"
      value={value}
      onChange={handleChange}
      error={!!error}
      helperText={error}
      multiline
      InputProps={{
        endAdornment: success ? (
          <InputAdornment position="end">
            <Check style={{ color: "green" }} />
          </InputAdornment>
        ) : null,
        sx: {
          fontFamily: MonoFont,
        },
      }}
      {...rest}
    />
  )
}

export type AddressInputUncontrolledProps = Omit<TextFieldProps, "onChange" | "value"> & {
  initialValue?: string
}

export function AddressInputUncontrolled({
  initialValue = "",
  ...rest
}: AddressInputUncontrolledProps) {
  const [value, onChange] = useState(initialValue)

  return <AddressInput value={value} onChange={onChange} {...rest} />
}
