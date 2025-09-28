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
  Workspaces,
} from "@mui/icons-material"
import { ActionSection } from "kbar"
import { Priority } from "kbar/lib/types"
import { enqueueSnackbar } from "notistack"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { $addressBook } from "src/stores/metadata-store"
import {
  handleBackupRequest,
  handleExportAuditLogsRequest,
  handleExportTransactionsRequest,
  onRestoreRequest,
} from "src/utils/backup-utils"
import { downloadFile, requestFile } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { $debugMode } from "./stores/app-store"

export enum ActionId {
  EXPORT_ADDRESS_BOOK = "action-export-address-book",
  RESTORE_ADDRESS_BOOK = "action-restore-address-book",
  DELETE_ASSET_PRICES = "action-delete-asset-prices",
  DELETE_ASSET_PREFERENCES = "action-delete-asset-preferences",
  VERIFY_BALANCES = "action-verify-balances",
  REFRESH_ALL = "action-refresh-all",
  FETCH_ASSET_PRICES = "action-fetch-asset-prices",
  SYNC_ALL_CONNECTIONS = "action-sync-all-connections",
  RESET_ALL_CONNECTIONS = "action-reset-all-connections",
  DETECT_SPAM_TRANSACTIONS = "action-detect-spam-transactions",
  AUTO_MERGE_TRANSACTIONS = "action-auto-merge-txns",
  BACKUP_ACCOUNT = "action-backup-account",
  RESTORE_ACCOUNT = "action-restore-account",
  EXPORT_TRANSACTIONS = "action-export-transactions",
  EXPORT_AUDIT_LOGS = "action-export-audit-logs",
  REFETCH_PLATFORMS = "action-refetch-platforms",
  RECOMPUTE_TRADES = "action-recompute-trades",
  RECOMPUTE_BALANCES = "action-recompute-balances",
  RECOMPUTE_NETWORTH = "action-recompute-networth",
  RECOMPUTE_ALL = "action-recompute-all",
  DELETE_BALANCES = "action-delete-balances",
  DELETE_ALL = "action-delete-all",
  SLEEP_5S = "action-sleep-5s",
  SLEEP_50S = "action-sleep-50s",
  REFETCH_ALL_ASSETS = "action-refetch-all-assets",
}

const section: ActionSection = { name: "Actions", priority: 10 }

export declare type Action = {
  icon?: string | React.ReactElement | React.ReactNode
  id: ActionId
  keywords?: string
  name: string
  parent?: ActionId
  perform: () => Promise<void>
  priority?: Priority
  section?: ActionSection
  shortcut?: string[]
  subtitle?: string
}

