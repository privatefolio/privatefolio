import { alpha, Avatar, AvatarProps, styled, Typography } from "@mui/material"
import React, { useMemo } from "react"
import { resolveUrl } from "src/utils/utils"

import { MonoFont } from "../theme"
import { stringToColor } from "../utils/color-utils"

const StyledAvatar = styled(Avatar)`
  border-radius: unset;
  & img {
    object-fit: contain;
  }
  &.MuiAvatar-colorDefault {
    border: 1px solid ${({ color = "#fff" }) => alpha(color, 0.25)};
    background: ${({ color = "#fff" }) => alpha(color, 0.15)};
    border-radius: 50%;
  }
`

export interface AssetAvatarProps extends AvatarProps {
  alt?: string
  size?: "small" | "medium" | "large" | "snug"
}

const SIZE_MAP = {
  large: 50,
  medium: 34,
  small: 16,
  snug: 20,
}

const FONT_SIZE_MAP = {
  large: "1rem",
  medium: "0.8rem",
  small: "0.625rem",
  snug: "0.5rem",
}

export function AssetAvatar(props: AssetAvatarProps) {
  const { alt = "", src, size = "medium", sx, ...rest } = props
  const color = stringToColor(alt)

  const source = useMemo(() => resolveUrl(src), [src])

  return (
    <StyledAvatar
      sx={{
        height: SIZE_MAP[size],
        visibility: alt ? "visible" : "hidden",
        width: SIZE_MAP[size],
        ...sx,
      }}
      color={color}
      src={source}
      {...rest}
    >
      <Typography
        fontWeight={500}
        fontSize={FONT_SIZE_MAP[size]}
        lineHeight={1.5}
        fontFamily={MonoFont}
        color={color}
        component="div"
      >
        {alt.slice(0, size === "small" ? 1 : 3)}
      </Typography>
    </StyledAvatar>
  )
}
