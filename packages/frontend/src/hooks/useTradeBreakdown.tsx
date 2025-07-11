import { useStore } from "@nanostores/react"
import Big from "big.js"
import { useEffect, useMemo, useState } from "react"
import { AggregatableValue } from "src/components/AssetAmountsBlock"
import { SqlParam, Trade, TradePnL } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { $quoteCurrency } from "src/stores/device-settings-store"
import { $inspectTime } from "src/stores/pages/balances-store"
import { $rpc } from "src/workers/remotes"

export function useTradeBreakdown(trade: Trade) {
  const { cost, proceeds } = trade

  const deposits = useMemo<AggregatableValue[]>(() => {
    return trade.deposits.filter(([_, amount]) => Big(amount).gt(0))
  }, [trade.deposits])

  const withdrawals = useMemo<AggregatableValue[]>(() => {
    return trade.deposits.filter(([_, amount]) => Big(amount).lt(0))
  }, [trade.deposits])

  const costBasis = useMemo<AggregatableValue[]>(
    () =>
      cost.map(([assetId, amount, usdValue, exposure, txId, txTimestamp]) => [
        assetId,
        Big(amount)
          .div(exposure.includes("-") ? exposure : `-${exposure}`)
          .toString(),
        Big(usdValue)
          .div(exposure.includes("-") ? exposure : `-${exposure}`)
          .toString(),
        txId,
        txTimestamp,
      ]),
    [cost]
  )

  const avgSellPrice = useMemo<AggregatableValue[]>(
    () =>
      proceeds.map(([assetId, amount, usdValue, cost, txId, txTimestamp]) => [
        assetId,
        Big(amount).div(cost).toString(),
        Big(usdValue).div(cost).toString(),
        txId,
        txTimestamp,
      ]),
    [proceeds]
  )

  const currency = useStore($quoteCurrency)
  const depositsCostBasis = useMemo<AggregatableValue[]>(
    () =>
      trade.deposits.map(([_assetId, amount, usdValue, txId, txTimestamp]) => {
        const costBasis = Big(usdValue).div(amount).toString()
        return [currency.id, costBasis, costBasis, txId, txTimestamp]
      }),
    [trade.deposits, currency]
  )

  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  const inspectTime = useStore($inspectTime)
  const [tradePnl, setTradePnl] = useState<TradePnL | undefined | null>()

  useEffect(() => {
    const params: SqlParam[] = [trade.id]
    let query = "SELECT * FROM trade_pnl WHERE trade_id = ? ORDER BY timestamp DESC LIMIT 1"

    if (inspectTime) {
      query = `SELECT * FROM trade_pnl WHERE trade_id = ? AND timestamp <= ? ORDER BY timestamp DESC LIMIT 1`
      params.push(inspectTime)
    }

    rpc
      .getTradePnL(activeAccount, trade.id, query, params)
      .then((pnl) => {
        if (pnl.length > 0) {
          setTradePnl(pnl[0])
        } else {
          setTradePnl(null)
        }
      })
      .catch((error) => {
        console.error(error)
        setTradePnl(null)
      })
  }, [activeAccount, rpc, trade.id, inspectTime])

  return { avgSellPrice, costBasis, deposits, depositsCostBasis, tradePnl, withdrawals }
}
