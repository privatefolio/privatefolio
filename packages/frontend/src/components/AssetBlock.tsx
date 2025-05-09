import { Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { ReactNode } from "react"
import { PLATFORMS_META } from "src/settings"
import { $assetMap } from "src/stores/metadata-store"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"
import { Truncate } from "./Truncate"

type AssetBlockProps = {
  assetId?: string
  secondary?: ReactNode
  showPlatform?: boolean
} & Omit<AssetAvatarProps, "alt" | "src">

export function AssetBlock(props: AssetBlockProps) {
  const { assetId, secondary, showPlatform, ...rest } = props
  const assetMap = useStore($assetMap, { keys: assetId ? [assetId] : [] })

  return (
    <Stack
      direction="row"
      gap={props.size === "small" ? 0.75 : 1}
      alignItems="center"
      component="div"
      color={assetId ? undefined : "text.secondary"}
    >
      <AssetAvatar
        size="small"
        src={assetId ? assetMap[assetId]?.logoUrl : undefined}
        alt={assetId ? getAssetTicker(assetId) : undefined}
        {...rest}
      />
      <Stack>
        <Truncate>
          {getAssetTicker(assetId)}
          {showPlatform && assetId && getAssetPlatform(assetId) !== "ethereum" && (
            <Typography
              color="text.secondary"
              variant="caption"
              fontWeight={300}
              letterSpacing={0.5}
            >
              {" "}
              - {PLATFORMS_META[getAssetPlatform(assetId)].name}
            </Typography>
          )}
        </Truncate>
        {secondary && (
          <Typography color="text.secondary" variant="caption" fontWeight={300} letterSpacing={0.5}>
            {secondary}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
