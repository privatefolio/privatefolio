import { useStore } from "@nanostores/react"
import React, { useEffect } from "react"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { Subheading } from "../../components/Subheading"
import { AddressBookTable } from "./AddressBookTable"

export default function AddressBookPage({ show }: { show: boolean }) {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Address book - ${activeAccount} - Privatefolio`
  }, [activeAccount])

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
