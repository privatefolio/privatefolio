import {
  Box,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import {
  $quoteCurrency,
  $quoteCurrencyMap,
  DEFAULT_CURRENCIES_MAP,
} from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"

export function CurrencySelector() {
  const currency = useStore($quoteCurrency)
  const activeAccount = useStore($activeAccount)

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newCurrency = DEFAULT_CURRENCIES_MAP[event.target.value]
    $quoteCurrencyMap.setKey(activeAccount, newCurrency.id)
  }

  return (
    <Select
      size="small"
      onChange={handleChange}
      defaultValue={currency.id}
      color="secondary"
      sx={{
        "& .MuiSelect-select": {
          paddingX: 2,
          paddingY: 1,
        },
        borderRadius: 5,
        display: { sm: "inline-flex", xs: "none" },
        fontSize: "0.8125rem",
        fontWeight: 500,
        height: 34,
        overflow: "hidden",
      }}
      renderValue={(value) => (
        <Tooltip title="Quote Currency">
          <Box sx={{ margin: -4, padding: 4 }}>{value}</Box>
        </Tooltip>
      )}
    >
      {Object.values(DEFAULT_CURRENCIES_MAP).map(({ id, symbol, name }) => (
        <MenuItem
          key={id}
          value={id}
          disabled={id !== "USD"}
          aria-label={`Change quote currency to ${name}`}
        >
          <ListItemAvatar sx={{ width: 12 }}>{symbol}</ListItemAvatar>
          <ListItemText primary={id} />
        </MenuItem>
      ))}
    </Select>
  )
}
