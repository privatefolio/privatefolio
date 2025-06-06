import { ArrowRightAltRounded, CloseRounded } from "@mui/icons-material"
import {
  Button,
  Drawer,
  DrawerProps,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { debounce } from "lodash-es"
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ActionBlock } from "src/components/ActionBlock"
import { AmountBlock } from "src/components/AmountBlock"
import { AppLink } from "src/components/AppLink"
import { IdentifierBlock } from "src/components/IdentifierBlock"
import { MyAssetBlock } from "src/components/MyAssetBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { SectionTitle } from "src/components/SectionTitle"
import { TagManager } from "src/components/TagManager"
import { TimestampBlock } from "src/components/TimestampBlock"
import { ValueChip } from "src/components/ValueChip"
import { ChartData, EtherscanMetadata, Tag, Transaction } from "src/interfaces"
import { DEFAULT_DEBOUNCE_DURATION, getBlockExplorerName, getBlockExplorerUrl } from "src/settings"
import { $activeAccount, $activeIndex } from "src/stores/account-store"
import { PopoverToggleProps } from "src/stores/app-store"
import { getAddressBookEntry } from "src/stores/metadata-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

const patchTransactionDebounced = debounce(
  (accountName: string, id: string, update: Partial<Transaction>) => {
    $rpc.get().patchTransaction(accountName, id, update)
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
  const activeIndex = useStore($activeIndex)

  const {
    incoming,
    incomingAsset,
    type,
    timestamp,
    platform,
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

  useEffect(() => {
    if (!open) return

    $rpc
      .get()
      .getAuditLogsByTxId($activeAccount.get(), id)
      .then((logs) => {
        setLogsNumber(logs.length)
      })

    $rpc.get().getTagsForTransaction($activeAccount.get(), id).then(setTags)
  }, [id, open, timestamp])

  const [textInput, setTextInput] = useState(tx.notes || "")

  const handleTextInputChange = (event) => {
    const newValue = event.target.value.replace("\n", "")
    setTextInput(newValue)
    patchTransactionDebounced($activeAccount.get(), id, {
      notes: newValue,
    })
  }

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
        <Stack marginBottom={2} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" letterSpacing="0.025rem">
            Transaction details
          </Typography>
          <IconButton onClick={toggleOpen} edge="end" color="secondary" aria-label="Close dialog">
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
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
          <PlatformBlock id={platform} />
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
                variant="body1"
              />
              <Button
                size="small"
                component={AppLink}
                to={`../asset/${encodeURI(incomingAsset)}`}
                sx={{ fontSize: "0.9rem", padding: 1 }}
              >
                <MyAssetBlock id={incomingAsset} size="small" />
              </Button>
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
                variant="body1"
              />
              <Button
                size="small"
                component={AppLink}
                to={`../asset/${encodeURI(outgoingAsset)}`}
                sx={{ fontSize: "0.9rem", padding: 1 }}
              >
                <MyAssetBlock id={outgoingAsset} size="small" />
              </Button>
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
                variant="body1"
              />
              <Button
                size="small"
                component={AppLink}
                to={`../asset/${encodeURI(feeAsset)}`}
                sx={{ fontSize: "0.9rem", padding: 1 }}
              >
                <MyAssetBlock id={feeAsset} size="small" />
              </Button>
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
            <SectionTitle>Price</SectionTitle>
            <AmountBlock
              colorized
              amount={price}
              currencyTicker={`${getAssetTicker(outgoingAsset)}/${getAssetTicker(incomingAsset)}`}
            />
          </div>
        )}
        {contractAddress && (
          <div>
            <SectionTitle>Smart Contract</SectionTitle>
            <IdentifierBlock
              id={contractAddress}
              href={getBlockExplorerUrl(platform, contractAddress, "address")}
              linkText={`See on ${getBlockExplorerName(platform)}`}
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
              href={getBlockExplorerUrl(platform, txHash, "tx")}
              linkText={`See on ${getBlockExplorerName(platform)}`}
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
                  to={`/u/${activeIndex}/audit-logs?txId=${id}`}
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
