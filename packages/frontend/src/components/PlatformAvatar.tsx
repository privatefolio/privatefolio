import React from "react"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"

const BORDER_RADIUS_MAP: Record<NonNullable<AssetAvatarProps["size"]>, string> = {
  large: "6px",
  medium: "4px",
  small: "3px",
  snug: "2px",
}

export function PlatformAvatar(props: AssetAvatarProps) {
  return <AssetAvatar sx={{ borderRadius: BORDER_RADIUS_MAP[props.size || "medium"] }} {...props} />
}
