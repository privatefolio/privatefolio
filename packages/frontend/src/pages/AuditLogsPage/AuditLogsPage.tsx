import { AlertTitle, Box } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useRef } from "react"
import { Callout } from "src/components/Callout"
import { Subheading } from "src/components/Subheading"
import { AuditLog } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"

import { StaggeredList } from "../../components/StaggeredList"
import { AuditLogActions } from "./AuditLogActions"
import { AuditLogTable } from "./AuditLogTable"

export default function AuditLogsPage({ show }: { show: boolean }) {
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Audit logs - ${activeAccount} - Privatefolio`
  }, [activeAccount])

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
      <Callout>
        <AlertTitle>What are audit logs?</AlertTitle>
        <Box>
          An audit log is a single balance change on your account.
          <br />
          They are the smallest unit of accounting.
        </Box>
      </Callout>
    </StaggeredList>
  )
}