export const APP_ACTIONS: Record<ActionId, Action> = {
  [ActionId.EXPORT_ADDRESS_BOOK]: {
    icon: <DownloadRounded fontSize="small" />,
    id: ActionId.EXPORT_ADDRESS_BOOK,
    keywords: "export address book",
    name: "Export address book",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const data = JSON.stringify($addressBook.get(), null, 2)
      const blob = new Blob([data], { type: "application/json" })
      downloadFile(blob, `${activeAccount}-address-book.json`)
    },
    priority: 5,
    section,
  },
  [ActionId.RESTORE_ADDRESS_BOOK]: {
    icon: <RestoreRounded fontSize="small" />,
    id: ActionId.RESTORE_ADDRESS_BOOK,
    keywords: "restore address book import",
    name: "Restore address book",
    perform: async () => {
      try {
        const activeAccount = $activeAccount.get()
        const rpc = $rpc.get()
        const files = await requestFile([".json"])
        const file = files[0]
        const text = await file.text()
        const addressBook = JSON.parse(text)
        if (typeof addressBook !== "object" || Array.isArray(addressBook) || addressBook === null) {
          enqueueSnackbar("Invalid address book JSON", { variant: "error" })
          return
        }
        await rpc.setValue(activeAccount, "address_book", JSON.stringify(addressBook))
        $addressBook.set(addressBook)
        enqueueSnackbar("Address book restored", { variant: "success" })
      } catch (err) {
        enqueueSnackbar(`Failed to restore address book: ${String(err)}`, {
          variant: "error",
        })
      }
    },
    priority: 5,
    section,
  },
  [ActionId.DELETE_ASSET_PRICES]: {
    icon: <DeleteForever fontSize="small" />,
    id: ActionId.DELETE_ASSET_PRICES,
    keywords: "delete asset prices",
    name: "Delete asset prices",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      await rpc.enqueueDeleteAssetPrices(activeAccount, "user")
    },
    priority: 0,
    section,
  },
  [ActionId.DELETE_ASSET_PREFERENCES]: {
    icon: <DeleteForever fontSize="small" />,
    id: ActionId.DELETE_ASSET_PREFERENCES,
    keywords: "delete asset preferences",
    name: "Delete asset preferences",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      await rpc.enqueueDeleteAssetPreferences(activeAccount, "user")
    },
    priority: 0,
    section,
  },
  [ActionId.VERIFY_BALANCES]: {
    icon: <CachedRounded fontSize="small" />,
    id: ActionId.VERIFY_BALANCES,
    keywords: "verify balances",
    name: "Verify balances",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      await rpc.enqueueVerifyBalances(activeAccount, "user")
    },
    priority: 0,
    section,
  },
  [ActionId.REFRESH_ALL]: {
    icon: <CachedRounded fontSize="small" />,
    id: ActionId.REFRESH_ALL,
    name: "Refresh all",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueFetchPrices(activeAccount, "user")
      rpc.enqueueRefreshBalances(activeAccount, "user")
      rpc.enqueueRefreshNetworth(activeAccount, "user")
      rpc.enqueueRefreshTrades(activeAccount, "user")
    },
    priority: 11,
    section,
    shortcut: ["$mod+a"],
    subtitle: "Refresh prices, networth, trades and more.",
  },
  [ActionId.FETCH_ASSET_PRICES]: {
    icon: <AttachMoneyRounded fontSize="small" />,
    id: ActionId.FETCH_ASSET_PRICES,
    name: "Fetch asset prices",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueFetchPrices(activeAccount, "user")
    },
    priority: 3,
    section,
  },
  [ActionId.SYNC_ALL_CONNECTIONS]: {
    icon: <CloudSyncRounded fontSize="small" />,
    id: ActionId.SYNC_ALL_CONNECTIONS,
    name: "Sync all connections",
    perform: async () => {
      $rpc.get().enqueueSyncAllConnections($activeAccount.get(), "user", $debugMode.get())
    },
    priority: 10,
    section,
  },
  [ActionId.RESET_ALL_CONNECTIONS]: {
    icon: <CloudSyncRounded fontSize="small" />,
    id: ActionId.RESET_ALL_CONNECTIONS,
    name: "Reset all connections",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueResetAllConnections(activeAccount, "user")
    },
    priority: 10,
    section,
  },
  [ActionId.DETECT_SPAM_TRANSACTIONS]: {
    icon: <PhishingRounded fontSize="small" />,
    id: ActionId.DETECT_SPAM_TRANSACTIONS,
    name: "Detect spam transactions",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueDetectSpamTransactions(activeAccount, "user")
    },
    priority: 1,
    section,
  },
  [ActionId.AUTO_MERGE_TRANSACTIONS]: {
    icon: <CallMergeRounded fontSize="small" />,
    id: ActionId.AUTO_MERGE_TRANSACTIONS,
    name: "Auto-merge transactions",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueAutoMerge(activeAccount, "user")
    },
    priority: 1,
    section,
  },
  [ActionId.BACKUP_ACCOUNT]: {
    icon: <BackupRounded fontSize="small" />,
    id: ActionId.BACKUP_ACCOUNT,
    keywords: "backup account restore",
    name: "Backup account",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      handleBackupRequest(rpc, activeAccount)
    },
    priority: 9,
    section,
  },
  [ActionId.RESTORE_ACCOUNT]: {
    icon: <RestoreRounded fontSize="small" />,
    id: ActionId.RESTORE_ACCOUNT,
    keywords: "restore account backup",
    name: "Restore account",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      onRestoreRequest(rpc, activeAccount, () => {
        // Empty function for compatibility
        // TODO9
      })
    },
    priority: 9,
    section,
  },
  [ActionId.EXPORT_TRANSACTIONS]: {
    icon: <DownloadRounded fontSize="small" />,
    id: ActionId.EXPORT_TRANSACTIONS,
    keywords: "export transactions",
    name: "Export transactions",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      handleExportTransactionsRequest(rpc, activeAccount)
    },
    priority: 5,
    section,
  },
  [ActionId.EXPORT_AUDIT_LOGS]: {
    icon: <DownloadRounded fontSize="small" />,
    id: ActionId.EXPORT_AUDIT_LOGS,
    keywords: "export audit logs",
    name: "Export audit logs",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      handleExportAuditLogsRequest(rpc, activeAccount)
    },
    priority: 5,
    section,
  },
  [ActionId.REFETCH_PLATFORMS]: {
    icon: <AccountBalanceRounded fontSize="small" />,
    id: ActionId.REFETCH_PLATFORMS,
    name: "Refetch asset platforms",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueRefetchPlatforms(activeAccount, "user")
    },
    priority: 2,
    section,
  },
  [ActionId.RECOMPUTE_TRADES]: {
    icon: <CalculateOutlined fontSize="small" />,
    id: ActionId.RECOMPUTE_TRADES,
    name: "Recompute trades",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueRecomputeTrades(activeAccount, "user")
    },
    priority: 3,
    section,
  },
  [ActionId.RECOMPUTE_BALANCES]: {
    icon: <CalculateOutlined fontSize="small" />,
    id: ActionId.RECOMPUTE_BALANCES,
    name: "Recompute balances",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueRecomputeBalances(activeAccount, "user")
    },
    priority: 3,
    section,
  },
  [ActionId.RECOMPUTE_NETWORTH]: {
    icon: <CalculateOutlined fontSize="small" />,
    id: ActionId.RECOMPUTE_NETWORTH,
    name: "Recompute networth",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueRecomputeNetworth(activeAccount, "user")
    },
    priority: 3,
    section,
  },
  [ActionId.RECOMPUTE_ALL]: {
    icon: <CalculateOutlined fontSize="small" />,
    id: ActionId.RECOMPUTE_ALL,
    name: "Recompute all",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueRecomputeTrades(activeAccount, "user")
      rpc.enqueueRecomputeBalances(activeAccount, "user")
      rpc.enqueueRecomputeNetworth(activeAccount, "user")
    },
    priority: 4,
    section,
    subtitle: "Recompute trades, balances and networth",
  },
  [ActionId.DELETE_BALANCES]: {
    icon: <DeleteForever fontSize="small" />,
    id: ActionId.DELETE_BALANCES,
    name: "Delete balances",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueDeleteBalances(activeAccount, "user")
    },
    priority: 0,
    section,
  },
  [ActionId.DELETE_ALL]: {
    icon: <DeleteForever fontSize="small" />,
    id: ActionId.DELETE_ALL,
    name: "Delete all",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueDeleteAssetPrices(activeAccount, "user")
      rpc.enqueueDeleteAssetPreferences(activeAccount, "user")
      rpc.enqueueDeleteBalances(activeAccount, "user")
    },
    priority: 0,
    section,
    subtitle: "Delete asset prices, preferences and balances",
  },
  [ActionId.SLEEP_5S]: {
    icon: <Bedtime fontSize="small" />,
    id: ActionId.SLEEP_5S,
    name: "Sleep 5s",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueSleep(activeAccount, 5, 1, true)
    },
    priority: 0,
    section,
  },
  [ActionId.SLEEP_50S]: {
    icon: <Bedtime fontSize="small" />,
    id: ActionId.SLEEP_50S,
    name: "Sleep 50s",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueSleep(activeAccount, 50, 10, true)
    },
    priority: 0,
    section,
  },
  [ActionId.REFETCH_ALL_ASSETS]: {
    icon: <Workspaces fontSize="small" />,
    id: ActionId.REFETCH_ALL_ASSETS,
    name: "Refetch all assets",
    perform: async () => {
      const activeAccount = $activeAccount.get()
      const rpc = $rpc.get()
      rpc.enqueueRefetchAssets(activeAccount, "user")
    },
    priority: 2,
    section,
  },
}
