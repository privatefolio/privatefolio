import { LoadingButton } from "@mui/lab"
import {
  Autocomplete,
  Drawer,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers"
import { useStore } from "@nanostores/react"
import { WritableAtom } from "nanostores"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { DrawerHeader } from "src/components/DrawerHeader"
import { SectionTitle } from "src/components/SectionTitle"
import { TRANSACTIONS_TYPES, TransactionType } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $assetMap, $myPlatforms } from "src/stores/metadata-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { asUTC } from "src/utils/formatting-utils"
import { $rpc } from "src/workers/remotes"

import { PlatformAvatar } from "../../components/PlatformAvatar"

export function AddTransactionDrawer(props: { atom: WritableAtom<boolean> }) {
  const { atom } = props

  const open = useStore(atom)

  const [loading, setLoading] = useState(false)

  const [feeAsset, setFeeAsset] = useState<string | null>(null)
  const [incomingAsset, setIncomingAsset] = useState<string | null>(null)
  const [outgoingAsset, setOutgoingAsset] = useState<string | null>(null)

  const [platform, setPlatform] = useState<string>("ethereum")
  const [type, setType] = useState<TransactionType>("Swap")
  const [binanceWallet, setBinanceWallet] = useState("Spot")

  const [notes, setNotes] = useState("")

  const assetMap = useStore($assetMap)

  const assetsIds: string[] = useMemo(() => Object.keys(assetMap), [assetMap])

  const handleTextInputChange = (event) => {
    const newValue = event.target.value.replace("\n", "")
    setNotes(newValue)
  }

  const binanceWalletsOptions = [
    "Spot",
    "Cross Margin",
    "Isolated Margin",
    "Coin-M Futures",
    "USD-M Futures",
  ]

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const formData = new FormData(event.target as HTMLFormElement)

      const timestamp = asUTC(new Date(formData.get("timestamp") as string))
      const wallet = platform === "binance" ? binanceWallet : (formData.get("tx-wallet") as string)
      const incoming = formData.get("incoming") as string
      const outgoing = formData.get("outgoing") as string
      const fee = formData.get("fee") as string

      if (!incoming && !outgoing && !fee) return

      setLoading(true)
      rpc
        .addTransaction(
          {
            fee,
            feeAsset: feeAsset || undefined,
            incoming,
            incomingAsset: incomingAsset || undefined,
            metadata: {},
            notes,
            outgoing,
            outgoingAsset: outgoingAsset || undefined,
            platform,
            timestamp,
            type,
            wallet,
          },
          activeAccount
        )
        .then(() => {
          atom.set(false)
        })
        .catch(() => {
          setLoading(false)
        })
    },
    [
      atom,
      platform,
      binanceWallet,
      type,
      incomingAsset,
      outgoingAsset,
      feeAsset,
      notes,
      rpc,
      activeAccount,
    ]
  )

  const platformsMap = useStore($myPlatforms)
  const platforms = useMemo(() => Object.values(platformsMap), [platformsMap])

  useEffect(() => {
    if (open) return

    setPlatform("ethereum")
    setBinanceWallet("Spot")
    setType("Swap")
    setNotes("")
    setFeeAsset(null)
    setIncomingAsset(null)
    setOutgoingAsset(null)
    setLoading(false)
  }, [open])

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
              value={platform}
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
            {platform === "binance" ? (
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
              <TextField
                name="tx-wallet"
                autoComplete="off"
                variant="outlined"
                fullWidth
                size="small"
                required
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
              {TRANSACTIONS_TYPES.map((x) => (
                <MenuItem key={x} value={x}>
                  <ListItemText primary={x} />
                </MenuItem>
              ))}
            </Select>
          </div>
          {type !== "Withdraw" ? (
            <Stack direction="row" gap={1}>
              <Stack width="60%">
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
              <Stack width="40%">
                <SectionTitle>Incoming Asset</SectionTitle>
                <Autocomplete
                  // disablePortal
                  fullWidth
                  // disableClearable
                  options={assetsIds}
                  getOptionLabel={(option) => getAssetTicker(option)}
                  value={incomingAsset}
                  size="small"
                  onChange={(event, newValue) => {
                    setIncomingAsset(newValue)
                  }}
                  renderInput={(params) => <TextField {...params} required={true} />}
                />
              </Stack>
            </Stack>
          ) : null}
          {type !== "Deposit" && type !== "Reward" ? (
            <Stack direction="row" gap={1}>
              <Stack width="60%">
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
              <Stack width="40%">
                <SectionTitle>Outgoing Asset</SectionTitle>
                <Autocomplete
                  // disablePortal
                  fullWidth
                  // disableClearable
                  options={assetsIds}
                  getOptionLabel={(option) => getAssetTicker(option)}
                  value={outgoingAsset}
                  size="small"
                  onChange={(event, newValue) => {
                    setOutgoingAsset(newValue)
                  }}
                  renderInput={(params) => <TextField {...params} required={true} />}
                />
              </Stack>
            </Stack>
          ) : null}
          <Stack direction="row" gap={1}>
            <Stack width="60%">
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
            <Stack width="40%">
              <SectionTitle>Fee Asset</SectionTitle>
              <Autocomplete
                // disablePortal
                fullWidth
                // disableClearable
                options={assetsIds}
                getOptionLabel={(option) => getAssetTicker(option)}
                value={feeAsset}
                size="small"
                onChange={(event, newValue) => {
                  setFeeAsset(newValue)
                }}
                renderInput={(params) => <TextField {...params} required={true} />}
              />
            </Stack>
          </Stack>

          <div>
            <SectionTitle>Date</SectionTitle>
            <DatePicker
              name="timestamp"
              slotProps={{
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
            <LoadingButton variant="contained" type="submit" loading={loading}>
              Add Transaction
            </LoadingButton>
          </div>
        </Stack>
      </form>
    </Drawer>
  )
}
