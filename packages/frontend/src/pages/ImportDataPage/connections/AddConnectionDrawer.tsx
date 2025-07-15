import {
  Checkbox,
  Chip,
  Drawer,
  FormControl,
  FormControlLabel,
  FormHelperText,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers"
import { useStore } from "@nanostores/react"
import { isAddress } from "ethers"
import { WritableAtom } from "nanostores"
import { enqueueSnackbar } from "notistack"
import {
  BINANCE_WALLETS,
  binanceConnExtension,
  BinanceWalletId,
} from "privatefolio-backend/src/extensions/connections/binance/binance-settings"
import { etherscanConnExtension } from "privatefolio-backend/src/extensions/connections/etherscan/etherscan-settings"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { DrawerHeader } from "src/components/DrawerHeader"
import { ExtensionAvatar } from "src/components/ExtensionAvatar"
import { LoadingButton } from "src/components/LoadingButton"
import { PlatformAvatar } from "src/components/PlatformAvatar"
import { $activeAccount } from "src/stores/account-store"
import { MonoFont } from "src/theme"
import { asUTC } from "src/utils/formatting-utils"
import { isProduction, resolveUrl } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { AddressInput } from "../../../components/AddressInput"
import { SectionTitle } from "../../../components/SectionTitle"
import { BinanceConnectionOptions, ConnectionOptions, RichExtension } from "../../../interfaces"
import { $debugMode } from "../../../stores/app-store"

export function AddConnectionDrawer(props: { atom: WritableAtom<boolean> }) {
  const { atom } = props

  const open = useStore(atom)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const debugMode = useStore($debugMode)

  const [extensionId, setExtensionId] = useState<string>(etherscanConnExtension)
  const [extensions, setExtensions] = useState<RichExtension[]>([])

  useEffect(() => {
    rpc.getExtensionsByType("connection").then(setExtensions)
  }, [rpc])

  const extension = useMemo(
    () => extensions.find((x) => x.id === extensionId),
    [extensionId, extensions]
  )

  const [platformId, setPlatformId] = useState<string>("all")
  const [binanceWallets, setState] = useState({
    coinFutures: false,
    crossMargin: true,
    isolatedMargin: true,
    spot: true,
    usdFutures: false,
  })

  useEffect(() => {
    if (open) return

    setExtensionId(etherscanConnExtension)
    setPlatformId("all")
    setState({
      coinFutures: false,
      crossMargin: true,
      isolatedMargin: true,
      spot: true,
      usdFutures: false,
    })
    setLoading(false)
    setError(undefined)
  }, [open])

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
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement)

      /**
       * 1. Extract
       */
      const address = formData.get("walletAddr") as string
      const apiKey = formData.get("apiKey") as string
      const apiSecret = formData.get("secret") as string
      // const label = formData.get("label") as string // TODO5 rethink
      const sinceLimit = formData.get("sinceLimit")
        ? asUTC(new Date(formData.get("sinceLimit") as string))
        : undefined
      const untilLimit = formData.get("untilLimit")
        ? asUTC(new Date(formData.get("untilLimit") as string))
        : undefined
      const options: ConnectionOptions = { sinceLimit, untilLimit }

      // TODO5: move binanceWallets to an uncontrolled component
      // const isolated = !!formData.get("isolated")
      // const usd = !!formData.get("usd")

      /**
       * 2. Validate
       */
      if (!extension) {
        setError("Extension not found")
        return
      }
      if (extension.id === etherscanConnExtension) {
        const isValidAddress = address && isAddress(address)
        if (!isValidAddress) {
          setError("Invalid wallet address")
          return
        }
        //
      } else if (extension.id === binanceConnExtension) {
        if (apiKey.length === 0) {
          setError("API key is required")
          return
        }
        if (apiSecret.length === 0) {
          setError("Secret is required")
          return
        }
        if (walletsError) {
          setError("You need to choose at least one wallet")
          return
        }
        ;(options as BinanceConnectionOptions).wallets = binanceWallets
        //
      }

      /**
       * 3. Submit
       */
      setLoading(true)
      try {
        const platformIds = platformId === "all" ? extension.platformIds! : [platformId]

        await Promise.all(
          platformIds.map(async (platformId) => {
            const connection = await rpc.upsertConnection(activeAccount, {
              address,
              apiKey,
              apiSecret,
              extensionId,
              options,
              platformId,
            })
            await rpc.enqueueSyncConnection(activeAccount, "user", connection.id, debugMode)
          })
        )

        atom.set(false)
        enqueueSnackbar(
          `${platformIds.length > 1 ? "Connections" : "Connection"} added, syncing...`,
          { variant: "success" }
        )
      } catch (error) {
        console.error(error)
        setError(String(error))
        setLoading(false)
      }
    },
    [
      binanceWallets,
      extensionId,
      platformId,
      walletsError,
      atom,
      rpc,
      activeAccount,
      debugMode,
      extension,
    ]
  )

  return (
    <Drawer open={open} onClose={() => atom.set(false)}>
      <form onSubmit={handleSubmit}>
        <Stack paddingX={2} paddingY={1} gap={2} sx={{ overflowX: "hidden", width: 359 }}>
          <DrawerHeader toggleOpen={() => atom.set(false)}>Add connection</DrawerHeader>
          <div>
            <SectionTitle>Extension</SectionTitle>
            <Select
              variant="outlined"
              fullWidth
              size="small"
              value={extensionId}
              onChange={(event) => setExtensionId(event.target.value)}
            >
              {extensions.map((x) => (
                <MenuItem
                  key={x.id}
                  value={x.id}
                  disabled={x.id === binanceConnExtension && isProduction}
                >
                  <Stack direction="row" alignItems="center">
                    <ListItemAvatar>
                      <ExtensionAvatar
                        src={x.extensionLogoUrl}
                        alt={x.extensionName}
                        size="small"
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <>
                          {x.extensionName}{" "}
                          {x.id === binanceConnExtension && (
                            <Chip
                              size="small"
                              sx={{ fontSize: "0.625rem", height: 16 }}
                              label="Coming soon"
                            />
                          )}
                        </>
                      }
                    />
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </div>
          {extensionId !== binanceConnExtension ? (
            <>
              <div>
                <SectionTitle>Platform</SectionTitle>
                <Select
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={platformId}
                  onChange={(event) => setPlatformId(event.target.value)}
                >
                  <MenuItem value="all">
                    <Stack direction="row" alignItems="center">
                      <ListItemAvatar>
                        <PlatformAvatar
                          src={resolveUrl("$STATIC_ASSETS/extensions/all-platforms.svg")}
                          alt="All platforms"
                          size="small"
                        />
                      </ListItemAvatar>
                      <ListItemText primary="All" />
                    </Stack>
                  </MenuItem>
                  {extension?.platforms?.map((x) => (
                    <MenuItem key={x.id} value={x.id}>
                      <Stack direction="row" alignItems="center">
                        <ListItemAvatar>
                          <PlatformAvatar src={x.image} alt={x.name} size="small" />
                        </ListItemAvatar>
                        <ListItemText primary={x.name} />
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </div>
              <div>
                <SectionTitle>Wallet</SectionTitle>
                <AddressInput
                  name="walletAddr"
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                  showAddressBook
                  showWallets
                />
              </div>
            </>
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
              <div>
                <SectionTitle>
                  Label <Typography variant="caption">(optional)</Typography>
                </SectionTitle>
                <TextField
                  name="label"
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
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
                  label={BINANCE_WALLETS.spot}
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
                  label={BINANCE_WALLETS.crossMargin}
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
                  label={BINANCE_WALLETS.isolatedMargin}
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
                  label={BINANCE_WALLETS.coinFutures}
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
                  label={BINANCE_WALLETS.usdFutures}
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
          {error && <FormHelperText error>{error}</FormHelperText>}
          <div>
            <LoadingButton
              loading={loading}
              loadingText="Adding connection…"
              variant="contained"
              type="submit"
            >
              Add connection
            </LoadingButton>
          </div>
        </Stack>
      </form>
    </Drawer>
  )
}
