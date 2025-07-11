import { Paper, Stack, TableHead, Typography } from "@mui/material"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableRow from "@mui/material/TableRow"
import { useStore } from "@nanostores/react"
import React, {
  ChangeEvent,
  ComponentType,
  MouseEvent,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { $debugMode } from "src/stores/app-store"
import { $showRelativeTime } from "src/stores/device-settings-store"
import { appBarHeight } from "src/theme"

import { TableFooter } from "../../components/TableFooter"
import {
  $inMemoryDataQueryTime,
  FILTER_LABEL_MAP,
  getFilterValueLabel,
} from "../../stores/metadata-store"
import { $colorArray, stringToNumber } from "../../utils/color-utils"
import {
  ActiveFilterMap,
  BaseType,
  HeadCell,
  Order,
  TableRowComponentProps,
  ValueSelector,
} from "../../utils/table-utils"
import { DefaultSpinner } from "../DefaultSpinner"
import { FilterChip } from "../FilterChip"
import { NoDataButton, NoFilterMatch } from "../NoDataButton"
import { ConnectedTableHead } from "./ConnectedTableHead"

function descendingComparator<T extends BaseType>(
  a: T,
  b: T,
  valueSelector: ValueSelector<T>,
  nullishSortPosition: "start" | "end" = "end"
) {
  const valueA = valueSelector(a)
  const valueB = valueSelector(b)

  const nullishA = valueA === undefined || valueA === null
  const nullishB = valueB === undefined || valueB === null

  if (nullishA && nullishB) {
    return 0
  } else if (nullishA) {
    return nullishSortPosition === "end" ? -1 : 1
  } else if (nullishB) {
    return nullishSortPosition === "end" ? 1 : -1
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
  valueSelector: ValueSelector<T>,
  nullishSortPosition: "start" | "end" = "end"
): (a: T, b: T) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, valueSelector, nullishSortPosition)
    : (a, b) => -descendingComparator(a, b, valueSelector, nullishSortPosition)
}

