import { MonetizationOn, MonetizationOnOutlined } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { $quoteCurrency, $showQuotedAmounts } from "src/stores/account-settings-store"

export function QuoteCurrencyToggle() {
  const showQuotedAmounts = useStore($showQuotedAmounts)

  const currency = useStore($quoteCurrency)

  return (
    <>
      <Tooltip
        title={
          showQuotedAmounts
            ? `Show amounts in Base Asset`
            : `Show amounts in Quote Currency (${currency.id})`
        }
      >
        <IconButton
          color="secondary"
          onClick={() => {
            $showQuotedAmounts.set(!showQuotedAmounts)
          }}
        >
          {showQuotedAmounts ? (
            <MonetizationOn fontSize="small" />
          ) : (
            <MonetizationOnOutlined fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </>
  )

  // return (
  //   <Tooltip
  //     title={showQuotedAmounts ? "Show amounts in Base Asset" : "Show amounts in Quote Currency"}
  //   >
  //     <Button
  //       size="small"
  //       variant={"text"}
  //       color="secondary"
  //       sx={{
  //         alignSelf: "center",
  //         background: "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.05)",
  //         borderRadius: 0.5,
  //         marginX: 0.5,
  //         paddingX: 1.5,
  //         paddingY: 0.5,
  //       }}
  //       onClick={() => {
  //         $showQuotedAmounts.set(!showQuotedAmounts)
  //       }}
  //     >
  //       {showQuotedAmounts ? (
  //         <AttachMoney sx={{ fontSize: "1rem !important" }} />
  //       ) : (
  //         <CurrencyBitcoin sx={{ fontSize: "1rem !important" }} />
  //       )}
  //       {/* {showQuotedAmounts ? "Base" : "Quote"} */}
  //       {/* {showQuotedAmounts ? `Show in ${currency.id}` : `Show in ${currency.id}`} */}
  //     </Button>
  //   </Tooltip>
  // )
}
