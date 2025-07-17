import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { Subheading } from "../../components/Subheading"
import { AssetsActions } from "./AssetsActions"
import { AssetTable } from "./AssetTable"

export default function AssetsPage({ show }: { show: boolean }) {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Assets - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <Subheading>
          <span>Favorite assets</span>
          <AssetsActions />
        </Subheading>
        <AssetTable />
      </div>
    </StaggeredList>
  )
}
