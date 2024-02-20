import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $assetMetaMap } from "src/stores/metadata-store"
import { getAssetTicker } from "src/utils/assets-utils"

import { AssetAvatar } from "./AssetAvatar"
import { Truncate } from "./Truncate"

type AssetBlockProps = {
  asset?: string
}

export function AssetBlock(props: AssetBlockProps) {
  const assetMap = useStore($assetMetaMap)
  const { asset } = props

  return (
    <Stack
      direction="row"
      gap={0.75}
      alignItems="center"
      component="div"
      color={asset ? undefined : "text.secondary"}
    >
      <AssetAvatar
        size="small"
        src={asset ? assetMap[asset]?.image : undefined}
        alt={asset ? getAssetTicker(asset) : undefined}
      />
      <Truncate>{getAssetTicker(asset)}</Truncate>
    </Stack>
  )
}