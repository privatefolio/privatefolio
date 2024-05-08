import { CloseRounded } from "@mui/icons-material"
import { LoadingButton } from "@mui/lab"
import {
  Checkbox,
  Drawer,
  DrawerProps,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { isAddress } from "ethers"
import React, { useCallback, useEffect, useState } from "react"
import { BinanceInput } from "src/components/BinanceInput"
import { $activeAccount } from "src/stores/account-store"
import { enqueueSyncConnection, handleAuditLogChange } from "src/utils/common-tasks"
import { isProduction } from "src/utils/utils"
import { clancy } from "src/workers/remotes"

import { AddressInput } from "../../../components/AddressInput"
import { SectionTitle } from "../../../components/SectionTitle"
import { PlatformId } from "../../../interfaces"
import { CONNECTIONS, PLATFORMS_META } from "../../../settings"
import { PopoverToggleProps } from "../../../stores/app-store"

export function ConnectionDrawer({ open, toggleOpen, ...rest }: DrawerProps & PopoverToggleProps) {
  const [loading, setLoading] = useState(false)

  const [label, setLabel] = useState("")
  const [address, setAddress] = useState("")
  const [key, Setkey] = useState("")
  const [secret, setSecret] = useState("")
  const [platform, setPlatform] = useState<PlatformId>("ethereum")

  useEffect(() => {
    setLoading(false)
    setAddress("")
    Setkey("")
    setSecret("")
    setPlatform("ethereum")
  }, [open])

  const [state, setState] = React.useState({
    coin: false,
    cross: false,
    isolated: false,
    spot: true,
    usd: false,
  })
  const handleChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    })
  }
  const { spot, cross, isolated, coin, usd } = state
  const binanceWallets = { coin, cross, isolated, spot, usd }
  const error = [spot, cross, isolated, coin, usd].filter((v) => v).length === 0

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (platform === "ethereum") {
        const isValidAddress = address && isAddress(address)
        if (!isValidAddress) return
      } else {
        if (key.length === 0 || secret.length === 0 || error) return
      }

      setLoading(true)

      clancy
        .addConnection(
          { address, binanceWallets, key, label, platform, secret },
          $activeAccount.get()
        )
        .then((connection) => {
          toggleOpen()
          enqueueSyncConnection(connection)
          handleAuditLogChange()
        })
        .catch(() => {
          setLoading(false)
        })
    },
    [address, binanceWallets, key, secret, platform, label, toggleOpen]
  )

  return (
    <Drawer open={open} onClose={toggleOpen} {...rest}>
      <form onSubmit={handleSubmit}>
        <Stack paddingX={2} paddingY={1} gap={4} sx={{ overflowX: "hidden", width: 359 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" letterSpacing="0.025rem">
              Add connection
            </Typography>
            <IconButton onClick={toggleOpen} edge="end" color="secondary" aria-label="Close dialog">
              <CloseRounded fontSize="small" />
            </IconButton>
          </Stack>
          <div>
            <SectionTitle>Platform</SectionTitle>
            <Select
              variant="outlined"
              fullWidth
              size="small"
              value={platform}
              onChange={(event) => setPlatform(event.target.value as PlatformId)}
            >
              {Object.keys(CONNECTIONS).map((x) =>
                PLATFORMS_META[x].name === "Binance" && !isProduction ? (
                  <MenuItem key={x} value={x} disabled>
                    <ListItemText primary={PLATFORMS_META[x].name} />
                  </MenuItem>
                ) : (
                  <MenuItem key={x} value={x}>
                    <ListItemText primary={PLATFORMS_META[x].name} />
                  </MenuItem>
                )
              )}
            </Select>
          </div>
          {platform === "ethereum" ? (
            <div>
              <SectionTitle>Address *</SectionTitle>
              <AddressInput
                autoComplete="off"
                autoFocus
                value={address}
                onChange={setAddress}
                variant="outlined"
                fullWidth
                size="small"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <SectionTitle>API key *</SectionTitle>
                <BinanceInput
                  autoComplete="off"
                  autoFocus
                  value={key}
                  onChange={Setkey}
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                />
              </div>
              <div>
                <SectionTitle>Secret *</SectionTitle>
                <BinanceInput
                  autoComplete="off"
                  autoFocus
                  value={secret}
                  onChange={setSecret}
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                />
              </div>
              <FormControl sx={{ color: "var(--mui-palette-text-secondary)" }} error={error}>
                <SectionTitle>Wallets </SectionTitle>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={spot}
                      color="secondary"
                      name="spot"
                      onChange={handleChange}
                    />
                  }
                  label="Spot"
                />
                <FormControlLabel
                  sx={{ display: "none" }}
                  control={
                    <Checkbox
                      checked={cross}
                      color="secondary"
                      name="cross"
                      onChange={handleChange}
                    />
                  }
                  label="Cross Margin"
                />
                <FormControlLabel
                  sx={{ display: "none" }}
                  control={
                    <Checkbox
                      checked={isolated}
                      color="secondary"
                      name="isolated"
                      onChange={handleChange}
                    />
                  }
                  label="Isolated Margin"
                />
                <FormControlLabel
                  sx={{ display: "none" }}
                  control={
                    <Checkbox
                      checked={coin}
                      color="secondary"
                      name="coin"
                      onChange={handleChange}
                    />
                  }
                  label="Coin-M Futures"
                />
                <FormControlLabel
                  sx={{ display: "none" }}
                  control={
                    <Checkbox checked={usd} color="secondary" name="usd" onChange={handleChange} />
                  }
                  label="USD-M Futures"
                />
                {error ? <FormHelperText>You need to choose at least one</FormHelperText> : null}
              </FormControl>
            </>
          )}
          <div>
            <SectionTitle>Label</SectionTitle>
            <TextField
              autoComplete="off"
              variant="outlined"
              fullWidth
              size="small"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>

          <div>
            <LoadingButton variant="contained" type="submit" loading={loading}>
              Add connection
            </LoadingButton>
          </div>
        </Stack>
      </form>
    </Drawer>
  )
}
