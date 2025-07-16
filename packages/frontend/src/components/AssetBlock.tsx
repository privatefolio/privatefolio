import { Skeleton } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { useAsset } from "src/hooks/useAsset"
import { Asset } from "src/interfaces"
import { $activeAccountPath } from "src/stores/account-store"
import { getAssetTicker } from "src/utils/assets-utils"

import { AssetAvatar } from "./AssetAvatar"
import { IdentifierBlock, IdentifierBlockProps } from "./IdentifierBlock"

export type AssetBlockProps = Omit<IdentifierBlockProps, "id"> & {
  asset?: Asset
  id?: string
  showLoading?: boolean
}

export function AssetBlock(props: AssetBlockProps) {
  const { id, asset: cachedValue, size = "small", showLoading, ...rest } = props

  const [asset, isLoading, assetId] = useAsset(id, cachedValue)
  const activeAccountPath = useStore($activeAccountPath)

  if (isLoading && showLoading) return <Skeleton width={80} sx={{ marginX: 2 }} />
  if (!asset) return null

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
