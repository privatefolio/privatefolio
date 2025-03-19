import React, { useEffect, useRef } from "react"
import { Subheading } from "src/components/Subheading"
import { AuditLog } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { AuditLogActions } from "./AuditLogActions"
import { AuditLogTable } from "./AuditLogTable"

export default function AuditLogsPage({ show }: { show: boolean }) {
  useEffect(() => {
    document.title = `Audit logs - ${$activeAccount.get()} - Privatefolio`
  }, [])

  const tableDataRef = useRef<AuditLog[]>([])

  return (
    <StaggeredList component="main" gap={2} show={show}>
      <div>
        <Subheading>
          <span>Audit logs</span>
          <AuditLogActions tableDataRef={tableDataRef} />
        </Subheading>
        <AuditLogTable tableDataRef={tableDataRef} />
      </div>
    </StaggeredList>
  )
}
