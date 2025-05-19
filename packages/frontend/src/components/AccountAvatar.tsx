import { Cloud } from "@mui/icons-material"
import { Avatar, AvatarProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import { keccak256, toUtf8Bytes } from "ethers"
import { memoize } from "lodash-es"
import React, { useMemo } from "react"
import { $cloudAccounts } from "src/stores/account-store"

export interface AccountAvatarProps extends AvatarProps {
  alt?: string
  size?: "small" | "medium" | "large" | "xl"
}

export const SIZE_MAP = {
  large: 50,
  medium: 28,
  small: 20,
  xl: 124,
}

// const BORDER_RADIUS_MAP = {
//   large: 2,
//   medium: 1.5,
//   small: 1.25,
//   xl: 0.25,
// }

export function AccountAvatar(props: AccountAvatarProps) {
  const { alt: accountName = "", size = "small", sx, ...rest } = props
  const colors = getGradientColors(stringToHex(accountName))

  const cloudAccounts = useStore($cloudAccounts)

  const isCloudAccount = useMemo(
    () => cloudAccounts?.includes(accountName),
    [cloudAccounts, accountName]
  )

  return (
    <Avatar
      sx={{
        backgroundColor: colors[0],
        backgroundImage: `
        radial-gradient(at 80% 100%, ${colors[1]} 0px, transparent 50%),
        radial-gradient(at -30% 70%, ${colors[2]} 0px, transparent 100%),
        radial-gradient(at 120% 120%, ${colors[3]} 0px, transparent 50%),
        radial-gradient(at -40% 90%, ${colors[4]} 0px, transparent 50%)`,
        // boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
        // borderRadius: BORDER_RADIUS_MAP[size],
        borderRadius: 0.25,
        color: "transparent",
        height: SIZE_MAP[size],
        position: "relative",
        width: SIZE_MAP[size],
        ...sx,
      }}
      {...rest}
    >
      {accountName}
      {isCloudAccount && size !== "xl" && (
        <Cloud
          sx={{
            color: "var(--mui-palette-background-default)",
            fontSize: 12,
            left: "50%",
            opacity: 1,
            position: "absolute",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      {isCloudAccount && size === "xl" && (
        <Cloud
          sx={{
            color: "var(--mui-palette-background-default)",
            fontSize: 20,
            opacity: 1,
            position: "absolute",
            right: 10,
            top: 5,
          }}
        />
      )}
    </Avatar>
  )
}

export const stringToHex = memoize((string: string) => keccak256(toUtf8Bytes(string)))

// https://github.com/JackHamer09/web3-avatar/blob/main/js/index.ts
export const getGradientColors = memoize((address: string) => {
  const seedArr = address.match(/.{1,7}/gi)?.splice(0, 5)
  const colors: string[] = []

  seedArr?.forEach((seed) => {
    let hash = 0
    for (let i = 0; i < seed.length; i += 1) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
      hash = hash & hash
    }

    const rgb = [0, 0, 0]
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 255
      rgb[i] = value
    }
    colors.push(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`)
  })

  return colors
})
