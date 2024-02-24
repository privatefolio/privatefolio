import { AccessTimeFilledRounded, AccessTimeRounded, FilterListRounded } from "@mui/icons-material"
import {
  Badge,
  IconButton,
  InputBase,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Tooltip,
} from "@mui/material"
import Box from "@mui/material/Box"
import TableSortLabel from "@mui/material/TableSortLabel"
import { visuallyHidden } from "@mui/utils"
import { useStore } from "@nanostores/react"
import React from "react"

import { useBoolean } from "../../hooks/useBoolean"
import {
  $filterOptionsMap,
  FILTER_LABEL_MAP,
  FilterKey,
  getFilterValueLabel,
} from "../../stores/metadata-store"
import { ActiveFilterMap, BaseType, HeadCell, Order } from "../../utils/table-utils"

export interface ConnectedTableHeadProps<T extends BaseType> {
  activeFilters: ActiveFilterMap<T>
  headCell: HeadCell<T>
  onRelativeTime: (event: React.MouseEvent<unknown>) => void
  onSort: (event: React.MouseEvent<unknown>, property: keyof T) => void
  order: Order
  orderBy: keyof T
  relativeTime: boolean
  setFilterKey: (key: keyof T, value: string | number | undefined) => void
}

export function ConnectedTableHead<T extends BaseType>(props: ConnectedTableHeadProps<T>) {
  const {
    headCell,
    order,
    orderBy,
    onSort,
    relativeTime,
    onRelativeTime,
    activeFilters,
    setFilterKey,
  } = props
  const { key, numeric, label, hideLabel, filterable, sortable } = headCell

  const { value: open, toggle: toggleOpen } = useBoolean(false)

  const createSortHandler = (property: keyof T) => (event: React.MouseEvent<unknown>) => {
    onSort(event, property)
  }

  const filterMap = useStore($filterOptionsMap, { keys: [key as FilterKey] })
  const filterValue = activeFilters[key as string]

  const handleChange = (event: SelectChangeEvent<string>) => {
    if (!key) return
    setFilterKey(key, event.target.value || undefined)
  }

  return (
    <>
      <Stack
        direction="row"
        // marginX={-0.5}
        justifyContent={numeric ? "flex-end" : "flex-start"}
        alignItems="center"
      >
        {key === "timestamp" && (
          <Tooltip title={`Switch to ${relativeTime ? "absolute" : "relative"} time`}>
            <IconButton
              color="secondary"
              size="small"
              sx={{ marginLeft: -1, marginRight: 0.5 }}
              edge="start"
              onClick={onRelativeTime}
            >
              {relativeTime ? (
                <AccessTimeRounded fontSize="inherit" />
              ) : (
                <AccessTimeFilledRounded fontSize="inherit" />
              )}
            </IconButton>
          </Tooltip>
        )}
        {filterable && (
          <>
            <Select
              open={open}
              onClose={toggleOpen}
              onOpen={toggleOpen}
              value={filterValue || ""}
              label={label}
              onChange={handleChange}
              IconComponent={() => false}
              input={
                <InputBase
                  sx={{ height: 28, position: "absolute", visibility: "hidden", width: 30 }}
                />
              }
            >
              {filterValue && (
                <MenuItem value={""} dense>
                  <ListItemText primary={<em>None</em>} />
                </MenuItem>
              )}
              {filterMap[key as string] &&
                filterMap[key as string].map((x: string) => (
                  <MenuItem key={x} value={x} dense>
                    <ListItemText primary={getFilterValueLabel(x)} />
                  </MenuItem>
                ))}
            </Select>
            <Tooltip title={`Filter by ${FILTER_LABEL_MAP[key as string] || key}`}>
              <IconButton
                size="small"
                edge="start"
                sx={{ marginLeft: -1, marginRight: 0.5 }}
                onClick={toggleOpen}
              >
                <Badge badgeContent={filterValue || 0} color="accent" variant="dot">
                  <FilterListRounded fontSize="inherit" />
                </Badge>
              </IconButton>
            </Tooltip>
          </>
        )}
        {sortable ? (
          <TableSortLabel
            active={orderBy === key}
            direction={orderBy === key ? order : "asc"}
            onClick={key ? createSortHandler(key) : undefined}
          >
            {label}
            {orderBy === key ? (
              <Box component="span" sx={visuallyHidden}>
                {order === "desc" ? "sorted descending" : "sorted ascending"}
              </Box>
            ) : null}
          </TableSortLabel>
        ) : (
          <>{hideLabel ? "" : label}</>
        )}
      </Stack>
    </>
  )
}
