import { useStore } from "@nanostores/react"
import { useEffect, useMemo, useState } from "react"
import { MyAsset } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $assetMap, $inMemoryDataQueryTime } from "src/stores/metadata-store"
import { $rpc } from "src/workers/remotes"

export function useAsset(id?: string, cachedValue?: MyAsset) {
  const [loading, setLoading] = useState(false)
  const [asset, setAsset] = useState<MyAsset | undefined>(cachedValue)

  const inMemoryDataQueryTime = useStore($inMemoryDataQueryTime)
  const assetMap = useStore($assetMap)

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (!id || inMemoryDataQueryTime === null) return

    if (assetMap[id]) {
      setAsset(assetMap[id])
      return
    }

    if (!cachedValue) {
      setLoading(true)
      rpc
        .getAsset(activeAccount, id)
        .then(setAsset)
        .finally(() => {
          setLoading(false)
        })
    }
  }, [id, cachedValue, rpc, activeAccount, inMemoryDataQueryTime, assetMap])

  const assetId = useMemo(() => {
    if (!asset) return id!
    return asset.id
  }, [asset, id])

  return [asset, loading, assetId] as const
}
