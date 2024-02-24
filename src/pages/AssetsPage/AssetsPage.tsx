import React from "react"

import { StaggeredList } from "../../components/StaggeredList"
import { Subheading } from "../../components/Subheading"
import { AssetTable } from "./AssetTable"

export default function AssetsPage({ show }: { show: boolean }) {
  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <Subheading>
          <span>Assets</span>
        </Subheading>
        <AssetTable />
      </div>
    </StaggeredList>
  )
}
