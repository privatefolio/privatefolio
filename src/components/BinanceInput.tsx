import TextField, { TextFieldProps } from "@mui/material/TextField"
import React, { useState } from "react"

type BinanceInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  onChange: (value: string) => void
  value: string
}

export function BinanceInput({ value, onChange, ...rest }: BinanceInputProps) {
  //   const [error, setError] = useState<string | null>(null)

  //   const isValidAddress = value && isAddress(value)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    // if (newValue && !isAddress(newValue)) {
    //   setError("Invalid address")
    // } else {
    //   setError(null)
    // }
    onChange(newValue)
  }

  return (
    <TextField
      autoComplete="off"
      placeholder="..."
      variant="outlined"
      value={value}
      onChange={handleChange}
      //   error={!!error}
      //   helperText={error}
      multiline
      //   InputProps={{
      //     endAdornment: isValidAddress ? (
      //       <InputAdornment position="end">
      //         <CheckIcon style={{ color: "green" }} />
      //       </InputAdornment>
      //     ) : null,
      //     sx: {
      //       fontFamily: MonoFont,
      //     },
      //   }}
      {...rest}
    />
  )
}

export type BinanceInputUncontrolledProps = Omit<TextFieldProps, "onChange" | "value"> & {
  initialValue?: string
}

export function BinanceInputUncontrolled({
  initialValue = "",
  ...rest
}: BinanceInputUncontrolledProps) {
  const [value, onChange] = useState(initialValue)

  return <BinanceInput value={value} onChange={onChange} {...rest} />
}
