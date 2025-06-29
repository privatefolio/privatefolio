import { Paper, Stack, TableHead, Typography, useMediaQuery } from "@mui/material"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableRow from "@mui/material/TableRow"
import { useStore } from "@nanostores/react"
import React, {
  ChangeEvent,
  ComponentType,
  memo,
  MouseEvent,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import { useSearchParams } from "react-router-dom"
import { $debugMode } from "src/stores/app-store"
import { $showRelativeTime } from "src/stores/device-settings-store"
import { sleep } from "src/utils/utils"

import {
  $inMemoryDataQueryTime,
  FILTER_LABEL_MAP,
  getFilterValueLabel,
} from "../../stores/metadata-store"
import { stringToColor } from "../../utils/color-utils"
import {
  ActiveFilterMap,
  BaseType,
  HeadCell,
  Order,
  TableRowComponentProps,
} from "../../utils/table-utils"
import { CircularSpinner } from "../CircularSpinner"
import { FilterChip } from "../FilterChip"
import { NoDataButton } from "../NoDataButton"
import { TableFooter } from "../TableFooter"
import { ConnectedTableHead } from "./ConnectedTableHead"
import { ProgressWithMemory } from "./ProgressWithMemory"
export type { ConnectedTableHead } from "./ConnectedTableHead"

export type QueryTableData<T extends BaseType> = (
  filters: ActiveFilterMap<T>,
  rowsPerPage: number,
  page: number,
  order: Order,
  signal: AbortSignal
) => Promise<[T[], number | (() => Promise<number>)]>

export interface RemoteTableProps<T extends BaseType> {
  TableRowComponent: ComponentType<TableRowComponentProps<T>>
  addNewRow?: JSX.Element
  /**
   * @default 20
   */
  defaultRowsPerPage?: number
  emptyContent?: JSX.Element
  extraRow?: ReactNode
  headCells: HeadCell<T>[]
  initOrderBy: keyof T
  queryFn: QueryTableData<T>
}

function RemoteTableBase<T extends BaseType>(props: RemoteTableProps<T>) {
  const {
    headCells,
    queryFn,
    TableRowComponent,
    defaultRowsPerPage = 20,
    initOrderBy,
    emptyContent = <NoDataButton />,
    addNewRow,
    extraRow,
  } = props

  const [queryTime, setQueryTime] = useState<number | null>(null)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [rows, setRows] = useState<T[]>([])
  const [orderBy, setOrderBy] = useState<keyof T>(initOrderBy)
  const [error, setError] = useState<Error | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()

  const rowsPerPage = searchParams.get("rowsPerPage")
    ? Number(searchParams.get("rowsPerPage"))
    : defaultRowsPerPage
  const setRowsPerPage = useCallback(
    (rowsPerPage: number) => {
      searchParams.set("rowsPerPage", String(rowsPerPage))
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams]
  )

  const page = searchParams.get("page") ? Number(searchParams.get("page")) - 1 : 0
  const setPage = useCallback(
    (page: number) => {
      searchParams.set("page", String(page + 1))
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams]
  )

  const order = searchParams.get("order") ? (searchParams.get("order") as Order) : "desc"
  const setOrder = useCallback(
    (order: Order) => {
      searchParams.set("order", order)
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams]
  )

  const relativeTime = useStore($showRelativeTime)

  const handleRelativeTime = useCallback((_event: MouseEvent<unknown>) => {
    $showRelativeTime.set(!$showRelativeTime.get())
  }, [])

  const handleChangePage = useCallback(
    (_event: MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage)
    },
    [setPage]
  )

  const handleChangeRowsPerPage = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10))
      setPage(0)
    },
    [setPage, setRowsPerPage]
  )

  const handleSort = useCallback(
    (_event: MouseEvent<unknown>, property: keyof T) => {
      const isAsc = orderBy === property && order === "asc"
      setOrder(isAsc ? "desc" : "asc")
      setOrderBy(property)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderBy, order]
  )

  const activeFilters: ActiveFilterMap<T> = useMemo(() => {
    const activeFilters: ActiveFilterMap<T> = {}
    for (const [key, value] of searchParams) {
      if (key === "page" || key === "rowsPerPage" || key === "order") {
        continue
      }
      headCells.forEach((headCell) => {
        if (headCell.filterable && headCell.key === key) {
          activeFilters[key] = value
        }
      })
    }
    return activeFilters
  }, [headCells, searchParams])

  const setFilterKey = useCallback(
    (key: keyof T, value: string | number | undefined) => {
      if (value === undefined) {
        searchParams.delete(String(key))
      } else {
        searchParams.set(String(key), String(value))
      }
      setSearchParams(searchParams)
      setPage(0)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, setSearchParams]
  )

  useLayoutEffect(() => {
    const start = Date.now()
    const controller = new AbortController()

    setLoading(true)
    Promise.all([
      queryFn(activeFilters, rowsPerPage, page, order, controller.signal),
      sleep(10),
      //
    ])
      .then(([[rows, queryCount]]) => {
        setLoading(false)
        setRows(rows)
        setQueryTime(Date.now() - start)

        if (typeof queryCount === "function") {
          queryCount().then(setRowCount)
        } else {
          setRowCount(queryCount)
        }
      })
      .catch((error) => {
        console.error(error)
        setError(error as Error)
      })
      .finally(() => {
        setLoading(false)
      })

    return function cleanup() {
      controller.abort("Result no longer needed.")
    }
  }, [queryFn, activeFilters, rowsPerPage, page, order])

  const inMemoryDataQueryTime = useStore($inMemoryDataQueryTime)

  const isTablet = useMediaQuery("(max-width: 899px)")
  const isMobile = useMediaQuery("(max-width: 599px)")

  const stickyVersion = true // rowsPerPage > 20

  const isFirstLoading = queryTime === null
  const isEmpty = rows.length === 0 && Object.keys(activeFilters).length === 0

  // console.time("RemoteTable Render Time")

  // useEffect(() => {
  //   console.timeEnd("RemoteTable Render Time")
  // })

  return (
    <>
      <Stack gap={1}>
        {Object.keys(activeFilters).length > 0 && inMemoryDataQueryTime !== null && (
          <Stack direction="row" spacing={1} marginLeft={1} marginTop={0.5}>
            {Object.keys(activeFilters).map((x) => (
              <FilterChip
                key={x}
                label={`${FILTER_LABEL_MAP[x]} = ${getFilterValueLabel(activeFilters[x])}`}
                color={stringToColor(x)}
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
            paddingY: 0,
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
                            ...headCell.sx,
                            ...(isFirstLoading || isEmpty
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
                  <TableRow
                    sx={{
                      height: 0,
                      position: "sticky",
                      top: 39,
                    }}
                  >
                    <TableCell colSpan={headCells.length} sx={{ border: 0, padding: 0 }}>
                      {!isFirstLoading && (
                        <ProgressWithMemory
                          loading={loading}
                          lastQueryTime={queryTime}
                          sx={{
                            background: "transparent",
                            borderRadius: 0,
                            height: 2,
                            position: "absolute",
                            top: 0,
                            width: "100%",
                          }}
                          color="accent"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {rows.map((row) => (
                  <TableRowComponent
                    isTablet={isTablet}
                    isMobile={isMobile}
                    key={row.id}
                    headCells={headCells}
                    relativeTime={relativeTime}
                    row={row}
                  />
                ))}
                {rows.length === 0 && !isEmpty && !loading && !error && (
                  <TableRow>
                    <TableCell colSpan={headCells.length}>
                      No records match the current filters.
                    </TableCell>
                  </TableRow>
                )}
                {(isFirstLoading || isEmpty) && (
                  <TableRow>
                    <TableCell colSpan={headCells.length}>
                      <Stack
                        justifyContent="center"
                        alignItems="center"
                        sx={{ height: defaultRowsPerPage === 10 ? 100 : 260 }}
                        gap={1}
                      >
                        {isEmpty && !isFirstLoading && emptyContent}
                        {isFirstLoading && !error && <CircularSpinner color="secondary" />}
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
                {!isFirstLoading && addNewRow && !isEmpty && (
                  <TableRow>
                    <TableCell colSpan={headCells.length} variant="clickable">
                      {addNewRow}
                    </TableCell>
                  </TableRow>
                )}
                {!isFirstLoading && extraRow && !isEmpty && (
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
            queryTime={queryTime}
            count={rowCount ?? -1}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPageOptions={$debugMode.get() ? [1, 10, 20, 50, 100] : [10, 20, 50, 100]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              ...(isFirstLoading || isEmpty
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

export const RemoteTable = memo(RemoteTableBase) as <T extends BaseType>(
  props: RemoteTableProps<T>
) => JSX.Element
