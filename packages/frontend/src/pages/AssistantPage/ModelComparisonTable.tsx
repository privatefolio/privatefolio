import { TableCell, TableRow, Tooltip } from "@mui/material"
import {
  AssistantModel,
  AVAILABLE_MODELS,
} from "privatefolio-backend/src/settings/assistant-models"
import React, { useMemo } from "react"
import { AmountBlock } from "src/components/AmountBlock"
import { AssistantModelAvatar } from "src/components/AssistantModelIcon"
import { MemoryTable } from "src/components/EnhancedTable/MemoryTable"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { Truncate } from "src/components/Truncate"
import { getFilterValueLabel } from "src/stores/metadata-store"
import { HeadCell, TableRowComponentProps } from "src/utils/table-utils"

function AssistantModelComponent({ row }: TableRowComponentProps<AssistantModel>) {
  return (
    <TableRow>
      <TableCell>
        <AssistantModelAvatar model={row} size="small" />
      </TableCell>
      <TableCell>{row.label}</TableCell>
      <TableCell>
        <Tooltip title={row.description.length > 50 ? row.description : undefined}>
          <Truncate>{row.description}</Truncate>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Tooltip
          title={
            row.capabilities && row.capabilities.length > 2
              ? row.capabilities.map(getFilterValueLabel).join(", ")
              : undefined
          }
        >
          <Truncate>
            {row.capabilities &&
              row.capabilities.length > 0 &&
              row.capabilities.map(getFilterValueLabel).join(", ")}
          </Truncate>
        </Tooltip>
      </TableCell>
      <TableCell align="right" variant="clickable">
        <AmountBlock amount={row.contextWindow} currencyTicker="tokens" compact />
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
  const headCells: HeadCell<AssistantModel>[] = useMemo(
    () => [
      {
        filterable: true,
        key: "family",
        sortable: true,
        sx: { maxWidth: 40, minWidth: 40, width: 40 },
      },
      {
        key: "label",
        label: "Model",
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
      },
      {
        key: "description",
        label: "Description",
        sortable: true,
        sx: { width: "100%" },
      },
      {
        filterable: true,
        key: "capabilities",
        label: "Capabilities",
        sortable: true,
        sx: { maxWidth: 200, minWidth: 200, width: 200 },
        valueSelector: (row) => row.capabilities?.join(", ") ?? "",
      },
      {
        key: "contextWindow",
        label: "Context Window",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
      },
      {
        key: "costPer1kTokens.input" as keyof AssistantModel,
        label: "Input Cost",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
        valueSelector: (row) => row.costPer1kTokens.input,
      },
      {
        key: "costPer1kTokens.output" as keyof AssistantModel,
        label: "Output Cost",
        numeric: true,
        sortable: true,
        sx: { maxWidth: 180, minWidth: 180, width: 180 },
        valueSelector: (row) => row.costPer1kTokens.output,
      },
    ],
    []
  )

  return (
    <MemoryTable<AssistantModel>
      initOrderBy={"costPer1kTokens.output" as keyof AssistantModel}
      initOrderDir="asc"
      headCells={headCells}
      TableRowComponent={AssistantModelComponent}
      rows={AVAILABLE_MODELS}
      defaultRowsPerPage={10}
    />
  )
}
