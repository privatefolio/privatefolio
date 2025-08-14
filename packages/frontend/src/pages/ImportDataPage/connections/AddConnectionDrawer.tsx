import {
  Checkbox,
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
import { PaymentPlanChip } from "src/components/PaymentPlanChip"
import { PlatformAvatar } from "src/components/PlatformAvatar"
import { PAYMENT_PLANS } from "src/settings"
import { $activeAccount } from "src/stores/account-store"
import { $addressBook, addWalletToAddressBook } from "src/stores/metadata-store"
import { MonoFont } from "src/theme"
import { logAndReportError } from "src/utils/error-utils"
import { asUTC } from "src/utils/formatting-utils"
import { randomUUID, resolveUrl } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { SectionTitle } from "../../../components/SectionTitle"
import { WalletInput } from "../../../components/WalletInput"
import { BinanceConnectionOptions, ConnectionOptions, RichExtension } from "../../../interfaces"
import { $debugMode } from "../../../stores/app-store"

type AddConnectionDrawerProps = {
  atom: WritableAtom<boolean>
  initialExtensionId?: string
  initialPlatformId?: string
  onSuccess?: (groupId: string) => void
}

export function AddConnectionDrawer(props: AddConnectionDrawerProps) {
  const { atom, initialPlatformId, initialExtensionId, onSuccess } = props

  const open = useStore(atom)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const debugMode = useStore($debugMode)
  const addressBook = useStore($addressBook)

  const [walletInput, setWallet] = useState<string>("")

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
    if (open) {
      // Set initial values when drawer opens
      if (initialExtensionId) {
        setExtensionId(initialExtensionId)
      }
      if (initialPlatformId) {
        setPlatformId(initialPlatformId)
      }
      // Clear wallet input when opening with new values
      setWallet("")
      return
    }

    // Reset to defaults when drawer closes
    setExtensionId(etherscanConnExtension)
    setPlatformId("all")
    setWallet("")
    setState({
      coinFutures: false,
      crossMargin: true,
      isolatedMargin: true,
      spot: true,
      usdFutures: false,
    })
    setLoading(false)
    setError(undefined)
  }, [open, initialExtensionId, initialPlatformId])

  const handleWalletsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...binanceWallets,
      [event.target.name]: event.target.checked,
    })
  }
  const walletsError = Object.values(binanceWallets).filter((x) => x).length === 0

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement)

      /**
       * 1. Extract
       */
      const wallet = walletInput
      const apiKey = formData.get("apiKey") as string
      const apiSecret = formData.get("apiSecret") as string
      const walletLabel = formData.get("walletLabel") as string
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
        const isValidAddress = wallet && isAddress(wallet)
        if (!isValidAddress) {
          setError("Invalid wallet")
          return
        }
        if (walletLabel) {
          await addWalletToAddressBook(rpc, activeAccount, wallet, walletLabel)
        }
        //
      } else if (extension.id === binanceConnExtension) {
        if (apiKey.length === 0) {
          setError("API key is required")
          return
        }
        if (apiSecret.length === 0) {
          setError("API secret is required")
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
      // console.log({
      //   address: wallet,
      //   apiKey,
      //   extensionId,
      //   options,
      //   platformId,
      // })
      // return
      setError(undefined)
      setLoading(true)
      try {
        const platformIds = platformId === "all" ? extension.platformIds! : [platformId]
        const groupId = randomUUID()

        const connections = await rpc.upsertConnections(
          activeAccount,
          platformIds.map((platformId) => ({
            address: wallet,
            apiKey,
            apiSecret,
            extensionId,
            options,
            platformId,
          }))
        )
        for (const connection of connections) {
          await rpc.enqueueSyncConnection(
            activeAccount,
            "user",
            connection.id,
            debugMode,
            undefined,
            groupId
          )
        }
        atom.set(false)
        onSuccess?.(groupId)
        enqueueSnackbar(
          `${platformIds.length > 1 ? "Connections" : "Connection"} added, syncing...`,
          { variant: "success" }
        )
      } catch (error) {
        logAndReportError(error, "Failed to add connection")
        setError(String(error))
        setLoading(false)
      }
    },
    [
      walletInput,
      extension,
      walletsError,
      binanceWallets,
      platformId,
      atom,
      onSuccess,
      rpc,
      activeAccount,
      extensionId,
      debugMode,
    ]
  )

  if (extensions.length === 0) return null

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
                <MenuItem key={x.id} value={x.id}>
                  <Stack direction="row" alignItems="center">
                    <ListItemAvatar>
                      <ExtensionAvatar
                        src={x.extensionLogoUrl}
                        alt={x.extensionName}
                        size="small"
                      />
                    </ListItemAvatar>
                    <ListItemText primary={x.extensionName} />
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
                <WalletInput
                  value={walletInput}
                  onChange={setWallet}
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                  showAddressBook
                  showWallets
                  onlyEVM
                />
              </div>
              {walletInput && isAddress(walletInput) && !addressBook[walletInput] && (
                <div>
                  <SectionTitle optional>Wallet label</SectionTitle>
                  <TextField
                    name="walletLabel"
                    autoComplete="off"
                    variant="outlined"
                    fullWidth
                    size="small"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <SectionTitle>API key</SectionTitle>
                <TextField
                  name="apiKey"
                  autoFocus
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                  multiline
                  InputProps={{ sx: { fontFamily: MonoFont } }}
                />
              </div>
              <div>
                <SectionTitle>API secret</SectionTitle>
                <TextField
                  name="apiSecret"
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  required
                  multiline
                  InputProps={{ sx: { fontFamily: MonoFont } }}
                />
              </div>
              <FormControl sx={{ color: "var(--mui-palette-text-secondary)" }} error={walletsError}>
                <SectionTitle>Wallets</SectionTitle>
                <Stack paddingX={0.5}>
                  {Object.keys(BINANCE_WALLETS).map((walletId) => (
                    <Stack key={walletId} direction="row" alignItems="center">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={binanceWallets[walletId as BinanceWalletId]}
                            color="secondary"
                            name={walletId}
                            onChange={handleWalletsChange}
                            disabled={walletId === "coinFutures" || walletId === "usdFutures"}
                          />
                        }
                        label={BINANCE_WALLETS[walletId as BinanceWalletId].replace("Binance ", "")}
                      />
                      {(walletId === "coinFutures" || walletId === "usdFutures") && (
                        <PaymentPlanChip plan={PAYMENT_PLANS.premium} includeLink />
                      )}
                    </Stack>
                  ))}
                  {walletsError ? (
                    <FormHelperText>You need to choose at least one</FormHelperText>
                  ) : null}
                </Stack>
              </FormControl>
              <div>
                <SectionTitle optional>Import range</SectionTitle>
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
            </>
          )}
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
