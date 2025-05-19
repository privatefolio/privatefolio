import {
  AttachMoneyRounded,
  BackupRounded,
  CallMergeRounded,
  HomeRounded,
  SyncRounded,
} from "@mui/icons-material"
import {
  Button,
  Dialog,
  Divider,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Stack,
  Tooltip,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { Action, KBarResults, useKBar, useMatches, useRegisterActions, VisualState } from "kbar"
import { enqueueSnackbar } from "notistack"
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Transaction } from "src/interfaces"
import { $activeAccount, $activeIndex } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { $assetMap } from "src/stores/metadata-store"
import { handleBackupRequest } from "src/utils/backup-utils"
import { formatDateRelative, formatPrivatefolioTxId } from "src/utils/formatting-utils"
import { normalizeTxHash } from "src/utils/parsing-utils"
import { $rpc } from "src/workers/remotes"

import { AssetAvatar } from "../AssetAvatar"
import { TransactionIcon } from "../icons"
import { Key } from "./Key"
import { SearchInput } from "./SearchInput"

const SEARCH_PLACEHOLDER = "Search for assets, transactions, actions, etc."

export const SearchBar = () => {
  const navigate = useNavigate()

  const {
    showing,
    query: kb,
    searchQuery,
  } = useKBar((state) => ({
    searchQuery: state.searchQuery,
    showing: state.visualState !== VisualState.hidden,
  }))

  const assetMap = useStore($assetMap)
  const assetActions = useMemo<Action[]>(
    () =>
      Object.values(assetMap).map((asset) => ({
        icon: <AssetAvatar size="snug" src={asset.logoUrl} alt={asset.symbol} />,
        id: asset.id,
        keywords: [asset.symbol, asset.id].join(" "),
        name: asset.symbol,
        perform: () => navigate(`/u/${$activeIndex.get()}/asset/${asset.id}`),
        section: "Assets",
        subtitle: asset.name,
      })),
    [assetMap, navigate]
  )

  const [txnsFound, setTxnsFound] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTxnsFound([])
    setLoading(false)
    ;(async () => {
      try {
        const txHash = normalizeTxHash(searchQuery)
        setLoading(true)
        const transaction = await $rpc.get().getTransactionsByTxHash($activeAccount.get(), txHash)
        setTxnsFound(transaction)
      } catch {
        setTxnsFound([])
      } finally {
        setLoading(false)
      }
    })()
  }, [searchQuery])

  const txnsFoundActions = useMemo<Action[]>(() => {
    const txHash = searchQuery

    const actions: Action[] = txnsFound.map((tx) => ({
      icon: <TransactionIcon fontSize="small" />,
      id: tx.id,
      keywords: txHash,
      name: `${tx.metadata.method || "Unknown"}`,
      perform: () => navigate(`/u/${$activeIndex.get()}/transactions?id=${tx.id}`),
      section: "Transactions",
      subtitle: `${formatDateRelative(tx.timestamp)} - ${formatPrivatefolioTxId(tx.id)}`, // Show at the very top
    }))

    if (actions.length > 0) {
      actions.push({
        icon: <TransactionIcon fontSize="small" />,
        id: "view-all-found-txns",
        keywords: txHash,
        name: "View all ",
        perform: () => navigate(`/u/${$activeIndex.get()}/transactions?txHash=${txHash}`),
        section: "Transactions",
        subtitle: `${actions.length} transactions linked to this tx hash`,
      })
    }

    return actions
  }, [txnsFound, navigate, searchQuery])

  const actions = useMemo<Action[]>(
    () => [
      ...txnsFoundActions,
      ...assetActions,
      {
        icon: <HomeRounded fontSize="small" />,
        id: "page-home",
        name: "Home",
        perform: () => navigate(`/u/${$activeIndex.get()}`),
        section: "Navigation",
      },
      {
        icon: <TransactionIcon fontSize="small" />,
        id: "page-transactions",
        name: "Transactions",
        perform: () => navigate(`/u/${$activeIndex.get()}/transactions`),
        section: "Navigation",
      },
      {
        icon: <AttachMoneyRounded fontSize="small" />,
        id: "action-fetch-asset-prices",
        name: "Fetch asset prices",
        perform: () => $rpc.get().enqueueFetchPrices($activeAccount.get(), "user"),
        priority: 1,
        section: "Actions",
        shortcut: ["f", "p"],
      },
      {
        icon: <SyncRounded fontSize="small" />,
        id: "action-sync-all-connections",
        name: "Sync all connections",
        perform: () =>
          $rpc
            .get()
            .enqueueSyncAllConnections($activeAccount.get(), "user", $debugMode.get(), (error) => {
              if (error) {
                enqueueSnackbar("Could not sync connection", {})
              }
            }),
        priority: 1,
        section: "Actions",
        shortcut: ["s", "c"],
      },
      {
        icon: <AttachMoneyRounded fontSize="small" />,
        id: "action-detect-spam-transactions",
        name: "Detect spam transactions",
        perform: () => $rpc.get().enqueueDetectSpamTransactions($activeAccount.get(), "user"),
        priority: 1,
        section: "Actions",
      },
      {
        icon: <CallMergeRounded fontSize="small" />,
        id: "action-auto-merge-txns",
        name: "Auto-merge transactions",
        perform: () => $rpc.get().enqueueAutoMerge($activeAccount.get(), "user"),
        priority: 1,
        section: "Actions",
      },
      {
        icon: <BackupRounded fontSize="small" />,
        id: "action-backup-account",
        name: "Backup account",
        perform: () => handleBackupRequest(),
        priority: 1,
        section: "Actions",
      },
    ],
    [assetActions, navigate, txnsFoundActions]
  )

  useRegisterActions(actions, [actions])

  return (
    <>
      <Tooltip title={SEARCH_PLACEHOLDER}>
        <Button
          // onClick={() => kb.setVisualState(VisualState.animatingIn)}
          onClick={() => kb.setVisualState(VisualState.showing)}
          variant="outlined"
          color="secondary"
          sx={{ gap: 2, paddingY: 0.5 }}
        >
          <span>Search</span>
          <span>
            {/* <Key>{MAIN_KEY}</Key> */}
            <Key>/</Key>
          </span>
        </Button>
      </Tooltip>
      <Dialog
        open={showing}
        onClose={() => {
          // kb.setVisualState(VisualState.animatingOut)
          kb.setVisualState(VisualState.hidden)
        }}
      >
        <>
          <Stack gap={1} padding={0.5} marginTop={0.5}>
            <SearchInput defaultPlaceholder={SEARCH_PLACEHOLDER} loading={loading} />
            <Divider />
            <RenderResults loading={loading} />
          </Stack>
        </>
      </Dialog>
    </>
  )
}

