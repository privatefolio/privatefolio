/* eslint-disable react-hooks/rules-of-hooks */ // TODO
import { Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { Navigate, useParams, useSearchParams } from "react-router-dom"
import { AmountBlock } from "src/components/AmountBlock"
import { NavTab } from "src/components/NavTab"
import { SectionTitle } from "src/components/SectionTitle"
import { Tabs } from "src/components/Tabs"
import { Balance } from "src/interfaces"
import { $baseCurrency } from "src/stores/account-settings-store"
import { $activeAccount } from "src/stores/account-store"
import { getAssetTicker } from "src/utils/assets-utils"
import { clancy } from "src/workers/remotes"

import { AssetAvatar } from "../../components/AssetAvatar"
import { BackButton } from "../../components/BackButton"
import { StaggeredList } from "../../components/StaggeredList"
import { $assetMetaMap, $filterOptionsMap } from "../../stores/metadata-store"
import { SerifFont } from "../../theme"
import { AuditLogTable } from "../AuditLogsPage/AuditLogTable"
import { TransactionTable } from "../TransactionsPage/TransactionTable"
import { BalanceChart } from "./BalanceChart"
import { PriceChart } from "./PriceChart"

export default function AssetPage({ show }: { show: boolean }) {
  const params = useParams()
  const assetId = params.assetId // ?.toLocaleUpperCase()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || ""
  const assetMap = useStore($assetMetaMap)

  const filterMap = useStore($filterOptionsMap)

  if (!assetId || (filterMap.assetId && !filterMap.assetId.includes(assetId))) {
    return <Navigate to=".." replace={true} />
  }

  const [rows, setRows] = useState<Balance[]>([])

  const activeAccount = useStore($activeAccount)
  const currency = useStore($baseCurrency)

  useEffect(() => {
    function fetchData() {
      clancy.getBalancesAt(undefined, activeAccount).then((balances) => {
        // fetch no longer accurate
        if (activeAccount !== $activeAccount.get()) return
        setRows(balances)
      })
    }

    fetchData()
  }, [])

  console.log(rows)

  const row = rows.find((obj) => {
    return obj.assetId === assetId
  })

  console.log(row)
  return (
    <StaggeredList component="main" gap={2} show={show}>
      <BackButton to=".." sx={{ marginLeft: 1 }}>
        Home
      </BackButton>
      <Stack direction="row" alignItems="center" width="100%" gap={6} paddingBottom={2}>
        <Stack direction="row" gap={1} component="div" sx={{ marginX: 2 }}>
          <AssetAvatar size="large" src={assetMap[assetId]?.image} alt={getAssetTicker(assetId)} />
          <Stack>
            <Typography variant="h6" fontFamily={SerifFont} sx={{ marginBottom: -0.5 }}>
              <span>{getAssetTicker(assetId)}</span>
            </Typography>
            <Typography
              color="text.secondary"
              variant="subtitle2"
              fontWeight={300}
              letterSpacing={0.5}
            >
              {assetMap[assetId]?.name}
            </Typography>
          </Stack>
        </Stack>
        <Stack alignItems="center">
          <SectionTitle>Balance</SectionTitle>
          <AmountBlock amount={row?.balanceN} currencyTicker={getAssetTicker(assetId)} showTicker />
        </Stack>
        <Stack alignItems="center">
          <SectionTitle>Value</SectionTitle>
          <AmountBlock
            amount={row?.value}
            currencySymbol={currency.symbol}
            significantDigits={currency.maxDigits}
            maxDigits={currency.maxDigits}
            currencyTicker={currency.id}
          />
        </Stack>
      </Stack>
      <Stack>
        <Tabs value={tab}>
          <NavTab value="" to="" label="Price history" />
          <NavTab value="balance" to={`?tab=balance`} label="Balance history" />
          {/* <NavTab value="pnl" to={`?tab=pnl`} label="Profit & Loss"  /> */}
          <NavTab value="transactions" to={`?tab=transactions`} label="Transactions" />
          <NavTab value="audit-logs" to={`?tab=audit-logs`} label="Audit logs" />
        </Tabs>
        {tab === "" && <PriceChart symbol={assetId} />}
        {tab === "balance" && <BalanceChart symbol={assetId} />}
        {tab === "transactions" && <TransactionTable assetId={assetId} defaultRowsPerPage={10} />}
        {tab === "audit-logs" && <AuditLogTable assetId={assetId} defaultRowsPerPage={10} />}
      </Stack>
      {/* <AssetInfo
           assetSymbol={assetSymbol}
           amountBought={amounts.amountBought.toNumber()}
           amountSold={amounts.amountSold.toNumber()}
           moneyIn={amounts.moneyIn.toNumber()}
           moneyOut={amounts.moneyOut.toNumber()}
           holdings={amounts.holdings.toNumber()}
           costBasis={amounts.costBasis.toNumber()}
           tradeHistory={tradeHistory}
         /> */}
    </StaggeredList>
  )
}

// const [tradeHistory, setTradeHistory] = useState<Transaction[]>([])
// const [amounts, setAmounts] = useState<any>({})

// useEffect(() => {
// readCsv<ParsedTransaction>(filePath, mexcParser).then((tradeHistory) => {
//   const parsedTradeHistory = tradeHistory.filter((x) => x.symbol === assetSymbol)
//   let amountBought = new Decimal(0)
//   let amountSold = new Decimal(0)
//   let moneyIn = new Decimal(0)
//   let moneyOut = new Decimal(0)
//   const frontendTradeHistory: Transaction[] = parsedTradeHistory.map((x) => {
//     if (x.side === "BUY") {
//       amountBought = amountBought.plus(x.amount)
//       moneyIn = moneyIn.plus(x.total)
//     } else {
//       amountSold = amountSold.plus(x.amount)
//       moneyOut = moneyOut.plus(x.total)
//     }
//     return {
//       ...x,
//       amount: x.amount.toNumber(),
//       filledPrice: x.filledPrice.toNumber(),
//       total: x.total.toNumber(),
//     }
//   })
//   const holdings = amountBought.minus(amountSold)
//   console.log("📜 LOG > readCsv<ServerTrade> > holdings:", holdings)
//   const costBasis = moneyIn.div(amountBought)
//   setTradeHistory(frontendTradeHistory)
//   setAmounts({
//     amountBought,
//     amountSold,
//     costBasis,
//     holdings,
//     moneyIn,
//     moneyOut,
//   })
// })
// }, [])
