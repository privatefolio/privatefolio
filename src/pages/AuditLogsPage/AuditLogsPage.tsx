import React from "react"
import { useSearchParams } from "react-router-dom"

import { StaggeredList } from "../../components/StaggeredList"
import { AuditLogTable } from "./AuditLogTable"

export default function AuditLogsPage({ show }: { show: boolean }) {
  const [searchParams] = useSearchParams()
  const txId = searchParams.get("txId") || undefined

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <AuditLogTable txId={txId} />
      </div>
    </StaggeredList>
  )
}
