import { Box, Stack, Typography } from "@mui/material"
import MuiTablePagination, {
  tablePaginationClasses,
  TablePaginationProps,
} from "@mui/material/TablePagination"
import React from "react"
import { useBreakpoints } from "src/hooks/useBreakpoints"

import { QueryTimer } from "./QueryTimer"
import { TablePaginationActions } from "./TableActions"

type TableFooterProps = TablePaginationProps & {
  queryTime?: number | null
  stickyVersion?: boolean
}

export function TableFooter(props: TableFooterProps) {
  const { queryTime, count, stickyVersion, sx, ...rest } = props

  const { isTablet } = useBreakpoints()

  return (
    <Stack
      direction="row"
      sx={{
        background: stickyVersion ? "var(--mui-palette-background-paper)" : undefined,
        borderBottomLeftRadius: "var(--priv-border-radius)",
        borderBottomRightRadius: "var(--priv-border-radius)",
        borderTop: "1px solid var(--mui-palette-TableCell-border)",
        bottom: 0,
        height: 40,
        paddingX: 2,
        position: stickyVersion ? "sticky" : undefined,
        ...sx,
        // TODO6
        // [`& .QueryTimer, & .MuiTablePagination-select[aria-expanded="false"], & .MuiSelect-icon:not(.MuiSelect-iconOpen)`]:
        //   {
        //     opacity: isTablet ? 1 : 0,
        //     transition: "opacity 0.1s ease-in 0.1s",
        //   },
        // [`&:hover .QueryTimer, &:hover .MuiTablePagination-select[aria-expanded="false"], &:hover .MuiSelect-icon:not(.MuiSelect-iconOpen)`]:
        //   {
        //     opacity: 1,
        //   },
      }}
      justifyContent="space-between"
      alignItems="center"
    >
      {queryTime !== undefined && <QueryTimer queryTime={queryTime} />}
      {count === -1 ? (
        // <Stack direction="row" justifyContent="space-between" flexGrow={1}>
        //   <Skeleton sx={{ width: { lg: 139, xs: 40 } }} height={38} />
        //   <Skeleton sx={{ width: { lg: 360, xs: 40 } }} height={38} />
        // </Stack>
        <Box sx={{ height: 38 }}></Box>
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
              marginLeft: queryTime !== undefined ? undefined : -1,
              marginRight: "auto",
            },
            [`& .${tablePaginationClasses.toolbar}`]: {
              paddingLeft: 0,
            },
            [`& .${tablePaginationClasses.select}, & .${tablePaginationClasses.selectIcon}`]: {
              color: "var(--mui-palette-text-secondary)",
            },
            [`& .${tablePaginationClasses.select}`]: {
              borderRadius: 1,
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
              renderValue: isTablet
                ? (value) => String(value)
                : (value) => `${value} rows per page`,
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
