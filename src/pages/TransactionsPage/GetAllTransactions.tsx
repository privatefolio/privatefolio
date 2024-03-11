import React, { useEffect, useState } from "react"
import ExportToCsv, { CsvData } from "src/components/ExportToCsv"
import { EtherscanTransaction } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { formatDateWithHour } from "src/utils/formatting-utils"
import { clancy } from "src/workers/remotes"

export function GetAllTransactions() {
  const [data, setData] = useState<CsvData>([])

  useEffect(() => {
    clancy.findTransactions({}, $activeAccount.get()).then((transactions) => {
      const rows = transactions.map((x) => [
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

      setData([
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
      ])
    })
  }, [])

  return (
    <>
      <ExportToCsv data={data} filename="transactions.csv" text="Export to csv. all transactions" />
    </>
  )
}
