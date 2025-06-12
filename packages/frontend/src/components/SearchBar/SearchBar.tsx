import {
  AccountBalanceRounded,
  AttachMoneyRounded,
  BackupRounded,
  CallMergeRounded,
  DeleteForever,
  SyncRounded,
  Workspaces,
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
import { Asset, FindPlatformsResult, RichExtension, Transaction } from "src/interfaces"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { handleBackupRequest } from "src/utils/backup-utils"
import { formatDateRelative, formatPrivatefolioTxId } from "src/utils/formatting-utils"
import { normalizeTxHash } from "src/utils/parsing-utils"
import { $rpc } from "src/workers/remotes"

import { AssetAvatar } from "../AssetAvatar"
import { ExtensionAvatar } from "../ExtensionAvatar"
import { TransactionIcon } from "../icons"
import { PlatformAvatar } from "../PlatformAvatar"
import { Truncate } from "../Truncate"
import { Key } from "./Key"
import { SearchInput } from "./SearchInput"

const SEARCH_PLACEHOLDER = "Search for assets, transactions, actions, etc."

export const SearchBar = () => {
  const navigate = useNavigate()
  const activeAccountPath = useStore($activeAccountPath)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const {
    showing,
    query: kb,
    searchQuery,
  } = useKBar((state) => ({
    searchQuery: state.searchQuery,
    showing: state.visualState !== VisualState.hidden,
  }))

  const [assetsFound, setAssetsFound] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [txnsFound, setTxnsFound] = useState<Transaction[]>([])
  const [txnsLoading, setTxnsLoading] = useState(false)

  const [platformsFound, setPlatformsFound] = useState<FindPlatformsResult>({
    blockchains: [],
    exchanges: [],
  })
  const [platformsLoading, setPlatformsLoading] = useState(false)

  const [extensionsFound, setExtensionsFound] = useState<RichExtension[]>([])
  const [extensionsLoading, setExtensionsLoading] = useState(false)

  useEffect(() => {
    setAssetsFound([])
    setAssetsLoading(false)
    ;(async () => {
      if (!searchQuery || searchQuery.length < 1) {
        setAssetsFound([])
        return
      }

      try {
        setAssetsLoading(true)
        const assets = await rpc.findAssets(searchQuery)
        setAssetsFound(assets)
      } catch {
        setAssetsFound([])
      } finally {
        setAssetsLoading(false)
      }
    })()
  }, [searchQuery, rpc])

  useEffect(() => {
    setTxnsFound([])
    setTxnsLoading(false)
    ;(async () => {
      try {
        const txHash = normalizeTxHash(searchQuery)
        setTxnsLoading(true)
        const transaction = await rpc.getTransactionsByTxHash(activeAccount, txHash)
        setTxnsFound(transaction)
      } catch {
        setTxnsFound([])
      } finally {
        setTxnsLoading(false)
      }
    })()
  }, [searchQuery, rpc, activeAccount])

  useEffect(() => {
    setPlatformsFound({ blockchains: [], exchanges: [] })
    setPlatformsLoading(false)
    ;(async () => {
      if (!searchQuery || searchQuery.length < 1) {
        setPlatformsFound({ blockchains: [], exchanges: [] })
        return
      }

      try {
        setPlatformsLoading(true)
        const platforms = await rpc.findPlatforms(searchQuery)
        setPlatformsFound(platforms)
      } catch {
        setPlatformsFound({ blockchains: [], exchanges: [] })
      } finally {
        setPlatformsLoading(false)
      }
    })()
  }, [searchQuery, rpc])

  useEffect(() => {
    setExtensionsFound([])
    setExtensionsLoading(false)
    ;(async () => {
      if (!searchQuery || searchQuery.length < 1) {
        setExtensionsFound([])
        return
      }

      try {
        setExtensionsLoading(true)
        const extensions = await rpc.findExtensions(searchQuery)
        setExtensionsFound(extensions)
      } catch {
        setExtensionsFound([])
      } finally {
        setExtensionsLoading(false)
      }
    })()
  }, [searchQuery, rpc])

  const txnsFoundActions = useMemo<Action[]>(() => {
    const txHash = searchQuery

    const actions: Action[] = txnsFound.map((tx) => ({
      icon: <TransactionIcon fontSize="small" />,
      id: tx.id,
      keywords: txHash,
      name: `${tx.metadata.method || "Unknown"}`,
      perform: () => navigate(`${activeAccountPath}/transactions?id=${tx.id}`),
      section: "Transactions",
      subtitle: `${formatDateRelative(tx.timestamp)} - ${formatPrivatefolioTxId(tx.id)}`, // Show at the very top
    }))

    if (actions.length > 0) {
      actions.push({
        icon: <TransactionIcon fontSize="small" />,
        id: "view-all-found-txns",
        keywords: txHash,
        name: "View all ",
        perform: () => navigate(`${activeAccountPath}/transactions?txHash=${txHash}`),
        section: "Transactions",
        subtitle: `${actions.length} transactions linked to this tx hash`,
      })
    }

    return actions
  }, [txnsFound, navigate, searchQuery, activeAccountPath])

  const platformActions = useMemo<Action[]>(() => {
    const actions: Action[] = []

    platformsFound.blockchains.forEach((blockchain) => {
      actions.push({
        icon: <PlatformAvatar src={blockchain.image} alt={blockchain.name} size="snug" />,
        id: `blockchain-${blockchain.id}`,
        keywords: `${blockchain.name} ${blockchain.id} ${blockchain.chainId} blockchain`,
        name: blockchain.name,
        perform: () => navigate(`${activeAccountPath}/platform/${blockchain.id}`),
        priority: -(blockchain.chainId ?? Infinity),
        section: "Blockchains",
      })
    })

    platformsFound.exchanges.forEach((exchange) => {
      actions.push({
        icon: <PlatformAvatar src={exchange.image} alt={exchange.name} size="snug" />,
        id: `exchange-${exchange.id}`,
        keywords: `${exchange.name} ${exchange.id} ${exchange.country} exchange`,
        name: exchange.name,
        perform: () => navigate(`${activeAccountPath}/platform/${exchange.id}`),
        priority: -(exchange.coingeckoTrustRank ?? Infinity),
        section: "Exchanges",
      })
    })

    return actions
  }, [platformsFound, navigate, activeAccountPath])

  const assetActions = useMemo<Action[]>(() => {
    return assetsFound.map((asset) => ({
      icon: <AssetAvatar src={asset.logoUrl} alt={asset.symbol} size="snug" />,
      id: `asset-${asset.id}`,
      keywords: [
        asset.name,
        asset.id,
        asset.symbol,
        asset.coingeckoId,
        ...(asset.platforms ? Object.values(asset.platforms) : []),
      ]
        .filter(Boolean)
        .join(" "),
      name: asset.symbol.toUpperCase(),
      perform: () => navigate(`${activeAccountPath}/asset/${asset.id}`),
      priority: -(asset.marketCapRank ?? Infinity),
      section: "Assets",
      subtitle: asset.name,
    }))
  }, [assetsFound, navigate, activeAccountPath])

  const extensionActions = useMemo<Action[]>(() => {
    const actions: Action[] = []

    extensionsFound.forEach((extension) => {
      actions.push({
        icon: (
          <ExtensionAvatar
            src={extension.extensionLogoUrl}
            alt={extension.extensionName}
            size="snug"
          />
        ),
        id: `extension-${extension.id}`,
        keywords: `${extension.extensionName} ${extension.description} ${extension.authorGithub} extension`,
        name: extension.extensionName,
        perform: () => navigate(`${activeAccountPath}/extension/${extension.id}`),
        section: "Extensions",
        subtitle: extension.description,
      })
    })

    return actions
  }, [extensionsFound, navigate, activeAccountPath])

  const actions = useMemo<Action[]>(
    () => [
      ...txnsFoundActions,
      ...platformActions,
      ...assetActions,
      ...extensionActions,
      {
        icon: <AttachMoneyRounded fontSize="small" />,
        id: "action-fetch-asset-prices",
        name: "Fetch asset prices",
        perform: () => rpc.enqueueFetchPrices(activeAccount, "user"),
        priority: 1,
        section: "Actions",
        shortcut: ["f", "p"],
      },
      {
        icon: <SyncRounded fontSize="small" />,
        id: "action-sync-all-connections",
        name: "Sync all connections",
        perform: () =>
          rpc.enqueueSyncAllConnections(activeAccount, "user", $debugMode.get(), (error) => {
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
        perform: () => rpc.enqueueDetectSpamTransactions(activeAccount, "user"),
        priority: 1,
        section: "Actions",
      },
      {
        icon: <CallMergeRounded fontSize="small" />,
        id: "action-auto-merge-txns",
        name: "Auto-merge transactions",
        perform: () => rpc.enqueueAutoMerge(activeAccount, "user"),
        priority: 1,
        section: "Actions",
      },
      {
        icon: <BackupRounded fontSize="small" />,
        id: "action-backup-account",
        name: "Backup account",
        perform: () => handleBackupRequest(rpc, activeAccount),
        priority: 1,
        section: "Actions",
      },
      {
        icon: <AccountBalanceRounded fontSize="small" />,
        id: "action-refetch-platforms",
        name: "Refetch asset platforms",
        perform: () => rpc.enqueueRefetchPlatforms(activeAccount, "user"),
        priority: 1,
        section: "Actions",
      },
      {
        icon: <Workspaces fontSize="small" />,
        id: "action-refetch-assets",
        name: "Refetch assets",
        perform: () => rpc.enqueueRefetchAssets(activeAccount, "user"),
        priority: 1,
        section: "Actions",
      },
      {
        icon: <DeleteForever fontSize="small" />,
        id: "action-delete-asset-prices",
        name: "Delete asset prices",
        perform: () => rpc.enqueueDeleteAssetPrices(activeAccount, "user"),
        priority: 1,
        section: "Actions",
      },
    ],
    [assetActions, txnsFoundActions, platformActions, extensionActions, rpc, activeAccount]
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
          <Key>/</Key>
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
            <SearchInput
              defaultPlaceholder={SEARCH_PLACEHOLDER}
              loading={txnsLoading || platformsLoading || assetsLoading || extensionsLoading}
            />
            <Divider />
            <RenderResults
              loading={txnsLoading || platformsLoading || assetsLoading || extensionsLoading}
            />
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
                secondary={<Truncate>{item.subtitle}</Truncate>}
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
          <ListItemText primary="Loading…" />
        </MenuItem>
      )}
    </div>
  )
}
