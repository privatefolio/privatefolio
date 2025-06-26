import {
  Chip,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { allPriceApiIds } from "privatefolio-backend/src/settings/price-apis"
import React from "react"
import { AppLink } from "src/components/AppLink"
import { ExtensionAvatar } from "src/components/ExtensionAvatar"
import { MyAssetBlock } from "src/components/MyAssetBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { PRICE_APIS_META, PriceApiId } from "src/settings"
import { $activeAccount } from "src/stores/account-store"
import { $assetMap } from "src/stores/metadata-store"
import { MonoFont } from "src/theme"
import { getAssetPlatform } from "src/utils/assets-utils"
import { resolveUrl } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { AssetWithPrice } from "../../interfaces"
import { TableRowComponentProps } from "../../utils/table-utils"

export function AssetTableRow(props: TableRowComponentProps<AssetWithPrice>) {
  const {
    row,
    relativeTime: _relativeTime,
    headCells,
    isMobile: _isMobile,
    isTablet,
    ...rest
  } = props
  const { id: assetId, name, coingeckoId, priceApiId, price, marketCapRank } = row
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue: PriceApiId | undefined = (event.target.value as PriceApiId) || undefined
    rpc.patchAsset(activeAccount, assetId, {
      priceApiId: newValue ?? null,
    })
    $assetMap.setKey(assetId, { ...row, priceApiId: newValue })
  }

  const priceApiSelect = (
    <Select
      size="small"
      onChange={handleChange}
      value={priceApiId || ""}
      displayEmpty
      sx={{
        "& .MuiSelect-select": {
          paddingX: 1.5,
          paddingY: 0.5,
        },

        borderRadius: 5,
        fontSize: "0.8125rem",
      }}
    >
      <MenuItem value="">
        <em>Auto</em>
      </MenuItem>
      {allPriceApiIds.map((priceApiId) => (
        <MenuItem key={priceApiId} value={priceApiId}>
          <Stack direction="row" alignItems={"center"} gap={1}>
            <ExtensionAvatar
              size="small"
              src={resolveUrl(PRICE_APIS_META[priceApiId].logoUrl)}
              alt={priceApiId}
            />
            {PRICE_APIS_META[priceApiId].name}
          </Stack>
        </MenuItem>
      ))}
    </Select>
  )

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell colSpan={headCells.length} variant="clickable">
          <Stack direction="row" gap={1} justifyContent="space-between" flexWrap="nowrap">
            <AppLink to={`../asset/${encodeURI(assetId)}`} flexGrow={1}>
              <Stack sx={{ height: 52 }} alignItems="center" direction="row" gap={1}>
                <MyAssetBlock id={assetId} secondary={name} size="medium" />
                {!coingeckoId && (
                  <Tooltip title="Not listed on Coingecko.com">
                    <Chip label="Unlisted" size="small" sx={{ color: "text.secondary" }} />
                  </Tooltip>
                )}
              </Stack>
            </AppLink>
            <Stack alignItems="flex-end" gap={0.5}>
              {priceApiSelect}
              {price === null ? (
                <Skeleton sx={{ minWidth: 30 }}></Skeleton>
              ) : (
                <QuoteAmountBlock amount={price?.value} formatting="price" />
              )}
            </Stack>
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell variant="clickable">
          <AppLink to={`../asset/${encodeURI(assetId)}`}>
            <MyAssetBlock id={assetId} size="small" />
          </AppLink>
        </TableCell>
        <TableCell>
          {name}
          {!coingeckoId && (
            <Tooltip title="Not listed on Coingecko.com">
              <Chip label="Unlisted" size="small" sx={{ color: "text.secondary" }} />
            </Tooltip>
          )}
        </TableCell>
        <TableCell variant="clickable">
          <PlatformBlock id={getAssetPlatform(assetId)} variant="tablecell" />
        </TableCell>
        <TableCell>{priceApiSelect}</TableCell>
        <TableCell variant="clickable" align="right">
          {price === null ? (
            <Skeleton sx={{ margin: "0px 16px" }}></Skeleton>
          ) : (
            <QuoteAmountBlock amount={price?.value} formatting="price" />
          )}
        </TableCell>
        <TableCell align="right" sx={{ fontFamily: MonoFont }}>
          {marketCapRank ? (
            `#${marketCapRank}`
          ) : (
            <Typography color="text.secondary" variant="inherit">
              Unknown
            </Typography>
          )}
        </TableCell>
      </TableRow>
    </>
  )
}
