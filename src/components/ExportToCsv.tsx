import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import { ListItemIcon, ListItemText, Stack } from "@mui/material"
import React from "react"
import { CSVLink } from "react-csv"

export type CsvData = (string | number | undefined)[][]

interface ExportToCsvProps {
  data: CsvData
  filename: string
  text: string
}
export default function ExportToCsv(props: ExportToCsvProps) {
  const { data, filename, text } = props
  return (
    <>
      <CSVLink filename={filename} data={data} style={{ color: "#FFFFFF", textDecoration: "none" }}>
        <Stack direction="row">
          <ListItemIcon>
            <DownloadRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{text}</ListItemText>
        </Stack>
      </CSVLink>
    </>
  )
}
