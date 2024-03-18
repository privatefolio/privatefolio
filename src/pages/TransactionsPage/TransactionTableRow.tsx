import { ArrowRightAltRounded, SwapHoriz, Visibility } from "@mui/icons-material"
import { Box, Button, IconButton, Stack, TableCell, TableRow, Tooltip } from "@mui/material"
import React from "react"
import { ActionBlock } from "src/components/ActionBlock"
import { AmountBlock } from "src/components/AmountBlock"
import { AssetBlock } from "src/components/AssetBlock"
import { PlatformBlock } from "src/components/PlatformBlock"
import { useBoolean } from "src/hooks/useBoolean"
import { getAssetTicker } from "src/utils/assets-utils"

import { TimestampBlock } from "../../components/TimestampBlock"
import { Truncate } from "../../components/Truncate"
import { Transaction } from "../../interfaces"
import { TableRowComponentProps } from "../../utils/table-utils"
import { TransactionDrawer } from "./TransactionDrawer"

export function TransactionTableRow(props: TableRowComponentProps<Transaction>) {
  const {
    row,
    relativeTime,
    headCells: _headCells,
    isMobile: _isMobile,
    isTablet: _isTablet,
    ...rest
  } = props

  const {
    incoming,
    incomingAsset,
    type,
    timestamp,
    platform,
    wallet,
    outgoing,
    outgoingAsset,
    fee,
    feeAsset,
  } = row

  const { value: open, toggle: toggleOpen } = useBoolean(false)

  if (_isTablet) {
    return (
      <>
        <TableRow hover>
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
              <ActionBlock action={type} size="medium" />
              <Stack
                direction="row"
                gap={3}
                paddingY={1}
                sx={{
                  fontSize: "18px",
                }}
                alignItems="center"
              >
                {outgoing && (
                  <Stack direction="row" gap={1} alignItems="center">
                    <AmountBlock
                      colorized
                      placeholder=""
                      amount={outgoing ? `-${outgoing}` : undefined}
                      showSign
                      currencyTicker={getAssetTicker(outgoingAsset)}
                    />
                    <AssetBlock asset={outgoingAsset} size="medium" />
                  </Stack>
                )}
                {outgoing && incoming ? <SwapHoriz fontSize="small" color="secondary" /> : null}
                {incoming && (
                  <Stack direction="row" gap={1} alignItems="center">
                    <AmountBlock
                      colorized
                      placeholder=""
                      amount={incoming}
                      showSign
                      currencyTicker={getAssetTicker(incomingAsset)}
                    />
                    <AssetBlock asset={incomingAsset} size="medium" />
                  </Stack>
                )}
              </Stack>
              <Button size="small" color="primary" onClick={toggleOpen}>
                Inspect details <ArrowRightAltRounded />
              </Button>
            </Stack>
          </TableCell>
        </TableRow>
        <TransactionDrawer
          key={row._id}
          open={open}
          toggleOpen={toggleOpen}
          tx={row}
          relativeTime={relativeTime}
        />
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
          <ActionBlock action={type} />
        </TableCell>
        <TableCell align="right" variant="clickable">
          <AmountBlock
            colorized
            placeholder=""
            amount={outgoing ? `-${outgoing}` : undefined}
            showSign
            currencyTicker={getAssetTicker(outgoingAsset)}
          />
        </TableCell>
        <TableCell>
          <AssetBlock asset={outgoingAsset} />
        </TableCell>
        <TableCell align="right" variant="clickable">
          <AmountBlock
            colorized
            placeholder=""
            amount={incoming}
            showSign
            currencyTicker={getAssetTicker(incomingAsset)}
          />
        </TableCell>
        <TableCell>
          <AssetBlock asset={incomingAsset} />
        </TableCell>
        <TableCell align="right" variant="clickable">
          <AmountBlock
            colorized
            placeholder=""
            amount={fee}
            showSign
            currencyTicker={getAssetTicker(feeAsset)}
          />
        </TableCell>
        <TableCell>
          <AssetBlock asset={feeAsset} />
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
      <TransactionDrawer
        key={row._id}
        open={open}
        toggleOpen={toggleOpen}
        tx={row}
        relativeTime={relativeTime}
      />
    </>
  )
}
