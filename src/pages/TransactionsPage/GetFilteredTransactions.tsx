import React from "react"
import ExportToCsv, { CsvData } from "src/components/ExportToCsv"
import { EtherscanTransaction, Transaction } from "src/interfaces"
import { formatDateWithHour } from "src/utils/formatting-utils"

interface filteredData {
  transactionsFiltered: Transaction[]
}

export function GetFilteredTransactions(props: filteredData) {
  const { transactionsFiltered } = props
  const rows: CsvData = transactionsFiltered.map((x) => [
    x._id,
    formatDateWithHour(x.timestamp, {
      timeZone: "UTC",
      timeZoneName: "short",
    }),
    x.platform,
    x.wallet,
    x.type,
    x.incoming,
    x.outgoing,
    x.fee,
    (x as EtherscanTransaction).contractAddress,
    (x as EtherscanTransaction).method,
    x.txHash,
    x.notes,
  ])
  const data: CsvData = [
    [
      "Identifier",
      "Timestamp",
      "Platform",
      "Wallet",
      "Type",
      "Incoming",
      "Outgoing",
      "Fee",
      "Smart Contract",
      "Smart Contract Method",
      "Blockchain Tx",
      "Notes",
    ],
    ...rows,
  ]

  return (
    <ExportToCsv
      data={data}
      filename="transactions.csv"
      text="Download csv. with current transactions"
    />
  )
}
