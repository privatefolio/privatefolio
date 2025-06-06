import { RichExtension } from "src/interfaces"
import { extensions } from "src/settings/extensions"

import { getPlatformsByIds } from "./platforms-api"

export const getExtensions = async (documentedOnly = false): Promise<RichExtension[]> => {
  const platforms = await getPlatformsByIds(extensions.flatMap((x) => x.platformIds ?? []))
  const richExtensions: RichExtension[] = extensions.map((x) => ({
    ...x,
    platforms: platforms.filter((platform) => (x.platformIds as string[])?.includes(platform.id)),
  }))

  richExtensions.sort((a, b) => {
    if (a.extensionName && b.extensionName) {
      return a.extensionName.localeCompare(b.extensionName)
    }
    return 0
  })

  if (documentedOnly) {
    return richExtensions.filter((x) => !!x.howTo)
  }

  return richExtensions
}

export const getExtension = async (id: string): Promise<RichExtension | undefined> => {
  const extension = extensions.find((x) => x.id === id)
  if (!extension) {
    return undefined
  }

  const platforms = await getPlatformsByIds(extension.platformIds ?? [])
  return {
    ...extension,
    platforms: platforms.filter((platform) =>
      (extension.platformIds as string[])?.includes(platform.id)
    ),
  }
}
