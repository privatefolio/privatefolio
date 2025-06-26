import { ArrowRightAltRounded, SwapHorizRounded } from "@mui/icons-material"
import { Button, Drawer, DrawerProps, Skeleton, Stack, TextField } from "@mui/material"
import { useStore } from "@nanostores/react"
import Big from "big.js"
import { debounce } from "lodash-es"
import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ActionBlock } from "src/components/ActionBlock"
import { AmountBlock } from "src/components/AmountBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { DrawerHeader } from "src/components/DrawerHeader"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TagManager } from "src/components/TagManager"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ValueChip } from "src/components/ValueChip"
import { ChartData, EtherscanMetadata, Tag, Transaction } from "src/interfaces"
import { DEFAULT_DEBOUNCE_DURATION, getBlockExplorerName, getBlockExplorerUrl } from "src/settings"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { PopoverToggleProps } from "src/stores/app-store"
import { getAddressBookEntry } from "src/stores/metadata-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { $rpc, RPC } from "src/workers/remotes"

const patchTransactionDebounced = debounce(
  (rpc: RPC, accountName: string, id: string, update: Partial<Transaction>) => {
    rpc.patchTransaction(accountName, id, update)
    // TODO0 is this wrapping necessary?
  },
  DEFAULT_DEBOUNCE_DURATION
)

type TransactionDrawerProps = DrawerProps &
  PopoverToggleProps & {
    priceMap?: Record<string, ChartData>
    relativeTime: boolean
    tx: Transaction
  }

