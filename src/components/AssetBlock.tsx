import { Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { ReactNode } from "react"
import { $assetMetaMap } from "src/stores/metadata-store"
import { getAssetTicker } from "src/utils/assets-utils"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"
import { Truncate } from "./Truncate"

type AssetBlockProps = {
  asset?: string
  secondary?: ReactNode
} & Omit<AssetAvatarProps, "alt" | "src">

export function AssetBlock(props: AssetBlockProps) {
  const assetMap = useStore($assetMetaMap)
  const { asset, secondary, ...rest } = props

  return (
    <Stack
      direction="row"
      gap={props.size === "small" ? 0.75 : 1}
      alignItems="center"
      component="div"
      color={asset ? undefined : "text.secondary"}
    >
      <AssetAvatar
        size="small"
        src={asset ? assetMap[asset]?.image : undefined}
        alt={asset ? getAssetTicker(asset) : undefined}
        {...rest}
      />
      <Stack>
        <Truncate>{getAssetTicker(asset)}</Truncate>
        {secondary && (
          <Typography color="text.secondary" variant="caption" fontWeight={300} letterSpacing={0.5}>
            {secondary}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
