import { Autocomplete, Box, TextField, TextFieldProps } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useMemo, useState } from "react"
import { $assetMap } from "src/stores/metadata-store"
import { getAssetPlatform, getAssetTicker } from "src/utils/assets-utils"

import { AssetBlock } from "./AssetBlock"

type AssetInputProps = Omit<TextFieldProps, "onChange" | "value"> & {
  onChange?: (value: string) => void
  platformId?: string
  value?: string
}

export function AssetInput(props: AssetInputProps) {
  const { value, onChange, platformId, ...rest } = props

  const assetMap = useStore($assetMap)

  const assetsIds: string[] = useMemo(() => {
    if (!platformId) return Object.keys(assetMap)
    return Object.keys(assetMap).filter((x) => getAssetPlatform(x) === platformId)
  }, [assetMap, platformId])

  return (
    <Autocomplete
      freeSolo
      disableClearable
      openOnFocus
      options={assetsIds}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option}>
          <AssetBlock id={option} variant="tablecell" href={undefined} hideTooltip />
        </Box>
      )}
      getOptionLabel={(option) => (!option ? "" : getAssetTicker(option))}
      value={value || ""}
      onChange={(event, newValue) => {
        if (typeof newValue === "string") {
          onChange?.(newValue)
        }
      }}
      onInputChange={(event, newInputValue) => {
        onChange?.(newInputValue)
      }}
      renderInput={(params) => <TextField {...params} {...rest} />}
    />
  )
}

export type AssetInputUncontrolledProps = Omit<AssetInputProps, "onChange" | "value"> & {
  initialValue?: string
}

export function AssetInputUncontrolled({
  initialValue = "",
  ...rest
}: AssetInputUncontrolledProps) {
  const [value, onChange] = useState(initialValue)

  return <AssetInput value={value} onChange={onChange} {...rest} />
}
