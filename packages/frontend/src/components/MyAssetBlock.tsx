import { Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { ReactNode } from "react"
import { $assetMap, $platformMap } from "src/stores/metadata-store"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"
import { CaptionText } from "./CaptionText"
import { Truncate } from "./Truncate"

type MyAssetBlockProps = {
  id?: string
  primary?: ReactNode
  secondary?: ReactNode
  showPlatform?: boolean
} & Omit<AssetAvatarProps, "alt" | "src">

/**
 * TODO8: needs tooltip, refactored alongside ForeignAssetBlock
 */
export function MyAssetBlock(props: MyAssetBlockProps) {
  const { id: assetId, primary = getAssetTicker(assetId), secondary, showPlatform, ...rest } = props

  const assetMap = useStore($assetMap, { keys: assetId ? [assetId] : [] })
  const platformMap = useStore($platformMap, { keys: assetId ? [getAssetPlatform(assetId)!] : [] })

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
          {primary}
          {showPlatform && assetId && getAssetPlatform(assetId) !== "ethereum" && (
            <CaptionText> - {platformMap[getAssetPlatform(assetId)!]?.name}</CaptionText>
          )}
        </Truncate>
        {secondary && <CaptionText>{secondary}</CaptionText>}
      </Stack>
    </Stack>
  )
}
