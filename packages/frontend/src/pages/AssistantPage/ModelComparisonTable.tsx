import { Stack, TableCell, TableRow } from "@mui/material"
import {
  AssistantModel,
  AVAILABLE_MODELS,
} from "privatefolio-backend/src/settings/assistant-models"
import React, { useMemo } from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { AssistantModelIcon } from "src/components/AssistantModelIcon"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { HeadCell, TableRowComponentProps } from "src/utils/table-utils"

interface ModelTableRow extends AssistantModel {
  id: string
}

function ModelTableRowComponent({ row }: TableRowComponentProps<ModelTableRow>) {
  return (
    <TableRow>
      <TableCell>
        <Stack direction="row" alignItems="center">
          <AssistantModelIcon model={row} size={14} sx={{ marginRight: 1 }} />
          <span>{row.label}</span>
        </Stack>
      </TableCell>
      <TableCell align="right" variant="clickable">
        <AmountBlock amount={row.contextWindow} currencyTicker="tokens" />
      </TableCell>
      <TableCell align="right" variant="clickable">
        <QuoteAmountBlock amount={row.costPer1kTokens.input} formatting="price" />
      </TableCell>
      <TableCell align="right" variant="clickable">
        <QuoteAmountBlock amount={row.costPer1kTokens.output} formatting="price" />
      </TableCell>
    </TableRow>
  )
}

export function ModelComparisonTable() {
  const headCells: HeadCell<ModelTableRow>[] = useMemo(
    () => [
      // {
      //   // filterable: true,
      //   key: "provider",
      //   label: "Provider",
      //   sortable: true,
      //   sx: { maxWidth: 120, minWidth: 120, width: 120 },
      // },
      {
        key: "label",
        label: "Model",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 180, width: 200 },
      },
      {
        key: "contextWindow",
        label: "Context Window",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 140, minWidth: 140, width: 140 },
      },
      {
        key: "costPer1kTokens.input" as keyof ModelTableRow,
        label: "Input Cost",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
        valueSelector: (row) => row.costPer1kTokens.input,
      },
      {
        key: "costPer1kTokens.output" as keyof ModelTableRow,
        label: "Output Cost",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 120, minWidth: 120, width: 120 },
        valueSelector: (row) => row.costPer1kTokens.output,
      },
    ],
    []
  )

  const rows: ModelTableRow[] = useMemo(
    () =>
      AVAILABLE_MODELS.map((model) => ({
        ...model,
        id: model.value,
      })),
    []
  )

  return (
    <MemoryTable<ModelTableRow>
      initOrderBy={"costPer1kTokens.output" as keyof ModelTableRow}
      initOrderDir="asc"
      headCells={headCells}
      TableRowComponent={ModelTableRowComponent}
      rows={rows}
      // defaultRowsPerPage={50}
    />
  )
}
