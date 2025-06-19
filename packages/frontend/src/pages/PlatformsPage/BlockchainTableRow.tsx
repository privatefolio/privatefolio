import { Stack, TableCell, TableRow, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { AppLink } from "src/components/AppLink"
import { CaptionText } from "src/components/CaptionText"
import { ForeignAssetBlock } from "src/components/ForeignAssetBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { Truncate } from "src/components/Truncate"
import { Blockchain } from "src/interfaces"
import { $activeAccountPath } from "src/stores/account-store"
import { TableRowComponentProps } from "src/utils/table-utils"

interface BlockchainTableRowProps extends TableRowComponentProps<Blockchain> {
  row: Blockchain
}

export function BlockchainTableRow({
  row,
  headCells,
  isTablet,
  isMobile: _isMobile,
  relativeTime: _relativeTime,
  ...rest
}: BlockchainTableRowProps) {
  const activeAccountPath = useStore($activeAccountPath)

  if (isTablet) {
    return (
      <TableRow hover {...rest}>
        <TableCell colSpan={headCells.length} variant="clickable">
          <AppLink to={`${activeAccountPath}/platform/${row.id}`}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
              <Stack>
                <Truncate sx={{ maxWidth: { sm: 320, xs: 200 } }}>
                  <PlatformBlock variant="tablecell" platform={row} />
                </Truncate>
                <CaptionText>
                  Chain ID:{" "}
                  {row.chainId ?? (
                    <Typography color="text.secondary" variant="inherit">
                      N/A
                    </Typography>
                  )}
                </CaptionText>
              </Stack>
              <Stack alignItems="flex-end" sx={{ fontSize: "0.75rem" }}>
                {row.nativeCoinId && <CaptionText>Native asset</CaptionText>}
                <ForeignAssetBlock
                  coingeckoId={row.nativeCoinId}
                  size="small"
                  variant="tablecell"
                />
              </Stack>
            </Stack>
          </AppLink>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow hover {...rest}>
      <TableCell variant="clickable">
        <PlatformBlock variant="tablecell" platform={row} />
      </TableCell>
      <TableCell variant="clickable">
        <ForeignAssetBlock coingeckoId={row.nativeCoinId} size="small" variant="tablecell" />
      </TableCell>
      <TableCell align="right">
        {row.chainId || (
          <Typography color="text.secondary" variant="inherit">
            N/A
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
}
