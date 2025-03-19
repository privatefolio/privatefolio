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
import { DatePicker } from "@mui/x-date-pickers"
import { isAddress } from "ethers"
import React, { useCallback, useState } from "react"
import { $activeAccount } from "src/stores/account-store"
import { MonoFont } from "src/theme"
import { isEvmPlatform } from "src/utils/assets-utils"
import { asUTC } from "src/utils/formatting-utils"
import { isProduction } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { AddressInput } from "../../../components/AddressInput"
import { SectionTitle } from "../../../components/SectionTitle"
import { BinanceConnectionOptions, ConnectionOptions, PlatformId } from "../../../interfaces"
import {
  BINANCE_WALLET_LABELS,
  BinanceWalletId,
  CONNECTIONS,
  PLATFORMS_META,
} from "../../../settings"
import { $debugMode, PopoverToggleProps } from "../../../stores/app-store"

export function ConnectionDrawer({ open, toggleOpen, ...rest }: DrawerProps & PopoverToggleProps) {
  const [loading, setLoading] = useState(false)

  const [platform, setPlatform] = useState<PlatformId>("ethereum")
  const [binanceWallets, setState] = useState({
    coinFutures: false,
    crossMargin: true,
    isolatedMargin: true,
    spot: true,
    usdFutures: false,
  })
  const handleWalletsChange = (event) => {
    setState({
      ...binanceWallets,
      [event.target.name]: event.target.checked,
    })
  }
  const { coinFutures, crossMargin, isolatedMargin, spot, usdFutures } = binanceWallets
  const walletsError =
    [spot, crossMargin, isolatedMargin, coinFutures, usdFutures].filter((v) => v).length === 0

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const formData = new FormData(event.target as HTMLFormElement)

      /**
       * 1. Extract
       */
      const address = formData.get("walletAddr") as string
      const key = formData.get("apiKey") as string
      const secret = formData.get("secret") as string
      const label = formData.get("label") as string
      const sinceLimit = formData.get("sinceLimit")
        ? asUTC(new Date(formData.get("sinceLimit") as string))
        : undefined
      const untilLimit = formData.get("untilLimit")
        ? asUTC(new Date(formData.get("untilLimit") as string))
        : undefined
      const options: ConnectionOptions = { sinceLimit, untilLimit }

      // TODO: move binanceWallets to an uncontrolled component
      // const isolated = !!formData.get("isolated")
      // const usd = !!formData.get("usd")

      /**
       * 2. Validate
       */
      if (isEvmPlatform(platform)) {
        const isValidAddress = address && isAddress(address)
        if (!isValidAddress) return
        //
      } else if (platform === "binance") {
        if (key.length === 0 || secret.length === 0 || walletsError) return
        ;(options as BinanceConnectionOptions).wallets = binanceWallets
        //
      }

      setLoading(true)
      $rpc
        .get()
        .upsertConnection($activeAccount.get(), {
          address,
          key,
          label,
          options,
          platform,
          secret,
        })
        .then((connection) => {
          toggleOpen()
          $rpc
            .get()
            .enqueueSyncConnection($activeAccount.get(), "user", connection.id, $debugMode.get())
        })
        .catch(() => {
          setLoading(false)
        })
    },
    [binanceWallets, platform, toggleOpen, walletsError]
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
              {CONNECTIONS.map((x) => (
                <MenuItem
                  key={x}
                  value={x}
                  disabled={PLATFORMS_META[x].name === "Binance" && isProduction}
                >
                  <ListItemText primary={PLATFORMS_META[x].name} />
                </MenuItem>
              ))}
            </Select>
          </div>
          {platform !== "binance" ? (
            <div>
              <SectionTitle>Wallet</SectionTitle>
              <AddressInput
                name="walletAddr"
                autoComplete="off"
                autoFocus
                variant="outlined"
                fullWidth
                size="small"
                required
              />
            </div>
          ) : (
            <>
              <div>
                <SectionTitle>API Key</SectionTitle>
                <TextField
                  name="apiKey"
                  autoFocus
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                  multiline
                  InputProps={{
                    sx: {
                      fontFamily: MonoFont,
                    },
                  }}
                />
              </div>
              <div>
                <SectionTitle>Secret</SectionTitle>
                <TextField
                  name="secret"
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                  multiline
                  InputProps={{
                    sx: {
                      fontFamily: MonoFont,
                    },
                  }}
                />
              </div>
              <FormControl sx={{ color: "var(--mui-palette-text-secondary)" }} error={walletsError}>
                <SectionTitle>Wallets</SectionTitle>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={spot}
                      color="secondary"
                      name={"spot" satisfies BinanceWalletId}
                      onChange={handleWalletsChange}
                    />
                  }
                  label={BINANCE_WALLET_LABELS.spot}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={crossMargin}
                      color="secondary"
                      name={"crossMargin" satisfies BinanceWalletId}
                      onChange={handleWalletsChange}
                    />
                  }
                  label={BINANCE_WALLET_LABELS.crossMargin}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isolatedMargin}
                      color="secondary"
                      name={"isolatedMargin" satisfies BinanceWalletId}
                      onChange={handleWalletsChange}
                    />
                  }
                  label={BINANCE_WALLET_LABELS.isolatedMargin}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={coinFutures}
                      color="secondary"
                      name={"coinFutures" satisfies BinanceWalletId}
                      onChange={handleWalletsChange}
                    />
                  }
                  label={BINANCE_WALLET_LABELS.coinFutures}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={usdFutures}
                      color="secondary"
                      name={"usdFutures" satisfies BinanceWalletId}
                      onChange={handleWalletsChange}
                    />
                  }
                  label={BINANCE_WALLET_LABELS.usdFutures}
                />
                {walletsError ? (
                  <FormHelperText>You need to choose at least one</FormHelperText>
                ) : null}
              </FormControl>
            </>
          )}
          <div>
            <SectionTitle>
              Import range <Typography variant="caption">(optional)</Typography>
            </SectionTitle>
            <Stack gap={1.5} marginTop={1.5}>
              <DatePicker
                name="sinceLimit"
                label="Start date"
                slotProps={{
                  openPickerButton: {
                    color: "secondary",
                    size: "small",
                  },
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
              <DatePicker
                name="untilLimit"
                label="End date"
                slotProps={{
                  openPickerButton: {
                    color: "secondary",
                    size: "small",
                  },
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </Stack>
          </div>
          <div>
            <SectionTitle>
              Label <Typography variant="caption">(optional)</Typography>
            </SectionTitle>
            <TextField name="label" autoComplete="off" variant="outlined" fullWidth size="small" />
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
