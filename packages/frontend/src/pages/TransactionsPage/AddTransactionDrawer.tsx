import {
  Drawer,
  FormHelperText,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material"
import { DatePicker, TimePicker } from "@mui/x-date-pickers"
import { useStore } from "@nanostores/react"
import { WritableAtom } from "nanostores"
import { enqueueSnackbar } from "notistack"
import { BINANCE_WALLETS } from "privatefolio-backend/src/extensions/connections/binance/binance-settings"
import { BINANCE_PLATFORM_ID } from "privatefolio-backend/src/extensions/utils/binance-utils"
import React, { useCallback, useEffect, useState } from "react"
import { iconMap } from "src/components/ActionBlock"
import { AssetInput } from "src/components/AssetInput"
import { DrawerHeader } from "src/components/DrawerHeader"
import { LoadingButton } from "src/components/LoadingButton"
import { PlatformInput } from "src/components/PlatformInput"
import { SectionTitle } from "src/components/SectionTitle"
import { WalletInput } from "src/components/WalletInput"
import { MANUAL_TX_TYPES, TransactionType } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { formatTicker, getAssetPlatform } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

export function AddTransactionDrawer(props: { atom: WritableAtom<boolean> }) {
  const { atom } = props

  const open = useStore(atom)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const [platformId, setPlatform] = useState<string>("")
  const [type, setType] = useState<TransactionType>("Swap")
  const [walletInput, setWallet] = useState<string>("")
  const [binanceWallet, setBinanceWallet] = useState(BINANCE_WALLETS.spot)

  const [incomingInput, setIncoming] = useState<string>("")
  const [incomingAssetInput, setIncomingAsset] = useState<string>("")

  const [outgoingInput, setOutgoing] = useState<string>("")
  const [outgoingAssetInput, setOutgoingAsset] = useState<string>("")

  const [feeInput, setFee] = useState<string>("")
  const [feeAssetInput, setFeeAsset] = useState<string>("")

  const [notes, setNotes] = useState("")

  const handleTextInputChange = (event) => {
    const newValue = event.target.value.replace("\n", "")
    setNotes(newValue)
  }

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement)

      /**
       * 1. Extract
       */
      const dateAndTime = new Date(formData.get("date") as string)
      const timeValue = formData.get("time") as string
      const [hrs, minutes] = timeValue.split(":")
      dateAndTime.setHours(parseInt(hrs))
      dateAndTime.setMinutes(parseInt(minutes))
      dateAndTime.setSeconds(0)
      const timestamp = dateAndTime.getTime()

      const wallet = platformId === BINANCE_PLATFORM_ID ? binanceWallet : walletInput

      let incoming: string | undefined
      let incomingAsset: string | undefined
      let outgoing: string | undefined
      let outgoingAsset: string | undefined
      let feeAsset = feeAssetInput
      const fee = feeInput

      if (type === "Deposit") {
        incomingAsset = incomingAssetInput
        incoming = incomingInput
      } else if (type === "Withdraw") {
        outgoingAsset = outgoingAssetInput
        outgoing = outgoingInput
      } else {
        incomingAsset = incomingAssetInput
        incoming = incomingInput
        outgoingAsset = outgoingAssetInput
        outgoing = outgoingInput
      }

      // if the assets don't have a platformId (free solo), set them to platformId
      if (incomingAsset && !getAssetPlatform(incomingAsset)) {
        incomingAsset = `${platformId}:${formatTicker(incomingAsset)}`
      }
      if (outgoingAsset && !getAssetPlatform(outgoingAsset)) {
        outgoingAsset = `${platformId}:${formatTicker(outgoingAsset)}`
      }
      if (feeAsset && !getAssetPlatform(feeAsset)) {
        feeAsset = `${platformId}:${formatTicker(feeAsset)}`
      }

      /**
       * 2. Validate
       */
      if (!wallet) return setError("Wallet is required")
      if (incoming && !incomingAsset) return setError("Incoming asset is required")
      if (!incoming && incomingAsset) return setError("Incoming amount is required")
      if (outgoing && !outgoingAsset) return setError("Outgoing asset is required")
      if (!outgoing && outgoingAsset) return setError("Outgoing amount is required")
      if (fee && !feeAsset) return setError("Fee asset is required")
      if (!fee && feeAsset) return setError("Fee amount is required")
      if (type === "Deposit" && !incoming) return setError("Deposit requires a incoming amount")
      if (type === "Withdraw" && !outgoing) return setError("Withdraw requires a outgoing amount")
      if (type === "Swap" && (!incoming || !outgoing))
        return setError("Swap requires a incoming and outgoing amount")

      if (!incomingInput && !outgoingInput && !feeInput) return setError("Fill at least one field")

      /**
       * 3. Submit
       */
      const tx = {
        fee,
        feeAsset,
        incoming,
        incomingAsset,
        metadata: {},
        notes,
        outgoing,
        outgoingAsset,
        platformId,
        timestamp,
        type,
        wallet,
      }
      console.log("New transaction:", tx)

      setError(undefined)
      setLoading(true)
      rpc
        .addTransaction(tx, activeAccount)
        .then(() => {
          atom.set(false)
          enqueueSnackbar("Transaction added", { variant: "success" })
        })
        .catch((error) => {
          console.error(error)
          setError(String(error))
          setLoading(false)
        })
    },
    [
      platformId,
      binanceWallet,
      walletInput,
      feeAssetInput,
      feeInput,
      type,
      incomingInput,
      outgoingInput,
      notes,
      rpc,
      activeAccount,
      incomingAssetInput,
      outgoingAssetInput,
      atom,
    ]
  )

  useEffect(() => {
    if (open) return

    setPlatform("")
    setBinanceWallet(BINANCE_WALLETS.spot)
    setType("Swap")
    setNotes("")
    setLoading(false)
    setError(undefined)
  }, [open])

  return (
    <Drawer open={open} onClose={() => atom.set(false)}>
      <form onSubmit={handleSubmit}>
        <Stack paddingX={2} paddingY={1} gap={2} sx={{ overflowX: "hidden", width: 359 }}>
          <DrawerHeader toggleOpen={() => atom.set(false)}>Add transaction</DrawerHeader>
          <div>
            <SectionTitle>Platform</SectionTitle>
            <PlatformInput
              size="small"
              fullWidth
              value={platformId}
              onChange={setPlatform}
              required
              //
            />
          </div>
          <div>
            <SectionTitle>Wallet</SectionTitle>
            {platformId === BINANCE_PLATFORM_ID ? (
              <Select
                sx={{ height: "40px" }}
                variant="outlined"
                fullWidth
                size="small"
                value={binanceWallet}
                onChange={(event) => setBinanceWallet(event.target.value)}
              >
                {Object.values(BINANCE_WALLETS).map((x) => (
                  <MenuItem key={x} value={x}>
                    <ListItemText primary={x} />
                  </MenuItem>
                ))}
              </Select>
            ) : (
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
              />
            )}
          </div>
          <div>
            <SectionTitle>Type</SectionTitle>
            <Select
              variant="outlined"
              fullWidth
              size="small"
              sx={{ height: "40px" }}
              value={type}
              onChange={(event) => setType(event.target.value as TransactionType)}
            >
              {MANUAL_TX_TYPES.map((x) => {
                const IconComponent = iconMap[x]
                return (
                  <MenuItem key={x} value={x}>
                    <Stack direction="row" alignItems="center">
                      <ListItemAvatar>
                        {IconComponent && <IconComponent sx={{ fontSize: "inherit" }} />}
                      </ListItemAvatar>
                      <ListItemText primary={x} />
                    </Stack>
                  </MenuItem>
                )
              })}
            </Select>
          </div>
          {type !== "Withdraw" ? (
            <Stack direction="row" gap={1} alignItems="flex-end">
              <Stack width="50%">
                <SectionTitle>Incoming</SectionTitle>
                <TextField
                  value={incomingInput}
                  onChange={(event) => setIncoming(event.target.value)}
                  type="text"
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.]?[0-9]*" }}
                  error={error?.includes("Incoming amount")}
                />
              </Stack>
              <Stack width="50%">
                <AssetInput
                  value={incomingAssetInput}
                  onChange={setIncomingAsset}
                  platformId={platformId}
                  fullWidth
                  size="small"
                  error={error?.includes("Incoming asset")}
                />
              </Stack>
            </Stack>
          ) : null}
          {type !== "Deposit" ? (
            <Stack direction="row" gap={1} alignItems="flex-end">
              <Stack width="50%">
                <SectionTitle>Outgoing</SectionTitle>
                <TextField
                  value={outgoingInput}
                  onChange={(event) => setOutgoing(event.target.value)}
                  type="text"
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.]?[0-9]*" }}
                  error={error?.includes("Outgoing amount")}
                />
              </Stack>
              <Stack width="50%">
                <AssetInput
                  value={outgoingAssetInput}
                  onChange={setOutgoingAsset}
                  platformId={platformId}
                  fullWidth
                  size="small"
                  error={error?.includes("Outgoing asset")}
                />
              </Stack>
            </Stack>
          ) : null}
          <Stack direction="row" gap={1} alignItems="flex-end">
            <Stack width="50%">
              <SectionTitle>Fee</SectionTitle>
              <TextField
                value={feeInput}
                onChange={(event) => setFee(event.target.value)}
                type="text"
                autoComplete="off"
                variant="outlined"
                fullWidth
                size="small"
                inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.]?[0-9]*" }}
                error={error?.includes("Fee amount")}
              />
            </Stack>
            <Stack width="50%">
              <AssetInput
                value={feeAssetInput}
                onChange={setFeeAsset}
                platformId={platformId}
                fullWidth
                size="small"
                error={error?.includes("Fee asset")}
              />
            </Stack>
          </Stack>

          <div>
            <SectionTitle>Date</SectionTitle>
            <DatePicker
              name="date"
              defaultValue={new Date()}
              slotProps={{
                // desktopPaper: { transparent: "off" },
                openPickerButton: {
                  color: "secondary",
                  size: "small",
                },
                textField: {
                  fullWidth: true,
                  required: true,
                  size: "small",
                },
              }}
            />
          </div>
          <div>
            <SectionTitle>Time</SectionTitle>
            <TimePicker
              ampm={false}
              name="time"
              defaultValue={new Date()}
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
          </div>
          <div>
            <SectionTitle>Notes</SectionTitle>
            <TextField
              autoComplete="off"
              multiline
              onChange={handleTextInputChange}
              value={notes}
              minRows={3}
              fullWidth
              placeholder="Write a custom note…"
            />
          </div>
          {error && <FormHelperText error>{error}</FormHelperText>}
          <div>
            <LoadingButton
              loading={loading}
              loadingText="Adding transaction…"
              variant="contained"
              type="submit"
            >
              Add Transaction
            </LoadingButton>
          </div>
        </Stack>
      </form>
    </Drawer>
  )
}
