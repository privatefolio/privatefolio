import { Close, StarRounded } from "@mui/icons-material"
import {
  Button,
  Dialog,
  Divider,
  IconButton,
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
import { debounce } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { APP_ACTIONS } from "src/AppActions"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import {
  Asset,
  Blockchain,
  Exchange,
  FindPlatformsResult,
  RichExtension,
  Transaction,
} from "src/interfaces"
import { INPUT_DEBOUNCE_DURATION, INPUT_MAX_DEBOUNCE_DURATION } from "src/settings"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { appBarHeight } from "src/theme"
import { getAssetPlatform } from "src/utils/assets-utils"
import { isInputFocused } from "src/utils/browser-utils"
import { isElectron } from "src/utils/electron-utils"
import { formatDateRelative, formatPrivatefolioTxId } from "src/utils/formatting-utils"
import { normalizeTxHash } from "src/utils/parsing-utils"
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleAssetsSearch = useCallback(
    debounce(
      async (query: string, signal: AbortSignal) => {
        if (!query || query.length < 1) {
          setAssetsFound([])
          return
        }

        try {
          setAssetsLoading(true)
          const [assets, myAssets] = await Promise.all([
            rpc.findAssets(activeAccount, query, 5, false, "all-assets"),
            rpc.findAssets(activeAccount, query, 5, false, "my-assets"),
          ])

          if (signal.aborted) throw new Error(signal.reason)

          const assetsMap = new Map<string, Asset>()
          assets.forEach((asset) => {
            assetsMap.set(asset.id, asset)
          })
          myAssets.forEach((asset) => {
            assetsMap.set(asset.id, asset)
          })

          setAssetsFound(Array.from(assetsMap.values()))
        } catch {
          setAssetsFound([])
        } finally {
          setAssetsLoading(false)
        }
      },
      INPUT_DEBOUNCE_DURATION,
      {
        leading: false,
        maxWait: INPUT_MAX_DEBOUNCE_DURATION,
        trailing: true,
      }
    ),
    [rpc, activeAccount]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleTxnsSearch = useCallback(
    debounce(
      async (query: string, signal: AbortSignal) => {
        try {
          const txHash = normalizeTxHash(query)
          setTxnsLoading(true)
          const transaction = await rpc.getTransactionsByTxHash(activeAccount, txHash)

          if (signal.aborted) throw new Error(signal.reason)

          setTxnsFound(transaction)
        } catch {
          setTxnsFound([])
        } finally {
          setTxnsLoading(false)
        }
      },
      INPUT_DEBOUNCE_DURATION,
      {
        leading: false,
        maxWait: INPUT_MAX_DEBOUNCE_DURATION,
        trailing: true,
      }
    ),
    [rpc, activeAccount]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handlePlatformsSearch = useCallback(
    debounce(
      async (query: string, signal: AbortSignal) => {
        if (!query || query.length < 1) {
          setPlatformsFound({ blockchains: [], exchanges: [] })
          return
        }

        try {
          setPlatformsLoading(true)
          const [platforms, myPlatforms] = await Promise.all([
            rpc.findPlatforms(activeAccount, query, 5, false, "coingecko"),
            rpc.findPlatforms(activeAccount, query, 5, false, "my-platforms"),
          ])

          if (signal.aborted) throw new Error(signal.reason)

          const blockchainsMap = new Map<string, Blockchain>()
          platforms.blockchains.forEach((blockchain) => {
            blockchainsMap.set(blockchain.id, blockchain)
          })
          myPlatforms.blockchains.forEach((blockchain) => {
            blockchainsMap.set(blockchain.id, blockchain)
          })

          const exchangesMap = new Map<string, Exchange>()
          platforms.exchanges.forEach((exchange) => {
            exchangesMap.set(exchange.id, exchange)
          })
          myPlatforms.exchanges.forEach((exchange) => {
            exchangesMap.set(exchange.id, exchange)
          })

          setPlatformsFound({
            blockchains: Array.from(blockchainsMap.values()),
            exchanges: Array.from(exchangesMap.values()),
          })
        } catch {
          setPlatformsFound({ blockchains: [], exchanges: [] })
        } finally {
          setPlatformsLoading(false)
        }
      },
      INPUT_DEBOUNCE_DURATION,
      {
        leading: false,
        maxWait: INPUT_MAX_DEBOUNCE_DURATION,
        trailing: true,
      }
    ),
    [rpc, activeAccount]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleExtensionsSearch = useCallback(
    debounce(
      async (query: string, signal: AbortSignal) => {
        if (!query || query.length < 1) {
          setExtensionsFound([])
          return
        }

        try {
          setExtensionsLoading(true)
          const extensions = await rpc.findExtensions(query)

          if (signal.aborted) throw new Error(signal.reason)

          setExtensionsFound(extensions)
        } catch {
          setExtensionsFound([])
        } finally {
          setExtensionsLoading(false)
        }
      },
      INPUT_DEBOUNCE_DURATION,
      {
        leading: false,
        maxWait: INPUT_MAX_DEBOUNCE_DURATION,
        trailing: true,
      }
    ),
    [rpc]
  )

  useEffect(() => {
    const controller = new AbortController()
    handleAssetsSearch(searchQuery, controller.signal)
    handleTxnsSearch(searchQuery, controller.signal)
    handlePlatformsSearch(searchQuery, controller.signal)
    handleExtensionsSearch(searchQuery, controller.signal)

    return function cleanup() {
      controller.abort("Result no longer needed.")
    }
  }, [
    searchQuery,
    handleAssetsSearch,
    handleTxnsSearch,
    handlePlatformsSearch,
    handleExtensionsSearch,
  ])

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
    const actions = Object.values(APP_ACTIONS)
    actions.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
    return actions
  }, [])

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
          action.perform?.(currentActionImpl)
          setTimeout(() => addToRecentActions(action.id), 50)
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

  const handleOpen = useCallback(() => {
    // onClick={() => kb.setVisualState(VisualState.animatingIn)}
    kb.setVisualState(VisualState.showing)
  }, [kb])

  const handleClose = useCallback(() => {
    // kb.setVisualState(VisualState.animatingOut)
    kb.setVisualState(VisualState.hidden)
  }, [kb])

  useEffect(() => {
    const handleEvent = (event: KeyboardEvent) => {
      if (isInputFocused()) return
      if (event.key === "/") {
        handleOpen()
      }
    }

    document.addEventListener("keydown", handleEvent)
    return () => {
      document.removeEventListener("keydown", handleEvent)
    }
  }, [handleOpen])

  // useEffect(() => {
  //   const handleEvent = () => {
  //     if (showing) {
  //       handleClose()
  //     }
  //   }

  //   document.addEventListener("popstate", handleEvent)
  //   return () => {
  //     document.removeEventListener("popstate", handleEvent)
  //   }
  // }, [handleClose, showing])

  return (
    <>
      <Tooltip title={SEARCH_PLACEHOLDER}>
        <Button
          onClick={handleOpen}
          variant="outlined"
          color="secondary"
          sx={{ gap: 2, paddingY: 0.5 }}
        >
          <span>Search</span>
          <Key>/</Key>
        </Button>
      </Tooltip>
      <Dialog open={showing} onClose={handleClose}>
        <>
          <Stack gap={1} padding={0.5} marginTop={0.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <SearchInput
                defaultPlaceholder={SEARCH_PLACEHOLDER}
                loading={txnsLoading || platformsLoading || assetsLoading || extensionsLoading}
              />
              <IconButton onClick={handleClose} size="small" color="secondary">
                <Close />
              </IconButton>
            </Stack>
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
