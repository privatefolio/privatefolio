import { Box, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Platform } from "src/interfaces"
import { MonoFont } from "src/theme"
import { $rpc } from "src/workers/remotes"

import { IdentifierBlock, IdentifierBlockProps } from "./IdentifierBlock"
import { PlatformAvatar } from "./PlatformAvatar"

export type PlatformBlockProps = Omit<IdentifierBlockProps, "id"> & {
  id?: string
  platform?: Platform
}

export function PlatformBlock(props: PlatformBlockProps) {
  const { id, platform: cachedValue, ...rest } = props

  const [platform, setPlatform] = useState<Platform | undefined>(cachedValue)
  const rpc = useStore($rpc)

  useEffect(() => {
    if (!cachedValue && id) {
      rpc.getPlatform(id).then(setPlatform)
    }
  }, [id, cachedValue, rpc])

  if (!platform) return null

  return (
    <IdentifierBlock
      id={id || platform.id}
      href={`../platform/${id || platform.id}`}
      label={platform.name}
      avatar={<PlatformAvatar src={platform.image} alt={platform.name} size="small" />}
      size="small"
      linkText={
        <Stack alignItems="center">
          <span>View platform</span>
          <Box sx={{ fontFamily: MonoFont }}>
            <span className="secondary">({platform.id})</span>
          </Box>
        </Stack>
      }
      {...rest}
    />
  )
}
