import { Skeleton } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { Asset } from "src/interfaces"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { $assetMap, $inMemoryDataQueryTime } from "src/stores/metadata-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

import { AssetAvatar } from "./AssetAvatar"
import { IdentifierBlock, IdentifierBlockProps } from "./IdentifierBlock"

export type AssetBlockProps = Omit<IdentifierBlockProps, "id"> & {
  asset?: Asset
  id?: string
  showLoading?: boolean
}

export function AssetBlock(props: AssetBlockProps) {
  const { id, asset: cachedValue, size = "small", showLoading, ...rest } = props

  const [asset, setAsset] = useState<Asset | undefined | null>(cachedValue)

  const inMemoryDataQueryTime = useStore($inMemoryDataQueryTime)
  const assetMap = useStore($assetMap)

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const activeAccountPath = useStore($activeAccountPath)

  useEffect(() => {
    if (!id || inMemoryDataQueryTime === null) return

    if (assetMap[id]) {
      setAsset(assetMap[id])
      return
    }

    if (!cachedValue) {
      rpc.getAsset(activeAccount, id).then((x) => {
        setAsset(x ?? null)
      })
    }
  }, [id, cachedValue, rpc, activeAccount, inMemoryDataQueryTime, assetMap])

  const assetId = useMemo(() => {
    if (!asset) return id!
    return asset.id
  }, [asset, id])

  if (asset === undefined && !showLoading) return null
  if (asset === undefined && showLoading) return <Skeleton width={80} sx={{ marginX: 2 }} />

  return (
    <IdentifierBlock
      label={getAssetTicker(assetId)}
      id={assetId}
      avatar={
        <AssetAvatar
          src={asset?.logoUrl}
          alt={asset?.symbol || getAssetTicker(assetId)}
          size={size}
        />
      }
      size={size}
      href={`${activeAccountPath}/asset/${encodeURI(assetId)}`}
      linkText="View asset"
      {...rest}
    />
  )
}
