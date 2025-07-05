import { AssistantModel } from "privatefolio-backend/src/settings/assistant-models"
import React from "react"
import { resolveUrl } from "src/utils/utils"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"

export function AssistantModelAvatar(props: { model: AssistantModel } & AssetAvatarProps) {
  const { model, ...rest } = props

  return (
    <AssetAvatar
      sx={{
        "&.MuiAvatar-colorDefault": {
          borderRadius: "0px",
        },
        borderRadius: "0px",
      }}
      src={resolveUrl(`$STATIC_ASSETS/extensions/${model.family}.svg`)}
      alt={model.family}
      {...rest}
    />
  )
}
