import { Box, Skeleton, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo, useState } from "react"
import { Platform } from "src/interfaces"
import { $activeAccountPath } from "src/stores/account-store"
import { $inMemoryDataQueryTime, $platformMap } from "src/stores/metadata-store"
import { MonoFont } from "src/theme"
import { $rpc } from "src/workers/remotes"

import { IdentifierBlock, IdentifierBlockProps } from "./IdentifierBlock"
import { PlatformAvatar } from "./PlatformAvatar"

export type PlatformBlockProps = Omit<IdentifierBlockProps, "id"> & {
  id?: string
  platform?: Platform
  showLoading?: boolean
}

export function PlatformBlock(props: PlatformBlockProps) {
  const { id, platform: cachedValue, size = "small", showLoading, ...rest } = props

  const [platform, setPlatform] = useState<Platform | undefined | null>(cachedValue)

  const inMemoryDataQueryTime = useStore($inMemoryDataQueryTime)
  const platformMap = useStore($platformMap)

  const rpc = useStore($rpc)
  const activeAccountPath = useStore($activeAccountPath)

  useEffect(() => {
    if (!id || inMemoryDataQueryTime === null) return

    if (platformMap[id]) {
      setPlatform(platformMap[id])
      return
    }

    if (!cachedValue) {
      rpc.getPlatform(id).then((x) => {
        setPlatform(x ?? null)
      })
    }
  }, [id, cachedValue, rpc, platformMap, inMemoryDataQueryTime])

  const platformId = useMemo(() => {
    if (!platform) return id!
    return platform.id
  }, [platform, id])

  if (platform === undefined && !showLoading) return null
  if (platform === undefined && showLoading) return <Skeleton width={80} sx={{ marginX: 2 }} />

  return (
    <IdentifierBlock
      id={platformId}
      href={`${activeAccountPath}/platform/${platformId}`}
      label={platform?.name}
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
