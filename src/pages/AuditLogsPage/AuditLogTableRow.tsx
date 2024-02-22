import { AddRounded, RemoveRounded } from "@mui/icons-material"
import { Avatar, Stack, TableCell, TableRow, Tooltip, Box } from "@mui/material"
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

  // const { value: open, toggle: toggleOpen } = useBoolean(false)

  if (_isTablet) {
    return (
      <>
        <TableRow
          hover
          // hover={!open}
          // onClick={toggleOpen}
          // className={open ? "TableRow-open-top" : undefined}
          // sx={(theme) => ({
          // ...(open
          //   ? {
          //       "--mui-palette-TableCell-border": "rgba(0,0,0,0)",
          //       background: "var(--mui-palette-background-default)",
          //     }
          //   : {}),
          // })}
          {...rest}
        >
          <TableCell sx={{ width: "100%" }}>
            <Stack direction="column" justifyContent="space-between" alignItems="flex-start" gap={1}>
              <Box sx={{ color: "text.secondary" }}>
                <TimestampBlock timestamp={timestamp} relative={relativeTime} />
              </Box>
              <Stack direction="row" gap={4} paddingY={1} sx={{ fontSize: "18px", width: "100%" }} justifyContent="space-between" alignItems="center">
                {operation === "Funding Fee" ? (
                  <ActionBlock
                    action={operation}
                    color={changeColor as any} // FIXME
                    size="medium"
                    IconComponent={changeN < 0 ? RemoveRounded : AddRounded}
                  />
                ) : (
                  <ActionBlock action={operation} size="medium" />
                )}
                <Stack direction="row" gap={1} paddingY={1} sx={{ fontSize: "18px" }} alignItems="center">
                  <AmountBlock
                    amount={change}
                    showSign
                    colorized
                    currencyTicker={getAssetTicker(assetId)}
                  />
                  {showAssetColumn && (
                      <AssetBlock asset={assetId} size="medium" />
                  )}
                </Stack>
              </Stack>
            </Stack>
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

  return (
    <>
      <TableRow
        hover
        // hover={!open}
        // onClick={toggleOpen}
        // className={open ? "TableRow-open-top" : undefined}
        // sx={(theme) => ({
        // ...(open
        //   ? {
        //       "--mui-palette-TableCell-border": "rgba(0,0,0,0)",
        //       background: "var(--mui-palette-background-default)",
        //     }
        //   : {}),
        // })}
        {...rest}
      >
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
        <TableCell align="right">
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
