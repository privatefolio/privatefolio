import { useStore } from "@nanostores/react"
import { atom } from "nanostores"
import React, { useEffect, useRef } from "react"
import { Subheading } from "src/components/Subheading"
import { Transaction } from "src/interfaces"
import { AddTransactionDrawer } from "src/pages/TransactionsPage/AddTransactionDrawer"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { TransactionActions } from "./TransactionActions"
import { TransactionTable } from "./TransactionTable"

const $drawerOpen = atom(false)
const toggleDrawer = () => $drawerOpen.set(true)

export default function TransactionsPage({ show }: { show: boolean }) {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Transactions - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const tableDataRef = useRef<Transaction[]>([])

  return (
    <>
      <StaggeredList component="main" gap={2} show={show}>
        <div>
          <Subheading>
            <span>Transactions</span>
            <TransactionActions tableDataRef={tableDataRef} />
          </Subheading>
          <TransactionTable tableDataRef={tableDataRef} toggleAddTransactionDrawer={toggleDrawer} />
        </div>
      </StaggeredList>
      <AddTransactionDrawer atom={$drawerOpen} />
    </>
  )
}
