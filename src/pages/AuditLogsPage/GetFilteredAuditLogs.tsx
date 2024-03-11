import React from "react"
import ExportToCsv, { CsvData } from "src/components/ExportToCsv"
import { AuditLog } from "src/interfaces"
import { formatDateWithHour } from "src/utils/formatting-utils"

interface filteredData {
  auditLogsFiltered: AuditLog[]
}

export function GetFilteredAuditLogs(props: filteredData) {
  const { auditLogsFiltered } = props
  const rows: CsvData = auditLogsFiltered.map((x) => [
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
  const data: CsvData = [
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
  ]

  return (
    <ExportToCsv
      data={data}
      filename="audit-logs.csv"
      text="Download csv. with current audit logs"
    />
  )
}
