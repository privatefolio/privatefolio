import React, { useEffect } from "react"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { Subheading } from "../../components/Subheading"
import { TagsTable } from "./TagsTable"

export default function TagsPage({ show }: { show: boolean }) {
  useEffect(() => {
    document.title = `Tags - ${$activeAccount.get()} - Privatefolio`
  }, [])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <Subheading>
          <span>Tags</span>
        </Subheading>
        <TagsTable />
      </div>
    </StaggeredList>
  )
}
