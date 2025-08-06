import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { InfoCard, InfoCardRow } from "src/components/InfoCard"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription } from "src/utils/browser-utils"

import { Timestamp } from "../../interfaces"
import { $filterOptionsMap } from "../../stores/metadata-store"
import { formatDate, formatNumber } from "../../utils/formatting-utils"
import { $rpc } from "../../workers/remotes"

export function PortfolioInfo() {
  const [genesis, setGenesis] = useState<Timestamp | null>(null)
  const [lastTx, setLastTx] = useState<Timestamp | null>(null)

  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    function fetchData() {
      rpc.getValue<Timestamp>(activeAccount, "genesis", 0).then(setGenesis)
    }

    fetchData()

    const subscription = rpc.subscribeToKV<Timestamp>(activeAccount, "genesis", setGenesis)

    return closeSubscription(subscription, rpc)
  }, [connectionStatus, rpc, activeAccount])

  useEffect(() => {
    function fetchData() {
      rpc.getValue<Timestamp>(activeAccount, "lastTx", 0).then(setLastTx)
    }

    fetchData()

    const subscription = rpc.subscribeToKV<Timestamp>(activeAccount, "lastTx", setLastTx)

    return closeSubscription(subscription, rpc)
  }, [connectionStatus, rpc, activeAccount])

  const filterMap = useStore($filterOptionsMap)

  return (
    <InfoCard>
      <InfoCardRow
        title="Unique assets"
        value={
          filterMap.assetId === undefined ? null : (
            <span>{formatNumber(filterMap.assetId.length)}</span>
          )
        }
      />

      <InfoCardRow
        title="Portfolio genesis"
        value={
          genesis === null ? (
            genesis
          ) : genesis === 0 ? undefined : (
            <span>{formatDate(genesis)}</span>
          )
        }
      />

      <InfoCardRow
        title="Last transaction"
        value={
          lastTx === null ? lastTx : lastTx === 0 ? undefined : <span>{formatDate(lastTx)}</span>
        }
      />
    </InfoCard>
  )
}
