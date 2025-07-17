import { useStore } from "@nanostores/react"
import { useEffect, useMemo, useState } from "react"
import { Platform } from "src/interfaces"
import { $inMemoryDataQueryTime, $platformMap } from "src/stores/metadata-store"
import { $rpc } from "src/workers/remotes"

export function usePlatform(id?: string, cachedValue?: Platform) {
  const [loading, setLoading] = useState(false)
  const [platform, setPlatform] = useState<Platform | undefined>(cachedValue)

  const inMemoryDataQueryTime = useStore($inMemoryDataQueryTime)
  const platformMap = useStore($platformMap)

  const rpc = useStore($rpc)

  useEffect(() => {
    if (!id || inMemoryDataQueryTime === null) return

    if (platformMap[id]) {
      setPlatform(platformMap[id])
      return
    }

    if (!cachedValue) {
      setLoading(true)
      rpc
        .getPlatform(id)
        .then(setPlatform)
        .finally(() => {
          setLoading(false)
        })
    }
  }, [id, cachedValue, rpc, inMemoryDataQueryTime, platformMap])

  const platformId = useMemo(() => {
    if (!platform) return id!
    return platform.id
  }, [platform, id])

  return [platform, loading, platformId] as const
}
