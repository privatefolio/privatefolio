import { Box, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { Asset } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { MonoFont } from "src/theme"
import { getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

import { AssetAvatar } from "./AssetAvatar"
import { IdentifierBlock, IdentifierBlockProps } from "./IdentifierBlock"

export type ForeignAssetBlockProps = Omit<IdentifierBlockProps, "id"> & {
  asset?: Asset
  coingeckoId?: string
}

export function ForeignAssetBlock(props: ForeignAssetBlockProps) {
  const { coingeckoId, asset: cachedValue, ...rest } = props

  const [asset, setAsset] = useState<Asset | undefined | null>(cachedValue)

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (!cachedValue && coingeckoId) {
      rpc.getAsset(activeAccount, coingeckoId).then((x) => {
        setAsset(x ?? null)
      })
    }
  }, [coingeckoId, cachedValue, rpc, activeAccount])

  const assetId = useMemo(() => {
    if (!asset) return `coingecko:${coingeckoId}`
    return asset.id
  }, [asset, coingeckoId])

  if (asset === undefined) return null

  return (
    <IdentifierBlock
      label={getAssetTicker(assetId)}
      id={assetId}
      avatar={
        <AssetAvatar
          src={asset?.logoUrl}
          alt={asset?.symbol || getAssetTicker(assetId)}
          size="small"
        />
      }
      size="small"
      href={`../asset/${assetId}`}
      linkText={
        <Stack alignItems="center">
          <span>View asset</span>
          <Box sx={{ fontFamily: MonoFont }}>
            <span className="secondary">({assetId})</span>
          </Box>
        </Stack>
      }
      {...rest}
    />
  )
}
