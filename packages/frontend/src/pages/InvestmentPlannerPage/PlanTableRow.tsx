import { Calculate, ContentCopy, Delete, Edit } from "@mui/icons-material"
import { IconButton, TableCell, TableRow, Tooltip } from "@mui/material"
import React from "react"
import { Plan } from "privatefolio-backend/src/extensions/investment-planner/types"
import { TableRowComponentProps } from "src/utils/table-utils"

interface PlanTableRowProps extends TableRowComponentProps<Plan> {
    onCalculate: (id: number) => void
    onEdit: (plan: Plan) => void
    onDuplicate: (id: number) => void
    onDelete: (id: number) => void
}

export function PlanTableRow(props: PlanTableRowProps) {
    const { row, onCalculate, onEdit, onDuplicate, onDelete } = props
    
    return (
        <TableRow hover key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell align="right">{row.budget}</TableCell>
            <TableCell>{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"}</TableCell>
            <TableCell align="right">
                <Tooltip title="Calculate">
                    <IconButton onClick={() => onCalculate(row.id)}>
                        <Calculate />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                    <IconButton onClick={() => onEdit(row)}>
                        <Edit />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate">
                    <IconButton onClick={() => onDuplicate(row.id)}>
                        <ContentCopy />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton onClick={() => onDelete(row.id)}>
                        <Delete />
                    </IconButton>
                </Tooltip>
            </TableCell>
        </TableRow>
    )
} 