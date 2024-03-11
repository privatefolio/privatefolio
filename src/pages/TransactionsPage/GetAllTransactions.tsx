import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded"
import { CircularProgress, ListItemIcon, ListItemText, MenuItem, Stack } from "@mui/material"
import React, { useState } from "react"
import ExportToCsv, { CsvData } from "src/components/ExportToCsv"
import { EtherscanTransaction } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { formatDateWithHour } from "src/utils/formatting-utils"
import { clancy } from "src/workers/remotes"

interface handleClose {
  handleClose: () => void
}

export function GetAllTransactions(props: handleClose) {
  const { handleClose } = props
  const [data, setData] = useState<CsvData>([])
  const [loading, setLoading] = useState<boolean>(false)

  if (loading) {
    return (
      <MenuItem dense disabled>
        <Stack direction="row">
          <ListItemIcon>
            <CircularProgress size="1rem" />
          </ListItemIcon>
          <ListItemText>Generating...</ListItemText>
        </Stack>
      </MenuItem>
    )
  }

  if (!data.length) {
    return (
      <MenuItem
        dense
        onClick={() => {
          setLoading(true)

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
            setLoading(false)
          })
        }}
      >
        <Stack direction="row">
          <ListItemIcon>
            <ExitToAppRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to csv. all transactions</ListItemText>
        </Stack>
      </MenuItem>
    )
  }

  // useEffect(() => {
  //   clancy.findTransactions({}, $activeAccount.get()).then((transactions) => {
  //     const rows = transactions.map((x) => [
  //       x._id,
  //       formatDateWithHour(x.timestamp, {
  //         timeZone: "UTC",
  //         timeZoneName: "short",
  //       }),
  //       x.platform,
  //       x.wallet,
  //       x.type,
  //       x.incoming,
  //       x.outgoing,
  //       x.fee,
  //       (x as EtherscanTransaction).contractAddress,
  //       (x as EtherscanTransaction).method,
  //       x.txHash,
  //       x.notes,
  //     ])

  //     setData([
  //       [
  //         "Identifier",
  //         "Timestamp",
  //         "Platform",
  //         "Wallet",
  //         "Type",
  //         "Incoming",
  //         "Outgoing",
  //         "Fee",
  //         "Smart Contract",
  //         "Smart Contract Method",
  //         "Blockchain Tx",
  //         "Notes",
  //       ],
  //       ...rows,
  //     ])
  //   })
  // }, [])
  if (data.length) {
    return (
      <>
        <MenuItem
          dense
          onClick={() => {
            handleClose()
          }}
        >
          <ExportToCsv
            data={data}
            filename="transactions.csv"
            text="Export to csv. all transactions"
          />
        </MenuItem>
      </>
    )
  }
}
