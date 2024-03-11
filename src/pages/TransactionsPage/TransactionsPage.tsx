import React from "react"
import { useSearchParams } from "react-router-dom"

import { StaggeredList } from "../../components/StaggeredList"
import { TransactionTable } from "./TransactionTable"

export default function TransactionsPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const id = searchParams.get("id") || undefined

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <TransactionTable id={id} />
      </div>
    </StaggeredList>
  )
}
