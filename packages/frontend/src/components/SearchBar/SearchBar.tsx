import {
  AccountBalanceRounded,
  AttachMoneyRounded,
  BackupRounded,
  Bedtime,
  CachedRounded,
  CalculateOutlined,
  CallMergeRounded,
  CloudSyncRounded,
  DeleteForever,
  DownloadRounded,
  PhishingRounded,
  RestoreRounded,
  StarRounded,
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
import { persistentAtom } from "@nanostores/persistent"
import { useStore } from "@nanostores/react"
import {
  Action,
  ActionImpl,
  KBarResults,
  useKBar,
  useMatches,
  useRegisterActions,
  VisualState,
} from "kbar"
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { APP_ACTIONS } from "src/AppActions"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { Asset, FindPlatformsResult, RichExtension, Transaction } from "src/interfaces"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { $debugMode } from "src/stores/app-store"
import { appBarHeight } from "src/theme"
import { getAssetPlatform } from "src/utils/assets-utils"
import {
  handleBackupRequest,
  handleExportAuditLogsRequest,
  handleExportTransactionsRequest,
  onRestoreRequest,
} from "src/utils/backup-utils"
import { isElectron } from "src/utils/electron-utils"
import { formatDateRelative, formatPrivatefolioTxId } from "src/utils/formatting-utils"
import { normalizeTxHash } from "src/utils/parsing-utils"
import { noop } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { $assetMap, $platformMap, getFilterValueLabel } from "../../stores/metadata-store"
import { AssetAvatar } from "../AssetAvatar"
import { ExtensionAvatar } from "../ExtensionAvatar"
import { TransactionIcon } from "../icons"
import { PlatformAvatar } from "../PlatformAvatar"
import { Truncate } from "../Truncate"
import { formatShortcut, Key } from "./Key"
import { SearchInput } from "./SearchInput"

const SEARCH_PLACEHOLDER = "Search for assets, transactions, actions or anything else."

const SECTIONS = {
  actions: { name: "Actions", priority: 10 },
  assets: { name: "Assets", priority: 8 },
  blockchains: { name: "Blockchains", priority: 6 },
  exchanges: { name: "Exchanges", priority: 7 },
  extensions: { name: "Extensions", priority: 5 },
  recent: { name: "Recent", priority: 12 },
  transactions: { name: "Transactions", priority: 11 },
}

const $recentActionIds = persistentAtom<string[]>("recent-actions", [], {
  decode: JSON.parse,
  encode: JSON.stringify,
})

function addToRecentActions(actionId: string) {
  const current = $recentActionIds.get()
  const filtered = current.filter((id) => id !== actionId)
  const updated = [actionId, ...filtered].slice(0, 10)
  $recentActionIds.set(updated)
}

export const SearchBar = () => {
  const navigate = useNavigate()
  const activeAccountPath = useStore($activeAccountPath)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const assetMap = useStore($assetMap)
  const platformMap = useStore($platformMap)
  const recentActionIds = useStore($recentActionIds)

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
      try {
        setAssetsLoading(true)
        const assets = await rpc.findAssets(activeAccount, searchQuery, 5, false, "coingecko")
        const myAssets = await rpc.findAssets(activeAccount, searchQuery, 5, false, "my-assets")
        setAssetsFound([...myAssets, ...assets])
      } catch {
        setAssetsFound([])
      } finally {
        setAssetsLoading(false)
      }
    })()
  }, [searchQuery, rpc, activeAccount])

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
        const platforms = await rpc.findPlatforms(activeAccount, searchQuery, 5, "coingecko")
        const myPlatforms = await rpc.findPlatforms(activeAccount, searchQuery, 5, "my-platforms")
        setPlatformsFound({
          blockchains: [...myPlatforms.blockchains, ...platforms.blockchains],
          exchanges: [...myPlatforms.exchanges, ...platforms.exchanges],
        })
      } catch {
        setPlatformsFound({ blockchains: [], exchanges: [] })
      } finally {
        setPlatformsLoading(false)
      }
    })()
  }, [searchQuery, rpc, activeAccount])

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
      section: SECTIONS.transactions,
      subtitle: `${formatDateRelative(tx.timestamp)} - ${formatPrivatefolioTxId(tx.id)}`, // Show at the very top
    }))

    if (actions.length > 0) {
      actions.push({
        icon: <TransactionIcon fontSize="small" />,
        id: "view-all-found-txns",
        keywords: txHash,
        name: "View all ",
        perform: () => navigate(`${activeAccountPath}/transactions?txHash=${txHash}`),
        section: SECTIONS.transactions,
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
        keywords: `${blockchain.name} ${blockchain.id} ${blockchain.chainId} blockchain ${platformMap[blockchain.id] ? "favorite" : ""}`,
        name: blockchain.name,
        perform: () => navigate(`${activeAccountPath}/platform/${blockchain.id}`),
        priority: -(blockchain.chainId ?? Infinity),
        section: SECTIONS.blockchains,
      })
    })

    platformsFound.exchanges.forEach((exchange) => {
      actions.push({
        icon: <PlatformAvatar src={exchange.image} alt={exchange.name} size="snug" />,
        id: `exchange-${exchange.id}`,
        keywords: `${exchange.name} ${exchange.id} exchange ${platformMap[exchange.id] ? "favorite" : ""}`, // ${exchange.country} TODO7
        name: exchange.name,
        perform: () => navigate(`${activeAccountPath}/platform/${exchange.id}`),
        priority: -(exchange.coingeckoTrustRank ?? Infinity),
        section: SECTIONS.exchanges,
      })
    })

    return actions
  }, [platformsFound, navigate, activeAccountPath, platformMap])

  const assetActions = useMemo<Action[]>(() => {
    return assetsFound.map((asset) => ({
      icon: <AssetAvatar src={asset.logoUrl} alt={asset.symbol} size="snug" />,
      id: `asset-${asset.id}`,
      keywords: [
        assetMap[asset.id] ? "favorite" : "",
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
      priority: -(asset.marketCapRank ?? Infinity) + (assetMap[asset.id] ? 1 : 0),
      section: SECTIONS.assets,
      subtitle: assetMap[asset.id]
        ? `${asset.name || "Unknown"} • ${getFilterValueLabel(getAssetPlatform(asset.id))}`
        : asset.name,
    }))
  }, [assetsFound, navigate, activeAccountPath, assetMap])

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
        section: SECTIONS.extensions,
        subtitle: extension.description,
      })
    })

    return actions
  }, [extensionsFound, navigate, activeAccountPath])

  const appActions = useMemo<Action[]>(() => {
    const actions: Action[] = [
      {
        icon: <CachedRounded fontSize="small" />,
        id: "action-refresh-all",
        name: "Refresh all",
        perform: () => {
          rpc.enqueueFetchPrices(activeAccount, "user")
          rpc.enqueueRefreshBalances(activeAccount, "user")
          rpc.enqueueRefreshNetworth(activeAccount, "user")
          rpc.enqueueRefreshTrades(activeAccount, "user")
        },
        priority: 11,
        section: SECTIONS.actions,
        shortcut: ["$mod+a"],
        subtitle: "Refresh prices, networth, trades and more.",
      },
      {
        icon: <AttachMoneyRounded fontSize="small" />,
        id: "action-fetch-asset-prices",
        name: "Fetch asset prices",
        perform: () => rpc.enqueueFetchPrices(activeAccount, "user"),
        priority: 3,
        section: SECTIONS.actions,
      },
      {
        icon: <CloudSyncRounded fontSize="small" />,
        id: "action-sync-all-connections",
        name: "Sync all connections",
        perform: () => rpc.enqueueSyncAllConnections(activeAccount, "user", $debugMode.get()),
        priority: 10,
        section: SECTIONS.actions,
      },
      {
        icon: <CloudSyncRounded fontSize="small" />,
        id: "action-reset-all-connections",
        name: "Reset all connections",
        perform: () => rpc.enqueueResetAllConnections(activeAccount, "user"),
        priority: 10,
        section: SECTIONS.actions,
      },
      {
        icon: <PhishingRounded fontSize="small" />,
        id: "action-detect-spam-transactions",
        name: "Detect spam transactions",
        perform: () => rpc.enqueueDetectSpamTransactions(activeAccount, "user"),
        priority: 1,
        section: SECTIONS.actions,
      },
      {
        icon: <CallMergeRounded fontSize="small" />,
        id: "action-auto-merge-txns",
        name: "Auto-merge transactions",
        perform: () => rpc.enqueueAutoMerge(activeAccount, "user"),
        priority: 1,
        section: SECTIONS.actions,
      },
      {
        icon: <BackupRounded fontSize="small" />,
        id: "action-backup-account",
        keywords: "backup account restore",
        name: "Backup account",
        perform: () => handleBackupRequest(rpc, activeAccount),
        priority: 9,
        section: SECTIONS.actions,
      },
      {
        icon: <RestoreRounded fontSize="small" />,
        id: "action-restore-account",
        keywords: "restore account backup",
        name: "Restore account",
        perform: () => onRestoreRequest(rpc, activeAccount, noop),
        priority: 9,
        section: SECTIONS.actions,
      },
      {
        icon: <DownloadRounded fontSize="small" />,
        id: "action-export-transactions",
        keywords: "export transactions",
        name: "Export transactions",
        perform: () => handleExportTransactionsRequest(rpc, activeAccount),
        priority: 5,
        section: SECTIONS.actions,
      },
      {
        icon: <DownloadRounded fontSize="small" />,
        id: "action-export-audit-logs",
        keywords: "export audit logs",
        name: "Export audit logs",
        perform: () => handleExportAuditLogsRequest(rpc, activeAccount),
        priority: 5,
        section: SECTIONS.actions,
      },
      {
        icon: <AccountBalanceRounded fontSize="small" />,
        id: "action-refetch-platforms",
        name: "Refetch asset platforms",
        perform: () => rpc.enqueueRefetchPlatforms(activeAccount, "user"),
        priority: 2,
        section: SECTIONS.actions,
      },
      {
        icon: <CalculateOutlined fontSize="small" />,
        id: "action-recompute-trades",
        name: "Recompute trades",
        perform: () => rpc.enqueueRecomputeTrades(activeAccount, "user"),
        priority: 3,
        section: SECTIONS.actions,
        // shortcut: ["$mod+x"],
      },
      {
        icon: <CalculateOutlined fontSize="small" />,
        id: "action-recompute-balances",
        name: "Recompute balances",
        perform: () => rpc.enqueueRecomputeBalances(activeAccount, "user"),
        priority: 3,
        section: SECTIONS.actions,
      },
      {
        icon: <CalculateOutlined fontSize="small" />,
        id: "action-recompute-networth",
        name: "Recompute networth",
        perform: () => rpc.enqueueRecomputeNetworth(activeAccount, "user"),
        priority: 3,
        section: SECTIONS.actions,
      },
      {
        icon: <DeleteForever fontSize="small" />,
        id: "action-delete-balances",
        name: "Delete balances",
        perform: () => rpc.enqueueDeleteBalances(activeAccount, "user"),
        priority: 0,
        section: SECTIONS.actions,
      },
      {
        icon: <Bedtime fontSize="small" />,
        id: "action-sleep-1s",
        name: "Sleep 1s",
        perform: () => rpc.enqueueSleep(activeAccount, 1, 0.1),
        priority: 0,
        section: SECTIONS.actions,
      },
      {
        icon: <Bedtime fontSize="small" />,
        id: "action-sleep-50s",
        name: "Sleep 50s",
        perform: () => rpc.enqueueSleep(activeAccount, 50, 10, true),
        priority: 0,
        section: SECTIONS.actions,
      },
      {
        icon: <Workspaces fontSize="small" />,
        id: "action-refetch-all-assets",
        name: "Refetch all assets",
        perform: () => rpc.enqueueRefetchAssets(activeAccount, "user"),
        priority: 2,
        section: SECTIONS.actions,
      },
      ...Object.values(APP_ACTIONS),
    ]

    actions.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))

    return actions
  }, [activeAccount, rpc])

  const actions = useMemo<Action[]>(() => {
    const all = [
      ...txnsFoundActions,
      ...platformActions,
      ...assetActions,
      ...extensionActions,
      ...appActions,
    ]

    return all.map((action) => {
      const index = recentActionIds.findIndex((id) => id === action.id)
      const isRecent = index !== -1

      return {
        ...action,
        perform: (currentActionImpl: ActionImpl) => {
          addToRecentActions(action.id)
          action.perform?.(currentActionImpl)
        },
        priority: isRecent ? -index : action.priority,
        section: isRecent ? SECTIONS.recent : action.section,
      }
    })
  }, [
    recentActionIds,
    txnsFoundActions,
    platformActions,
    assetActions,
    extensionActions,
    appActions,
  ])

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

  const { isMobile } = useBreakpoints()

  return (
    <div>
      <KBarResults
        maxHeight={
          (isMobile
            ? `calc(100vh - ${isElectron ? 60 + appBarHeight : 60}px)`
            : 400) as unknown as number
        }
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
                      {item.shortcut.map((x) => {
                        return <Key key={x}>{formatShortcut(x)}</Key>
                      })}
                    </>
                  }
                  primaryTypographyProps={{ variant: "caption" }}
                  sx={{ textAlign: "right" }}
                />
              )}
              {item.keywords && item.keywords.includes("favorite") && (
                <ListItemText
                  primary={<StarRounded sx={{ fontSize: "1rem" }} />}
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
