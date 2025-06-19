import React, { useEffect, useState } from "react"
import { fetchGitHubUser, GitHubUser } from "src/utils/github-utils"
import { noop } from "src/utils/utils"

import { AssetAvatar, AssetAvatarProps } from "./AssetAvatar"
import { IdentifierBlock } from "./IdentifierBlock"

interface GitHubUserBlockProps extends Omit<AssetAvatarProps, "alt"> {
  username: string
}

export function GitHubUserBlock({ username, size, ...props }: GitHubUserBlockProps) {
  const [user, setUser] = useState<GitHubUser | null>(null)

  useEffect(() => {
    if (!username) return

    fetchGitHubUser(username).then(setUser).catch(noop)
  }, [username])

  const displayName = user?.name || username
  const avatar = user?.avatar_url
  const githubUrl = `https://github.com/${username}`

  return (
    <IdentifierBlock
      label={displayName}
      id={username}
      avatar={
        <AssetAvatar
          src={avatar}
          alt={displayName}
          sx={{ "&.MuiAvatar-colorDefault": { borderRadius: 1 }, borderRadius: 1 }}
          size={size === "small" ? "small" : "snug"}
          {...props}
        />
      }
      size={size === "small" ? "small" : "medium"}
      href={githubUrl}
      linkText="View on GitHub"
    />
  )
}
