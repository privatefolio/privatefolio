import { Stack, Tooltip } from "@mui/material"
import React from "react"
import { PlatformId, PLATFORMS_META } from "src/settings"

import { AssetAvatarProps } from "./AssetAvatar"
import { PlatformAvatar } from "./PlatformAvatar"

type PlatformBlockProps = {
  hideName?: boolean
  platform: string
} & Omit<AssetAvatarProps, "alt" | "src">

export function PlatformBlock(props: PlatformBlockProps) {
  const { platform, hideName, ...rest } = props

  const meta = PLATFORMS_META[platform as PlatformId]

  if (!meta) return platform

  return (
    <Tooltip title={hideName ? PLATFORMS_META[platform].name : null}>
      <Stack direction="row" gap={0.5} alignItems="center" component="div">
        <PlatformAvatar
          size="small"
          src={meta.logoUrl}
          sx={{
            borderRadius: "2px",
          }}
          alt={meta.name}
          {...rest}
        />
        {!hideName && <span>{meta.name}</span>}
      </Stack>
    </Tooltip>
  )
}