function RenderResults({ loading }: { loading: boolean }) {
  const { results } = useMatches()

  return (
    <div>
      <KBarResults
        items={results}
        onRender={({ item, active }) => {
          if (typeof item === "string") {
            return (
              <MenuItem sx={{ height: 52 }} disabled>
                <ListItemText secondary={item} />
              </MenuItem>
            )
          }

          return (
            <MenuItem selected={active} sx={{ height: 52 }}>
              {item.icon && <ListItemAvatar>{item.icon}</ListItemAvatar>}
              <ListItemText
                primary={item.name}
                secondary={item.subtitle}
                primaryTypographyProps={{ variant: "body2" }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
              {item.shortcut && (
                <ListItemText
                  primary={
                    <>
                      {item.shortcut.map((x) => (
                        <Key key={x}>{x}</Key>
                      ))}
                    </>
                  }
                  primaryTypographyProps={{ variant: "caption" }}
                  sx={{ textAlign: "right" }}
                />
              )}
            </MenuItem>
          )
        }}
      />
      {results.length === 0 && !loading && (
        <MenuItem disabled sx={{ textAlign: "center" }}>
          <ListItemText primary="No results found." />
        </MenuItem>
      )}
      {loading && (
        <MenuItem disabled sx={{ textAlign: "center" }}>
          <ListItemText primary="Loading..." />
        </MenuItem>
      )}
    </div>
  )
}
