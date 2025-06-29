import { Box, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { RichExtension } from "src/interfaces"
import { MonoFont } from "src/theme"
import { $rpc } from "src/workers/remotes"

import { ExtensionAvatar } from "./ExtensionAvatar"
import { IdentifierBlock, IdentifierBlockProps } from "./IdentifierBlock"

export type ExtensionBlockProps = Omit<IdentifierBlockProps, "id"> & {
  extension?: RichExtension
  id?: string
}

export function ExtensionBlock(props: ExtensionBlockProps) {
  const { id, extension: cachedValue, size = "small", ...rest } = props

  const [extension, setExtension] = useState<RichExtension | undefined>(cachedValue)
  const rpc = useStore($rpc)

  useEffect(() => {
    if (!cachedValue && id) {
      rpc.getExtension(id).then(setExtension)
    }
  }, [id, cachedValue, rpc])

  if (!extension) return null

  return (
    <IdentifierBlock
      label={extension?.extensionName}
      id={id || extension.id}
      avatar={
        <ExtensionAvatar
          src={extension?.extensionLogoUrl}
          alt={extension?.extensionName}
          size={size}
        />
      }
      size={size}
      href={`../extension/${id || extension.id}`}
      linkText={
        <Stack alignItems="center">
          <span>View extension</span>
          <Box sx={{ fontFamily: MonoFont }}>
            <span className="secondary">({extension.id})</span>
          </Box>
        </Stack>
      }
      {...rest}
    />
  )
}
