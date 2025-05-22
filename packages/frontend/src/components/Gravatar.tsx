import { Avatar, AvatarProps } from "@mui/material"
import md5 from "md5"
import React, { useMemo } from "react"

export function Gravatar(props: { email?: string } & AvatarProps) {
  const { email, ...rest } = props

  const gravatar = useMemo(
    () => (email ? `https://www.gravatar.com/avatar/${md5(email)}` : undefined),
    [email]
  )

  return (
    <Avatar src={gravatar} {...rest}>
      {email?.[0].toUpperCase()}
    </Avatar>
  )
}
