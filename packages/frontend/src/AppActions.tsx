import { CachedRounded, DeleteForever, DownloadRounded, RestoreRounded } from "@mui/icons-material"
import { ActionSection } from "kbar"
import { Priority } from "kbar/lib/types"
import { enqueueSnackbar } from "notistack"
import React from "react"
import { $activeAccount } from "src/stores/account-store"
import { $addressBook, fetchInMemoryData } from "src/stores/metadata-store"
import { downloadFile, requestFile } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

export enum ActionId {
  EXPORT_ADDRESS_BOOK = "action-export-address-book",
  RESTORE_ADDRESS_BOOK = "action-restore-address-book",
  DELETE_ASSET_PRICES = "action-delete-asset-prices",
  DELETE_ASSET_PREFERENCES = "action-delete-asset-preferences",
  VERIFY_BALANCES = "action-verify-balances",
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
        enqueueSnackbar("Address book restored successfully", { variant: "success" })
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
      await fetchInMemoryData(rpc, activeAccount)
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
}
