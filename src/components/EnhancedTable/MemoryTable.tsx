import { Paper, Stack, TableHead, useMediaQuery } from "@mui/material"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableRow from "@mui/material/TableRow"
import React, {
  ChangeEvent,
  ComponentType,
  MouseEvent,
  useCallback,
  useMemo,
  useState,
} from "react"
import { $debugMode } from "src/stores/app-store"

import { TableFooter } from "../../components/TableFooter"
import { FILTER_LABEL_MAP, getFilterValueLabel } from "../../stores/metadata-store"
import { stringToColor } from "../../utils/color-utils"
import {
  ActiveFilterMap,
  BaseType,
  HeadCell,
  Order,
  TableRowComponentProps,
  ValueSelector,
} from "../../utils/table-utils"
import { CircularSpinner } from "../CircularSpinner"
import { FilterChip } from "../FilterChip"
import { NoDataButton } from "../NoDataButton"
import { ConnectedTableHead } from "./ConnectedTableHead"

function descendingComparator<T extends BaseType>(a: T, b: T, valueSelector: ValueSelector<T>) {
  const valueA = valueSelector(a)
  const valueB = valueSelector(b)

  if (valueA === undefined && valueB === undefined) {
    return 0
  } else if (valueA === undefined) {
    return 1
  } else if (valueB === undefined) {
    return -1
  }

  if (valueB < valueA) {
    return -1
  }
  if (valueB > valueA) {
    return 1
  }

  return 0
}

export function getComparator<T extends BaseType>(
  order: Order,
  valueSelector: ValueSelector<T>
): (a: T, b: T) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, valueSelector)
    : (a, b) => -descendingComparator(a, b, valueSelector)
}

export type MemoryTableProps<T extends BaseType> = {
  TableRowComponent: ComponentType<TableRowComponentProps<T>>
  addNewRow?: JSX.Element
  /**
   * @default 20
   */
  defaultRowsPerPage?: number
  emptyContent?: JSX.Element
  extraRow?: JSX.Element
  headCells: HeadCell<T>[]
  initOrderBy: keyof T
  queryTime?: number | null
  rowCount?: number
  rows: T[]
}

