import React from "react"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"

export function ExtensionAvatar(props: AssetAvatarProps) {
  return <AssetAvatar sx={{ borderRadius: "0px" }} {...props} />
}
