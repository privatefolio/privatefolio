import { StarRounded } from "@mui/icons-material"
import { Autocomplete, Box, Fade, TextField, TextFieldProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import { debounce } from "lodash-es"
import { isBlockchain } from "privatefolio-backend/src/utils/utils"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Platform } from "src/interfaces"
import { INPUT_DEBOUNCE_DURATION, INPUT_MAX_DEBOUNCE_DURATION } from "src/settings"
import { $activeAccount } from "src/stores/account-store"
import { $platformMap } from "src/stores/metadata-store"
import { $rpc } from "src/workers/remotes"

import { CircularSpinner } from "./CircularSpinner"
import { PlatformAvatar } from "./PlatformAvatar"
import { PlatformBlock } from "./PlatformBlock"

type PlatformInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  onChange: (value: string) => void
  value: string
}

export function PlatformInput(props: PlatformInputProps) {
  const { value, onChange, sx, ...rest } = props

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const myPlatformsMap = useStore($platformMap)

  const [query, setQuery] = useState(value)
  const [searchResults, setSearchResults] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce(
      async (query: string, signal: AbortSignal) => {
        setLoading(true)
        const [coingecko, myPlatforms] = await Promise.all([
          rpc.findPlatforms(activeAccount, query, 3, true, "coingecko"),
          rpc.findPlatforms(activeAccount, query, 3, true, "my-platforms"),
        ])

        setLoading(false)
        if (signal.aborted) return

        const platformMap = new Map<string, Platform>()
        coingecko.blockchains.forEach((platform) => {
          platformMap.set(platform.id, platform)
        })
        coingecko.exchanges.forEach((platform) => {
          platformMap.set(platform.id, platform)
        })
        myPlatforms.blockchains.forEach((platform) => {
          platformMap.set(platform.id, platform)
        })
        myPlatforms.exchanges.forEach((platform) => {
          platformMap.set(platform.id, platform)
        })

        setSearchResults(Array.from(platformMap.values()))
      },
      INPUT_DEBOUNCE_DURATION,
      {
        leading: false,
        maxWait: INPUT_MAX_DEBOUNCE_DURATION,
        trailing: true,
      }
    ),
    [rpc, activeAccount]
  )

  useEffect(() => {
    const controller = new AbortController()
    handleSearch(query, controller.signal)

    return function cleanup() {
      controller.abort("Result no longer needed.")
    }
  }, [query, handleSearch])

  const { platformsMap, platformIds } = useMemo(() => {
    const platformsMap: Record<string, Platform> = {}

    searchResults.forEach((platform) => {
      platformsMap[platform.id] = platform
    })

    const platforms = Object.values(platformsMap)

    platforms.sort((a, b) => {
      // Primary sort: type
      const aIsBlockchain = isBlockchain(a)
      const bIsBlockchain = isBlockchain(b)
      if (aIsBlockchain !== bIsBlockchain) {
        return aIsBlockchain ? -1 : 1
      }

      // Secondary sort: entries from myPlatformsMap first
      const aIsFavorited = a.id in myPlatformsMap
      const bIsFavorited = b.id in myPlatformsMap

      if (aIsFavorited && !bIsFavorited) return -1
      if (!aIsFavorited && bIsFavorited) return 1

      return a.name.localeCompare(b.name)
    })

    const platformIds = platforms.map((x) => x.id)

    return { platformIds, platformsMap }
  }, [myPlatformsMap, searchResults])

  return (
    <Autocomplete
      sx={sx}
      filterOptions={(x) => x}
      freeSolo
      disableClearable
      openOnFocus
      groupBy={(option) => {
        const platform = platformsMap[option]
        return platform ? (isBlockchain(platform) ? "Blockchains" : "Exchanges") : "Unknown"
      }}
      options={platformIds}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option}>
          <PlatformBlock
            platform={platformsMap[option]}
            variant="tablecell"
            href={undefined}
            hideTooltip
          />
          {myPlatformsMap[option] && (
            <StarRounded sx={{ color: "text.secondary", fontSize: "1rem", marginLeft: "auto" }} />
          )}
        </Box>
      )}
      getOptionLabel={(option) => (!option ? "" : platformsMap[option]?.name || option || "")}
      value={value}
      onChange={(event, newValue) => {
        if (typeof newValue === "string") {
          onChange(newValue)
        }
      }}
      onInputChange={(event, newInputValue) => {
        setQuery(newInputValue)
        onChange(newInputValue)
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          {...rest}
          InputProps={{
            ...params.InputProps,
            ...rest.InputProps,
            endAdornment: (
              <Fade in={loading}>
                <span>
                  <CircularSpinner size={16} />
                </span>
              </Fade>
            ),
            startAdornment: platformsMap[value] && (
              <PlatformAvatar
                src={platformsMap[value].image}
                alt={platformsMap[value].name}
                size="small"
                sx={{ marginLeft: 0.5, marginRight: -0.25 }}
              />
            ),
          }}
        />
      )}
    />
  )
}
