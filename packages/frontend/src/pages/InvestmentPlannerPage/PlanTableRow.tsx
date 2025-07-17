import { Calculate, ContentCopy, Delete, Edit, Assessment, ErrorOutline } from "@mui/icons-material"
import { CircularProgress, IconButton, TableCell, TableRow, Tooltip } from "@mui/material"
import React from "react"
import { Plan } from "privatefolio-backend/src/extensions/investment-planner/types"
import { TableRowComponentProps } from "src/utils/table-utils"

interface PlanTableRowProps extends TableRowComponentProps<Plan> {
  isCalculating: boolean
  onCalculate: (id: number) => void
  onViewReport: (id: number) => void
  onEdit: (plan: Plan) => void
  onDuplicate: (id: number) => void
  onDelete: (id: number) => void
}

export function PlanTableRow(props: PlanTableRowProps) {
  const { row, isCalculating, onCalculate, onViewReport, onEdit, onDuplicate, onDelete } = props

  return (
    <TableRow hover key={row.id}>
      <TableCell>{row.name}</TableCell>
      <TableCell align="right">{row.budget}</TableCell>
      <TableCell>{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"}</TableCell>
      <TableCell>
        {row.lastCalculatedAt ? new Date(row.lastCalculatedAt).toLocaleString() : "-"}
      </TableCell>
      <TableCell align="right">
        {row.calculationStatus === "failed" && (
          <Tooltip title="Calculation Failed">
            <ErrorOutline color="error" />
          </Tooltip>
        )}
        {row.calculationStatus === "completed" && (
          <Tooltip title="View Report">
            <IconButton onClick={() => onViewReport(row.id)}>
              <Assessment />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Calculate">
          <span>
            <IconButton
              onClick={() => onCalculate(row.id)}
              disabled={isCalculating || row.calculationStatus === "in_progress"}
            >
              {isCalculating ? <CircularProgress size={24} /> : <Calculate />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton onClick={() => onEdit(row)} disabled={isCalculating}>
            <Edit />
          </IconButton>
        </Tooltip>
        <Tooltip title="Duplicate">
          <IconButton onClick={() => onDuplicate(row.id)} disabled={isCalculating}>
            <ContentCopy />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton onClick={() => onDelete(row.id)} disabled={isCalculating}>
            <Delete />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
} 