export function MemoryTable<T extends BaseType>(props: MemoryTableProps<T>) {
  const {
    headCells,
    rows,
    TableRowComponent,
    defaultRowsPerPage = 20,
    addNewRow,
    initOrderBy,
    queryTime,
    emptyContent = <NoDataButton />,
    extraRow,
    rowCount = rows.length,
  } = props

  const [order, setOrder] = useState<Order>("desc")
  const [orderBy, setOrderBy] = useState<keyof T>(initOrderBy)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)

  const handleSort = useCallback(
    (_event: MouseEvent<unknown>, property: keyof T) => {
      const isAsc = orderBy === property && order === "asc"
      setOrder(isAsc ? "desc" : "asc")
      setOrderBy(property)
    },
    [orderBy, order]
  )

  const handleChangePage = useCallback(
    (_event: MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage)
    },
    []
  )

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }, [])

  const [activeFilters, setActiveFilters] = useState<ActiveFilterMap<T>>({})

  const setFilterKey = useCallback((key: keyof T, value: string | number | undefined) => {
    setActiveFilters((previous) => {
      const next = { ...previous }

      if (value === undefined) {
        delete next[key]
      } else {
        next[key] = value
      }

      return next
    })
  }, [])

  const valueSelectors = useMemo(
    () =>
      headCells.reduce((acc, headCell) => {
        if (!headCell.key) return acc

        const valueSelector =
          headCell.valueSelector ||
          ((row: T) => row[headCell.key as keyof T] as string | number | undefined)

        return { ...acc, [headCell.key]: valueSelector }
      }, {} as Record<keyof T, ValueSelector<T>>),
    [headCells]
  )

  const visibleRows = useMemo(
    () =>
      rows
        .filter((row) => {
          for (const key in activeFilters) {
            if (valueSelectors[key](row) !== activeFilters[key]) {
              return false
            }
          }
          return true
        })
        .sort(getComparator<T>(order, valueSelectors[orderBy]))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, order, orderBy, page, rowsPerPage, valueSelectors, activeFilters]
  )

  const [relativeTime, setRelativeTime] = useState(!$debugMode.get())

  const handleRelativeTime = useCallback((_event: MouseEvent<unknown>) => {
    setRelativeTime((prev) => !prev)
  }, [])

  const isTablet = useMediaQuery("(max-width: 899px)")
  const isMobile = useMediaQuery("(max-width: 599px)")

  const stickyVersion = rowsPerPage > 20

  const isLoading = queryTime === null
  const isEmpty = rowCount === 0

  return (
    <>
      <Stack gap={1}>
        {Object.keys(activeFilters).length > 0 && (
          <Stack direction="row" spacing={1} marginLeft={1} marginTop={0.5}>
            {Object.keys(activeFilters).map((x) => (
              <FilterChip
                key={x}
                label={`${FILTER_LABEL_MAP[x]} = ${getFilterValueLabel(activeFilters[x])}`}
                color={stringToColor(x)}
                onDelete={() => {
                  setFilterKey(x as keyof T, undefined)
                }}
              />
            ))}
          </Stack>
        )}
        <Paper
          variant="outlined"
          sx={{
            background: stickyVersion ? "var(--mui-palette-background-paper)" : undefined,
            overflowX: { lg: "unset", xs: "auto" },
          }}
        >
          <TableContainer sx={{ overflowX: "unset" }}>
            <Table size="small" stickyHeader={stickyVersion}>
              {isTablet ? null : (
                <TableHead>
                  <TableRow>
                    {headCells.map((headCell, index) => (
                      <TableCell
                        key={index}
                        padding="normal"
                        sortDirection={orderBy === headCell.key ? order : false}
                        sx={{
                          ...headCell.sx,
                          ...(isLoading || isEmpty
                            ? {
                                borderColor: "transparent",
                                opacity: 0,
                              }
                            : {}),
                        }}
                      >
                        <ConnectedTableHead<T>
                          activeFilters={activeFilters}
                          setFilterKey={setFilterKey}
                          headCell={headCell}
                          order={order}
                          orderBy={orderBy}
                          onSort={handleSort}
                          onRelativeTime={handleRelativeTime}
                          relativeTime={relativeTime}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRowComponent
                    isTablet={isTablet}
                    isMobile={isMobile}
                    key={row._id}
                    headCells={headCells}
                    relativeTime={relativeTime}
                    row={row}
                  />
                ))}
                {visibleRows.length === 0 && !isEmpty && (
                  <TableRow>
                    <TableCell colSpan={headCells.length}>
                      No data matches the current filters...
                    </TableCell>
                  </TableRow>
                )}
                {(isLoading || isEmpty) && (
                  <TableRow>
                    <TableCell colSpan={headCells.length}>
                      <Stack justifyContent="center" alignItems="center" sx={{ height: 260 }}>
                        {isEmpty && !isLoading && emptyContent}
                        {isLoading && <CircularSpinner color="accent" />}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && addNewRow && !isEmpty && (
                  <TableRow>
                    <TableCell colSpan={headCells.length} variant="clickable">
                      {addNewRow}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && extraRow && !isEmpty && (
                  <TableRow>
                    <TableCell colSpan={headCells.length} variant="clickable">
                      {extraRow}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TableFooter
            stickyVersion={stickyVersion}
            page={page}
            queryTime={queryTime}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            count={rows.length}
            rowsPerPage={rowsPerPage}
            sx={{
              ...(isLoading || isEmpty
                ? {
                    borderColor: "transparent",
                    opacity: 0,
                  }
                : {}),
            }}
          />
        </Paper>
      </Stack>
    </>
  )
}