export function TransactionDrawer(props: TransactionDrawerProps) {
  const { open, toggleOpen, tx, relativeTime, priceMap, ...rest } = props
  const activeAccountPath = useStore($activeAccountPath)

  const {
    incoming,
    incomingAsset,
    type,
    timestamp,
    platformId,
    wallet,
    price,
    outgoing,
    outgoingAsset,
    fee,
    feeAsset,
    id,
    metadata,
  } = tx

  const txHash = (metadata as EtherscanMetadata).txHash
  const method = (metadata as EtherscanMetadata).method
  const contractAddress = (metadata as EtherscanMetadata).contractAddress

  const [logsNumber, setLogsNumber] = useState<number | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const [isPriceInverted, setIsPriceInverted] = useState(false)

  useEffect(() => {
    if (!open) return

    rpc.getAuditLogsByTxId(activeAccount, id).then((logs) => {
      setLogsNumber(logs.length)
    })

    rpc.getTagsForTransaction(activeAccount, id).then(setTags)
  }, [id, open, timestamp, rpc, activeAccount])

  const [textInput, setTextInput] = useState(tx.notes || "")

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.replace("\n", "")
    setTextInput(newValue)
    patchTransactionDebounced(rpc, activeAccount, id, {
      notes: newValue,
    })
  }

  const displayPrice = useMemo(() => {
    if (!price) return undefined
    try {
      const priceBN = new Big(price)
      return isPriceInverted ? new Big(1).div(priceBN).toString() : priceBN.toString()
    } catch {
      return price
    }
  }, [price, isPriceInverted])

  return (
    <Drawer open={open} onClose={toggleOpen} {...rest}>
      <Stack
        // config={SPRING_CONFIGS.ultra}
        paddingX={2}
        paddingY={1}
        gap={2}
        // show={open}
        sx={(theme) => ({
          maxWidth: 358,
          minWidth: 358,
          overflowX: "hidden",
          ...theme.typography.body2,
        })}
      >
        <DrawerHeader toggleOpen={toggleOpen}>Transaction details</DrawerHeader>
        <div>
          <SectionTitle>Identifier</SectionTitle>
          <IdentifierBlock id={id} />
        </div>
        <div>
          <SectionTitle>Timestamp</SectionTitle>
          <TimestampBlock timestamp={timestamp} relative={relativeTime} />
        </div>
        <div>
          <SectionTitle>Platform</SectionTitle>
          <PlatformBlock id={platformId} />
        </div>
        <div>
          <SectionTitle>Wallet</SectionTitle>
          <IdentifierBlock id={wallet} label={getAddressBookEntry(wallet)} />
        </div>
        <div>
          <SectionTitle>Type</SectionTitle>
          <ActionBlock action={type} />
        </div>
        {incomingAsset && (
          <div>
            <SectionTitle>Incoming</SectionTitle>
            <Stack direction="row" alignItems="center" gap={0.25}>
              <AmountBlock
                colorized
                amount={incoming}
                showSign
                currencyTicker={getAssetTicker(incomingAsset)}
              />
              <AssetBlock id={incomingAsset} variant="button" />
              <ValueChip
                value={
                  priceMap && incoming && priceMap[incomingAsset]?.value
                    ? priceMap[incomingAsset].value * Number(incoming)
                    : undefined
                }
              />
            </Stack>
          </div>
        )}
        {outgoingAsset && (
          <div>
            <SectionTitle>Outgoing</SectionTitle>
            <Stack direction="row" alignItems="center" gap={0.25}>
              <AmountBlock
                colorized
                amount={outgoing ? `-${outgoing}` : outgoing}
                showSign
                currencyTicker={getAssetTicker(outgoingAsset)}
              />
              <AssetBlock id={outgoingAsset} variant="button" />
              <ValueChip
                value={
                  priceMap && outgoing && priceMap[outgoingAsset]?.value
                    ? priceMap[outgoingAsset].value * Number(outgoing)
                    : undefined
                }
              />
            </Stack>
          </div>
        )}
        {feeAsset && (
          <div>
            <SectionTitle>Fee</SectionTitle>
            <Stack direction="row" alignItems="center" gap={0.25}>
              <AmountBlock
                colorized
                amount={fee}
                showSign
                currencyTicker={getAssetTicker(feeAsset)}
              />
              <AssetBlock id={feeAsset} variant="button" />
              <ValueChip
                value={
                  priceMap && fee && priceMap[feeAsset]?.value
                    ? priceMap[feeAsset].value * Number(fee)
                    : undefined
                }
              />
            </Stack>
          </div>
        )}
        {price && (
          <div>
            <SectionTitle>Price (excl. fees)</SectionTitle>
            <Stack direction="row" alignItems="center">
              <AmountBlock
                amount={displayPrice}
                currencyTicker={getAssetTicker(isPriceInverted ? incomingAsset : outgoingAsset)}
              />
              <Button
                size="small"
                color="secondary"
                onClick={() => setIsPriceInverted(!isPriceInverted)}
                sx={{ paddingX: 1 }}
                endIcon={<SwapHorizRounded />}
              >
                {getAssetTicker(isPriceInverted ? incomingAsset : outgoingAsset)} per{" "}
                {getAssetTicker(isPriceInverted ? outgoingAsset : incomingAsset)}
              </Button>
            </Stack>
          </div>
        )}
        {contractAddress && (
          <div>
            <SectionTitle>Smart Contract</SectionTitle>
            <IdentifierBlock
              id={contractAddress}
              href={getBlockExplorerUrl(platformId, contractAddress, "address")}
              linkText={`See on ${getBlockExplorerName(platformId)}`}
            />
          </div>
        )}
        {method && (
          <div>
            <SectionTitle>Smart Contract Method</SectionTitle>
            <ActionBlock action={method} />
          </div>
        )}
        {txHash && (
          <div>
            <SectionTitle>Blockchain Tx</SectionTitle>
            <IdentifierBlock
              label={txHash}
              id={txHash}
              href={getBlockExplorerUrl(platformId, txHash, "tx")}
              linkText={`See on ${getBlockExplorerName(platformId)}`}
            />
          </div>
        )}
        <div>
          <SectionTitle>Audit logs</SectionTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            {logsNumber === null ? (
              <Skeleton height={20} width={80} />
            ) : (
              <>
                {logsNumber}
                <Button
                  size="small"
                  color="secondary"
                  component={Link}
                  to={`${activeAccountPath}/audit-logs?txId=${id}`}
                  sx={{ paddingX: 2 }}
                  endIcon={<ArrowRightAltRounded fontSize="inherit" />}
                >
                  Inspect
                </Button>
              </>
            )}
          </Stack>
        </div>
        {/* <pre>{JSON.stringify(txMeta, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tx, null, 2)}</pre> */}
        <div>
          <SectionTitle>Tags</SectionTitle>
          <TagManager tags={tags} setTags={setTags} itemId={id} itemType="transaction" />
        </div>
        <div>
          <SectionTitle>Notes</SectionTitle>
          <TextField
            autoComplete="off"
            multiline
            onChange={handleTextInputChange}
            value={textInput}
            minRows={3}
            fullWidth
            placeholder="Write a custom note…"
          />
        </div>
      </Stack>
    </Drawer>
  )
}
