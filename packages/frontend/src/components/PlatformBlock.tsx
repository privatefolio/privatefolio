import { Box, Skeleton, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { usePlatform } from "src/hooks/usePlatform"
import { Platform } from "src/interfaces"
import { $activeAccountPath } from "src/stores/account-store"
import { MonoFont } from "src/theme"

import { IdentifierBlock, IdentifierBlockProps } from "./IdentifierBlock"
import { PlatformAvatar } from "./PlatformAvatar"
import { SupportedCheckmark } from "./SupportedCheckmark"

export type PlatformBlockProps = Omit<IdentifierBlockProps, "id"> & {
  id?: string
  platform?: Platform
  showLoading?: boolean
  showSupported?: boolean
}

export function PlatformBlock(props: PlatformBlockProps) {
  const { id, platform: cachedValue, size = "small", showLoading, showSupported, ...rest } = props

  const [platform, isLoading, platformId] = usePlatform(id, cachedValue)

  const activeAccountPath = useStore($activeAccountPath)

  if (isLoading && showLoading) return <Skeleton width={80} sx={{ marginX: 2 }} />
  if (!platform) return null

  return (
    <IdentifierBlock
      id={platformId}
      href={`${activeAccountPath}/platform/${platformId}`}
      label={
        <>
          {platform?.name || "Unknown"}{" "}
          {showSupported && <SupportedCheckmark extensions={platform?.extensionsIds} />}
        </>
      }
      avatar={<PlatformAvatar src={platform?.image} alt={platform?.name} size={size} />}
      size={size}
      linkText={
        <Stack alignItems="center">
          <span>View platform</span>
          <Box sx={{ fontFamily: MonoFont }}>
            <span className="secondary">({platformId})</span>
          </Box>
        </Stack>
      }
      {...rest}
    />
  )
}
