import { Skeleton, Stack, Typography, useMediaQuery } from "@mui/material"
import MuiTablePagination, {
  tablePaginationClasses,
  TablePaginationProps,
} from "@mui/material/TablePagination"
import React from "react"

import { QueryTimer } from "./QueryTimer"
import { TablePaginationActions } from "./TableActions"

type TableFooterProps = TablePaginationProps & {
  queryTime?: number | null
  stickyVersion?: boolean
}

export function TableFooter(props: TableFooterProps) {
  const { queryTime, count, stickyVersion, ...rest } = props

  const isTablet = useMediaQuery("(max-width: 899px)")

  return (
    <Stack
      direction="row"
      sx={{
        background: stickyVersion ? "var(--mui-palette-background-paper)" : undefined,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderTop: "1px solid var(--mui-palette-TableCell-border)",
        bottom: 0,
        paddingX: 1.5,
        position: stickyVersion ? "sticky" : undefined,
      }}
      justifyContent="space-between"
      alignItems="center"
    >
      {queryTime !== undefined && <QueryTimer queryTime={queryTime} />}
      {count === -1 ? (
        <Stack direction="row" justifyContent="space-between" flexGrow={1}>
          <Skeleton width={139} height={38} />
          <Skeleton width={360} height={38} />
        </Stack>
      ) : (
        <MuiTablePagination
          component="div"
          sx={{
            border: 0,
            marginRight: -1,
            width: isTablet ? undefined : "100%",
            [`& .${tablePaginationClasses.spacer}`]: {
              flexBasis: 0,
              flexGrow: 0,
            },
            [`& .${tablePaginationClasses.input}`]: {
              marginRight: "auto",
            },
            [`& .${tablePaginationClasses.toolbar}`]: {
              paddingLeft: 0,
            },
            [`& .${tablePaginationClasses.select}, & .${tablePaginationClasses.selectIcon}`]: {
              color: "var(--mui-palette-text-secondary)",
            },
            [`& .${tablePaginationClasses.select}`]: {
              borderRadius: "8px !important",
            },
            [`& .${tablePaginationClasses.select}:hover`]: {
              background: "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.05)",
            },
          }}
          labelRowsPerPage=""
          labelDisplayedRows={({ from, to, count }) =>
            isTablet ? null : (
              <>
                {from}-{to}{" "}
                <Typography variant="body2" component="span" color="text.secondary">
                  of {count}
                </Typography>
              </>
            )
          }
          slotProps={{
            select: {
              renderValue: (value) => `${value} rows per page`,
              sx: { display: { sm: "inline-flex", xs: "none" } },
            },
          }}
          ActionsComponent={TablePaginationActions}
          count={count}
          {...rest}
        />
      )}
    </Stack>
  )
}
