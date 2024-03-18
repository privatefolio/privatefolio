import { AddRounded, ArrowRightAltRounded, RemoveRounded, Visibility } from "@mui/icons-material"
import { Box, Button, IconButton, Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import React from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AmountBlock } from "src/components/AmountBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { useBoolean } from "src/hooks/useBoolean"
import { getAssetTicker } from "src/utils/assets-utils"
import { greenColor, redColor } from "src/utils/color-utils"

import { TimestampBlock } from "../../components/TimestampBlock"
import { Truncate } from "../../components/Truncate"
import { AuditLog } from "../../interfaces"
import { TableRowComponentProps } from "../../utils/table-utils"
import { AuditLogDrawer } from "./AuditLogDrawer"

export function AuditLogTableRow(props: TableRowComponentProps<AuditLog>) {
  const { row, relativeTime, headCells, isMobile: _isMobile, isTablet: _isTablet, ...rest } = props
  const { assetId, change, changeN, balance, operation, timestamp, platform, wallet } = row

  const changeColor = changeN < 0 ? redColor : greenColor

  const showAssetColumn = headCells.length === 8

  const { value: open, toggle: toggleOpen } = useBoolean(false)

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
          <TableCell colSpan={99}>
            <Stack
              direction="column"
              justifyContent="space-between"
              alignItems="flex-start"
              gap={1}
            >
              <Box sx={{ color: "text.secondary" }}>
                <TimestampBlock timestamp={timestamp} relative={relativeTime} />
              </Box>
              <Stack
                direction="row"
                gap={4}
                paddingY={1}
                sx={{ fontSize: "18px", width: "100%" }}
                justifyContent="space-between"
                alignItems="center"
              >
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
                <Stack
                  direction="row"
                  gap={1}
                  paddingY={1}
                  sx={{ fontSize: "18px" }}
                  alignItems="center"
                >
                  <AmountBlock
                    amount={change}
                    showSign
                    colorized
                    currencyTicker={getAssetTicker(assetId)}
                  />
                  {showAssetColumn && <AssetBlock asset={assetId} size="medium" />}
                </Stack>
              </Stack>
              <Button size="small" color="primary" onClick={toggleOpen}>
                Inspect details <ArrowRightAltRounded />
              </Button>
            </Stack>
          </TableCell>
        </TableRow>
        <AuditLogDrawer
          key={row._id}
          open={open}
          toggleOpen={toggleOpen}
          auditLog={row}
          relativeTime={relativeTime}
        />
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
      <TableRow hover {...rest}>
        <TableCell>
          <TimestampBlock timestamp={timestamp} relative={relativeTime} />
        </TableCell>
        <TableCell>
          <PlatformBlock platform={platform} hideName />
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
        <TableCell>
          <Tooltip title="Inspect">
            <IconButton
              size="small"
              color="secondary"
              sx={{
                ".MuiTableRow-root:hover &": {
                  visibility: "visible",
                },
                height: 28,
                marginLeft: -1,
                marginY: -0.25,
                visibility: "hidden",
              }}
              onClick={toggleOpen}
            >
              <Visibility fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <AuditLogDrawer
        key={row._id}
        open={open}
        toggleOpen={toggleOpen}
        auditLog={row}
        relativeTime={relativeTime}
      />
    </>
  )
}
