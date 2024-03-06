import { MenuItem, Select } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import {
  $baseCurrency,
  $baseCurrencyMap,
  DEFAULT_CURRENCIES_MAP,
} from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"

export function CurrencySelector() {
  const currency = useStore($baseCurrency)
  const handleChange = (event) => {
    const newCurrency = DEFAULT_CURRENCIES_MAP[event.target.value]
    $baseCurrencyMap.setKey($activeAccount.get(), newCurrency.id)
  }

  return (
    <Select
      size="small"
      onChange={handleChange}
      defaultValue={currency.id}
      sx={{
        "& .MuiSelect-select": {
          paddingY: 0.5,
        },
        "& .MuiSvgIcon-root": {
          color: "text.secondary",
        },
        borderRadius: 2,

        color: "text.secondary",
        fontSize: "0.875rem",
      }}
    >
      {Object.values(DEFAULT_CURRENCIES_MAP).map((x) => (
        <MenuItem key={x.id} value={x.id}>
          {x.id}
        </MenuItem>
      ))}
    </Select>
  )
}
