import { AutoAwesomeRounded } from "@mui/icons-material"
import { AssistantModel } from "privatefolio-backend/src/settings/assistant-models"
import React from "react"
import { resolveUrl } from "src/utils/utils"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"

export function AssistantModelAvatar(props: { model: AssistantModel } & AssetAvatarProps) {
  const { model, ...rest } = props

  if (model.family === "custom") {
    return (
      <AssetAvatar
        sx={{
          "&.MuiAvatar-colorDefault": {
            background: "none",
            border: "none",
            borderRadius: "0px",
            color: "inherit",
          },
          borderRadius: "0px",
        }}
        fallback={<AutoAwesomeRounded sx={{ fontSize: "1rem !important" }} />}
        alt={model.family}
        {...rest}
      />
    )
  }

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
