import { AddRounded, RemoveRounded } from "@mui/icons-material"
import { Avatar, Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AmountBlock } from "src/components/AmountBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { getAssetTicker } from "src/utils/assets-utils"
import { greenColor, redColor } from "src/utils/color-utils"

import { TimestampBlock } from "../../components/TimestampBlock"
import { Truncate } from "../../components/Truncate"
import { AuditLog } from "../../interfaces"
import { PLATFORMS_META } from "../../settings"
import { $platformMetaMap } from "../../stores/metadata-store"
import { TableRowComponentProps } from "../../utils/table-utils"

export function AuditLogTableRow(props: TableRowComponentProps<AuditLog>) {
  const { row, relativeTime, headCells, isMobile: _isMobile, isTablet: _isTablet, ...rest } = props
  const { assetId, change, changeN, balance, operation, timestamp, platform, wallet } = row

  const platformMetaMap = useStore($platformMetaMap)

  const changeColor = changeN < 0 ? redColor : greenColor

  const showAssetColumn = headCells.length === 7

  return (
    <>
      <TableRow hover {...rest}>
        <TableCell>
          <TimestampBlock timestamp={timestamp} relative={relativeTime} />
        </TableCell>
        <TableCell>
          <Stack direction="row" gap={0.5} alignItems="center" component="div">
            <Avatar
              src={platformMetaMap[platform]?.image}
              sx={{
                borderRadius: "2px",
                height: 16,
                width: 16,
              }}
              alt={PLATFORMS_META[platform].name}
            />
            {/* <span>{PLATFORMS_META[platform].name}</span> */}
          </Stack>
        </TableCell>
        <TableCell>
          <Tooltip title={wallet}>
            <Truncate>{wallet}</Truncate>
          </Tooltip>
        </TableCell>
        <TableCell>
          {operation === "Funding Fee" ? (
            <ActionBlock
              action={operation}
              color={changeColor as any} // FIXME
              IconComponent={changeN < 0 ? RemoveRounded : AddRounded}
            />
          ) : (
            <ActionBlock action={operation} />
          )}
        </TableCell>
        <TableCell align="right" variant="clickable">
          <AmountBlock
            amount={change}
            showSign
            colorized
            currencyTicker={getAssetTicker(assetId)}
          />
        </TableCell>
        {showAssetColumn && (
          <TableCell>
            <AssetBlock asset={assetId} />
          </TableCell>
        )}
        <TableCell align="right">
          <AmountBlock
            currencyTicker={getAssetTicker(assetId)}
            amount={balance}
            tooltipMessage="Use the 'Compute balances' action to compute these values."
          />
        </TableCell>
      </TableRow>
      {/* {open && (
        <TableRow className={open ? "TableRow-open-bottom" : undefined} sx={{ height: 200 }}>
          <TableCell colSpan={2}>File Import</TableCell>
          <TableCell colSpan={5}>Transaction</TableCell>
        </TableRow>
      )} */}
    </>
  )
}
