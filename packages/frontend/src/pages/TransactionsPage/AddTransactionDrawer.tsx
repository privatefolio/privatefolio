import {
  Autocomplete,
  Box,
  Drawer,
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
import { BINANCE_PLATFORM_ID } from "privatefolio-backend/src/extensions/utils/binance-utils"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { AddressInput } from "src/components/AddressInput"
import { AssetBlock } from "src/components/AssetBlock"
import { DrawerHeader } from "src/components/DrawerHeader"
import { LoadingButton } from "src/components/LoadingButton"
import { SectionTitle } from "src/components/SectionTitle"
import { MANUAL_TX_TYPES, TransactionType } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $assetMap, $platformMap } from "src/stores/metadata-store"
import { formatTicker, getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

import { PlatformAvatar } from "../../components/PlatformAvatar"

export function AddTransactionDrawer(props: { atom: WritableAtom<boolean> }) {
  const { atom } = props

  const open = useStore(atom)

  const [loading, setLoading] = useState(false)

  const [platformId, setPlatform] = useState<string>("")
  const [type, setType] = useState<TransactionType>("Swap")
  const [binanceWallet, setBinanceWallet] = useState("Spot")

  const [notes, setNotes] = useState("")

  const assetMap = useStore($assetMap)

  const assetsIds: string[] = useMemo(
    () => Object.keys(assetMap).filter((x) => getAssetPlatform(x) === platformId),
    [assetMap, platformId]
  )

  const handleTextInputChange = (event) => {
    const newValue = event.target.value.replace("\n", "")
    setNotes(newValue)
  }

  const binanceWalletsOptions = [
    "Binance Spot",
    "Binance Cross Margin",
    "Binance Isolated Margin",
    "Binance Coin-M Futures",
    "Binance USD-M Futures",
  ]

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement)

      const dateAndTime = new Date(formData.get("date") as string)
      const timeValue = formData.get("time") as string
      const [hrs, minutes] = timeValue.split(":")
      dateAndTime.setHours(parseInt(hrs))
      dateAndTime.setMinutes(parseInt(minutes))
      dateAndTime.setSeconds(0)
      const timestamp = dateAndTime.getTime()

      const wallet =
        platformId === BINANCE_PLATFORM_ID ? binanceWallet : (formData.get("walletAddr") as string)

      const incoming = formData.get("incoming") as string
      const outgoing = formData.get("outgoing") as string
      const fee = formData.get("fee") as string

      let incomingAsset = formData.get("incomingAsset") as string
      let outgoingAsset = formData.get("outgoingAsset") as string
      let feeAsset = formData.get("feeAsset") as string

      const incomingAssetTicker = incomingAsset ? getAssetTicker(incomingAsset) : ""
      const outgoingAssetTicker = outgoingAsset ? getAssetTicker(outgoingAsset) : ""
      const feeAssetTicker = feeAsset ? getAssetTicker(feeAsset) : ""

      incomingAsset =
        assetsIds.find((assetId) => getAssetTicker(assetId) === incomingAssetTicker) || ""
      outgoingAsset =
        assetsIds.find((assetId) => getAssetTicker(assetId) === outgoingAssetTicker) || ""
      feeAsset = assetsIds.find((assetId) => getAssetTicker(assetId) === feeAssetTicker) || ""

      // if assets don't have a platforms (free solo), set it to platformId
      if (incomingAsset && !getAssetPlatform(incomingAsset)) {
        incomingAsset = `${platformId}:${formatTicker(incomingAsset)}`
      }
      if (outgoingAsset && !getAssetPlatform(outgoingAsset)) {
        outgoingAsset = `${platformId}:${formatTicker(outgoingAsset)}`
      }
      if (feeAsset && !getAssetPlatform(feeAsset)) {
        feeAsset = `${platformId}:${formatTicker(feeAsset)}`
      }

      if (!incoming && !outgoing && !fee) return

      setLoading(true)
      rpc
        .addTransaction(
          {
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
          },
          activeAccount
        )
        .then(() => {
          atom.set(false)
          enqueueSnackbar("Transaction added", { variant: "success" })
        })
        .catch((error) => {
          enqueueSnackbar(error.message, { variant: "error" })
          setLoading(false)
        })
    },
    [atom, platformId, binanceWallet, type, notes, rpc, activeAccount, assetsIds]
  )

  const platformMap = useStore($platformMap)
  const platforms = useMemo(() => Object.values(platformMap), [platformMap])

  useEffect(() => {
    if (open) return

    setPlatform(platforms[0]?.id || "")
    setBinanceWallet("Spot")
    setType("Swap")
    setNotes("")
    setLoading(false)
  }, [open, platforms])

  const renderOption = (props, option) => (
    <Box component="li" {...props} key={option}>
      <AssetBlock id={option} variant="tablecell" href={undefined} hideTooltip />
    </Box>
  )

  const getOptionLabel = (option: string) => (!option ? "" : getAssetTicker(option))

  return (
    <Drawer open={open} onClose={() => atom.set(false)}>
      <form onSubmit={handleSubmit}>
        <Stack paddingX={2} paddingY={1} gap={2} sx={{ overflowX: "hidden", width: 359 }}>
          <DrawerHeader toggleOpen={() => atom.set(false)}>Add transaction</DrawerHeader>
          <div>
            <SectionTitle>Platform</SectionTitle>
            <Select
              variant="outlined"
              fullWidth
              value={platformId}
              onChange={(event) => setPlatform(event.target.value)}
            >
              {platforms?.map((x) => (
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
            {platformId === BINANCE_PLATFORM_ID ? (
              <Select
                sx={{ height: "40px" }}
                variant="outlined"
                fullWidth
                size="small"
                value={binanceWallet}
                onChange={(event) => setBinanceWallet(event.target.value)}
              >
                {binanceWalletsOptions.map((x) => (
                  <MenuItem key={x} value={x}>
                    <ListItemText primary={x} />
                  </MenuItem>
                ))}
              </Select>
            ) : (
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
              {MANUAL_TX_TYPES.map((x) => (
                <MenuItem key={x} value={x}>
                  <ListItemText primary={x} />
                </MenuItem>
              ))}
            </Select>
          </div>
          {type !== "Withdraw" ? (
            <Stack direction="row" gap={1} alignItems="flex-end">
              <Stack width="50%">
                <SectionTitle>Incoming</SectionTitle>
                <TextField
                  name="incoming"
                  type="text"
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.]?[0-9]*" }}
                />
              </Stack>
              <Stack width="50%">
                <Autocomplete
                  freeSolo
                  disableClearable
                  openOnFocus
                  fullWidth
                  options={assetsIds}
                  renderOption={renderOption}
                  getOptionLabel={getOptionLabel}
                  size="small"
                  renderInput={(params) => <TextField name="incomingAsset" {...params} required />}
                />
              </Stack>
            </Stack>
          ) : null}
          {type !== "Deposit" ? (
            <Stack direction="row" gap={1} alignItems="flex-end">
              <Stack width="50%">
                <SectionTitle>Outgoing</SectionTitle>
                <TextField
                  name="outgoing"
                  type="text"
                  autoComplete="off"
                  variant="outlined"
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.]?[0-9]*" }}
                />
              </Stack>
              <Stack width="50%">
                <Autocomplete
                  freeSolo
                  disableClearable
                  openOnFocus
                  fullWidth
                  options={assetsIds}
                  renderOption={renderOption}
                  getOptionLabel={getOptionLabel}
                  size="small"
                  renderInput={(params) => <TextField name="outgoingAsset" {...params} required />}
                />
              </Stack>
            </Stack>
          ) : null}
          <Stack direction="row" gap={1} alignItems="flex-end">
            <Stack width="50%">
              <SectionTitle>Fee</SectionTitle>
              <TextField
                name="fee"
                type="text"
                autoComplete="off"
                variant="outlined"
                fullWidth
                size="small"
                inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.]?[0-9]*" }}
              />
            </Stack>
            <Stack width="50%">
              <Autocomplete
                freeSolo
                disableClearable
                openOnFocus
                fullWidth
                options={assetsIds}
                renderOption={renderOption}
                getOptionLabel={getOptionLabel}
                size="small"
                renderInput={(params) => <TextField name="feeAsset" {...params} />}
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
