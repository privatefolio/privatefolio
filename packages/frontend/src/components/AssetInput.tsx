import { StarRounded } from "@mui/icons-material"
import { Autocomplete, Box, Fade, TextField, TextFieldProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import { debounce } from "lodash-es"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { usePlatform } from "src/hooks/usePlatform"
import { Asset } from "src/interfaces"
import { INPUT_DEBOUNCE_DURATION, INPUT_MAX_DEBOUNCE_DURATION } from "src/settings"
import { $activeAccount } from "src/stores/account-store"
import { $assetMap } from "src/stores/metadata-store"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"
import { $rpc } from "src/workers/remotes"

import { AssetAvatar } from "./AssetAvatar"
import { AssetBlock } from "./AssetBlock"
import { CircularSpinner } from "./CircularSpinner"
import { Truncate } from "./Truncate"

type AssetInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  onChange: (value: string) => void
  platformId?: string
  value: string
}

export function AssetInput(props: AssetInputProps) {
  const { value, onChange, platformId, ...rest } = props

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const myAssetsMap = useStore($assetMap)

  const [query, setQuery] = useState(value)
  const [searchResults, setSearchResults] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)

  const [platform] = usePlatform(platformId)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce(
      async (query: string, signal: AbortSignal) => {
        setLoading(true)
        const [coingecko, myAssets] = await Promise.all([
          rpc.findAssets(activeAccount, query, 5, true, "coingecko"),
          rpc.findAssets(activeAccount, query, 5, true, "my-assets"),
        ])

        setLoading(false)
        if (signal.aborted) return

        const assetMap = new Map<string, Asset>()
        coingecko.forEach((asset) => {
          assetMap.set(asset.id, asset)
        })
        myAssets.forEach((asset) => {
          assetMap.set(asset.id, asset)
        })
        setSearchResults(Array.from(assetMap.values()))
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

  const { assetIds, assetsMap } = useMemo(() => {
    const assetsMap: Record<string, Asset> = {}

    searchResults.forEach((asset) => {
      assetsMap[asset.id] = asset
    })

    const assets = Object.values(assetsMap)

    assets.sort((a, b) => {
      // Primary sort: assets from specified platform first (if platformId is provided)
      if (platformId) {
        const aIsFromPlatform = getAssetPlatform(a.id) === platformId
        const bIsFromPlatform = getAssetPlatform(b.id) === platformId

        if (aIsFromPlatform && !bIsFromPlatform) return -1
        if (!aIsFromPlatform && bIsFromPlatform) return 1
      }

      // Secondary sort: entries from myAssetsMap first
      const aIsFavorited = a.id in myAssetsMap
      const bIsFavorited = b.id in myAssetsMap

      if (aIsFavorited && !bIsFavorited) return -1
      if (!aIsFavorited && bIsFavorited) return 1

      // Tertiary sort: market cap rank ascending (nulls/undefined last)
      const aRank = a.marketCapRank ?? null
      const bRank = b.marketCapRank ?? null
      if (aRank !== bRank) {
        if (aRank === null) return 1
        if (bRank === null) return -1
        return aRank - bRank
      }

      // Quaternary sort: symbol ascending
      return getAssetTicker(a.id).localeCompare(getAssetTicker(b.id))
    })

    const assetIds = assets.map((x) => x.id)
    return { assetIds, assetsMap }
  }, [myAssetsMap, searchResults, platformId])

  const platformHasAssets = useMemo(() => {
    return searchResults.some((asset) => getAssetPlatform(asset.id) === platformId)
  }, [searchResults, platformId])

  return (
    <Autocomplete
      filterOptions={(x) => x}
      freeSolo
      disableClearable
      openOnFocus
      groupBy={(option) => {
        if (platformId && platformHasAssets) {
          const asset = assetsMap[option]
          if (asset && getAssetPlatform(asset.id) === platformId) {
            return platform?.name || "This platform"
          }
          return "Other"
        }

        return ""
      }}
      options={assetIds}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option}>
          <Truncate>
            <AssetBlock id={option} variant="tablecell" href={undefined} hideTooltip />
          </Truncate>
          {myAssetsMap[option] && (
            <StarRounded sx={{ color: "text.secondary", fontSize: "1rem", marginLeft: "auto" }} />
          )}
        </Box>
      )}
      getOptionLabel={(option) => (!option ? "" : getAssetTicker(option))}
      value={value}
      onChange={(event, newValue) => {
        onChange(newValue)
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
            startAdornment: assetsMap[value] && (
              <AssetAvatar
                src={assetsMap[value].logoUrl}
                alt={assetsMap[value].symbol}
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
