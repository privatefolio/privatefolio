import React, { useEffect } from "react"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { Subheading } from "../../components/Subheading"
import { AddressBookTable } from "./AddressBookTable"

export default function AddressBookPage({ show }: { show: boolean }) {
  useEffect(() => {
    document.title = `Address book - ${$activeAccount.get()} - Privatefolio`
  }, [])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <Subheading>
          <span>Address book</span>
        </Subheading>
        <AddressBookTable />
      </div>
    </StaggeredList>
  )
}
