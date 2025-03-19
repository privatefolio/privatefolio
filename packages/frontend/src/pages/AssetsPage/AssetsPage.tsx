import React, { useEffect } from "react"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { Subheading } from "../../components/Subheading"
import { AssetsActions } from "./AssetsActions"
import { AssetTable } from "./AssetTable"

export default function AssetsPage({ show }: { show: boolean }) {
  useEffect(() => {
    document.title = `Assets - ${$activeAccount.get()} - Privatefolio`
  }, [])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <Subheading>
          <span>Assets</span>
          <AssetsActions />
        </Subheading>
        <AssetTable />
      </div>
    </StaggeredList>
  )
}
