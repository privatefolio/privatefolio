import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { InfoCards } from "src/components/InfoCard"
import { $activeAccount } from "src/stores/account-store"

import { DatabaseInfo } from "./DatabaseInfo"
import { PortfolioInfo } from "./PortfolioInfo"

export function ImportDataInfo() {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Database info - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  return (
    <InfoCards>
      <DatabaseInfo />
      <PortfolioInfo />
    </InfoCards>
  )
}
