import React from "react"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"

export function ExtensionAvatar(props: AssetAvatarProps) {
  return (
    <AssetAvatar
      sx={{
        "&.MuiAvatar-colorDefault": {
          borderRadius: "0px",
        },
        borderRadius: "0px",
      }}
      {...props}
    />
  )
}
