import { Stack, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { PLATFORMS_META } from "src/settings"
import { $platformMetaMap } from "src/stores/metadata-store"

import { AssetAvatarProps } from "./AssetAvatar"
import { PlatformAvatar } from "./PlatformAvatar"

type PlatformBlockProps = {
  hideName?: boolean
  platform: string
} & Omit<AssetAvatarProps, "alt" | "src">

export function PlatformBlock(props: PlatformBlockProps) {
  const { platform, hideName, ...rest } = props
  const platformMetaMap = useStore($platformMetaMap)

  return (
    <Tooltip title={hideName ? PLATFORMS_META[platform].name : null}>
      <Stack direction="row" gap={0.5} alignItems="center" component="div">
        <PlatformAvatar
          size="small"
          src={platformMetaMap[platform]?.image}
          sx={{
            borderRadius: "2px",
          }}
          alt={PLATFORMS_META[platform].name}
          {...rest}
        />
        {!hideName && <span>{PLATFORMS_META[platform].name}</span>}
      </Stack>
    </Tooltip>
  )
}
