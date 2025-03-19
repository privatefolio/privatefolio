import React from "react"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"

export function PlatformAvatar(props: AssetAvatarProps) {
  return <AssetAvatar sx={{ borderRadius: "2px" }} {...props} />
}