export type MemoryTableProps<T extends BaseType> = {
  TableRowComponent: ComponentType<TableRowComponentProps<T>>
  addNewRow?: ReactNode
  /**
   * @default 20
   */
  defaultRowsPerPage?: number
  emptyContent?: ReactNode
  error?: Error
  extraRow?: ReactNode
  headCells: HeadCell<T>[]
  initOrderBy: keyof T
  initOrderDir?: "asc" | "desc"
  /**
   * Controls where undefined values appear when sorting
   * @default 'end'
   */
  nullishSortPosition?: "start" | "end"
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
    initOrderDir = "desc",
    addNewRow,
    initOrderBy,
    queryTime,
    error,
    emptyContent = <NoDataButton />,
    extraRow,
    rowCount = rows.length,
    nullishSortPosition = "end",
  } = props

  const [order, setOrder] = useState<Order>(initOrderDir)
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
    setPage(0)
  }, [])

  const valueSelectors = useMemo(
    () =>
      headCells.reduce(
        (acc, headCell) => {
          if (!headCell.key) return acc

          const valueSelector =
            headCell.valueSelector ||
            ((row: T) => row[headCell.key as keyof T] as string | number | undefined)

          return { ...acc, [headCell.key]: valueSelector }
        },
        {} as Record<keyof T, ValueSelector<T>>
      ),
    [headCells]
  )

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        for (const key in activeFilters) {
          const value = valueSelectors[key](row)
          const filterValue = activeFilters[key]

          if (typeof value === "string" && typeof filterValue === "string") {
            if (!value.toLowerCase().includes(filterValue.toLowerCase())) return false
          } else if (value !== filterValue) {
            return false
          }
        }
        return true
      }),
    [rows, valueSelectors, activeFilters]
  )
  const visibleRows = useMemo(
    () =>
      filteredRows
        .sort(getComparator<T>(order, valueSelectors[orderBy], nullishSortPosition))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, order, valueSelectors, orderBy, page, rowsPerPage, nullishSortPosition]
  )

  const inMemoryDataQueryTime = useStore($inMemoryDataQueryTime)

  const relativeTime = useStore($showRelativeTime)

  const handleRelativeTime = useCallback((_event: MouseEvent<unknown>) => {
    $showRelativeTime.set(!$showRelativeTime.get())
  }, [])

  const { isMobile, isTablet } = useBreakpoints()

  const stickyVersion = true // rowsPerPage > 20

  const isLoading = queryTime === null
  const isEmpty = rowCount === 0

  // console.time("MemoryTable Render Time")

  // useEffect(() => {
  //   console.timeEnd("MemoryTable Render Time")
  // })

  const colorArray = useStore($colorArray)

  return (
    <>
      <Stack gap={1}>
        {Object.keys(activeFilters).length > 0 && inMemoryDataQueryTime !== null && (
          <Stack direction="row" gap={1} marginLeft={0.5} marginTop={0.5} flexWrap="wrap">
            {Object.keys(activeFilters).map((x) => (
              <FilterChip
                key={x}
                label={`${FILTER_LABEL_MAP[x]} = ${getFilterValueLabel(activeFilters[x])}`}
                color={colorArray[stringToNumber(x) % colorArray.length]}
                onDelete={() => {
                  setFilterKey(x as keyof T, undefined)
                }}
                onClick={() => {
                  navigator.clipboard.writeText(getFilterValueLabel(activeFilters[x]))
                }}
              />
            ))}
          </Stack>
        )}
        <Paper
          elevation={0}
          sx={{
            background: stickyVersion
              ? "var(--mui-palette-background-paper) !important"
              : undefined,
          }}
        >
          <TableContainer sx={{ overflowX: "unset" }}>
            <Table size="small" stickyHeader={stickyVersion}>
              {isTablet ? null : (
                <TableHead>
                  <TableRow>
                    {headCells.map((headCell, index) =>
                      headCell.hidden ? null : (
                        <TableCell
                          key={index}
                          padding="normal"
                          sortDirection={orderBy === headCell.key ? order : false}
                          sx={{
                            top: appBarHeight,
                            ...headCell.sx,
                            ...(isLoading || isEmpty
                              ? {
                                  borderColor: "transparent",
                                  opacity: 0,
                                  pointerEvents: "none",
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
                      )
                    )}
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRowComponent
                    isTablet={isTablet}
                    isMobile={isMobile}
                    key={row.id}
                    headCells={headCells}
                    relativeTime={relativeTime}
                    row={row}
                  />
                ))}
                {filteredRows.length === 0 && !isEmpty && !isLoading && !error && (
                  <TableRow>
                    <TableCell colSpan={headCells.length}>
                      <NoFilterMatch />
                    </TableCell>
                  </TableRow>
                )}
                {(isLoading || isEmpty) && (
                  <TableRow>
                    <TableCell colSpan={headCells.length}>
                      <Stack
                        justifyContent="center"
                        alignItems="center"
                        sx={{ height: defaultRowsPerPage === 10 ? 140 : 260 }}
                      >
                        {isEmpty && !isLoading && !error && emptyContent}
                        {isLoading && <DefaultSpinner />}
                        {error && (
                          <>
                            <Typography>Error loading data</Typography>
                            <Typography
                              color="error"
                              variant="body2"
                              component="div"
                              maxWidth={400}
                            >
                              <span>{error.message}</span>
                            </Typography>
                          </>
                        )}
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
                {!isLoading && extraRow && !isEmpty && extraRow}
              </TableBody>
            </Table>
          </TableContainer>
          <TableFooter
            stickyVersion={stickyVersion}
            page={page}
            queryTime={queryTime}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={
              $debugMode.get() ? [1, 10, 20, 50, 100, 200] : [10, 20, 50, 100, 200]
            }
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            sx={{
              ...(isLoading || isEmpty
                ? {
                    borderColor: "transparent",
                    opacity: 0,
                    pointerEvents: "none",
                  }
                : {}),
            }}
          />
        </Paper>
      </Stack>
    </>
  )
}
