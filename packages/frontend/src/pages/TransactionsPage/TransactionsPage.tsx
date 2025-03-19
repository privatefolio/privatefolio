import React, { useEffect, useRef } from "react"
import { AddTransactionDrawer } from "src/components/AddTransactionDrawer"
import { Subheading } from "src/components/Subheading"
import { useBoolean } from "src/hooks/useBoolean"
import { Transaction } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { TransactionActions } from "./TransactionActions"
import { TransactionTable } from "./TransactionTable"

export default function TransactionsPage({ show }: { show: boolean }) {
  useEffect(() => {
    document.title = `Transactions - ${$activeAccount.get()} - Privatefolio`
  }, [])

  const tableDataRef = useRef<Transaction[]>([])

  const { value: open, toggle: toggleOpen } = useBoolean(false)

  return (
    <>
      <StaggeredList component="main" gap={2} show={show}>
        <div>
          <Subheading>
            <span>Transactions</span>
            <TransactionActions
              tableDataRef={tableDataRef}
              toggleAddTransactionDrawer={toggleOpen}
            />
          </Subheading>
          <TransactionTable tableDataRef={tableDataRef} toggleAddTransactionDrawer={toggleOpen} />
        </div>
      </StaggeredList>
      <AddTransactionDrawer open={open} toggleOpen={toggleOpen} />
    </>
  )
}
