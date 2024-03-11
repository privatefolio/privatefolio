import React, { useEffect, useState } from "react"
import ExportToCsv, { CsvData } from "src/components/ExportToCsv"
import { $activeAccount } from "src/stores/account-store"
import { formatDateWithHour } from "src/utils/formatting-utils"
import { clancy } from "src/workers/remotes"

export function GetAllAuditLogs() {
  const [data, setData] = useState<CsvData>([])

  useEffect(() => {
    clancy.findAuditLogs({}, $activeAccount.get()).then((auditLogs) => {
      const rows = auditLogs.map((x) => [
        x._id,
        formatDateWithHour(x.timestamp, {
          timeZone: "UTC",
          timeZoneName: "short",
        }),
        x.platform,
        x.wallet,
        x.operation,
        x.change,
        x.balance,
        x.txId,
      ])

      setData([
        [
          "Identifier",
          "Timestamp",
          "Platform",
          "Wallet",
          "Operation",
          "Change",
          "New Balance",
          "Transaction ID",
        ],
        ...rows,
      ])
    })
  }, [])

  return (
    <>
      <ExportToCsv data={data} filename="audit-logs.csv" text="Export to csv. all audit logs" />
    </>
  )
}
