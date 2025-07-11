import { TimerSharp } from "@mui/icons-material"
import { Stack, Tooltip, Typography, TypographyProps } from "@mui/material"
import React, { memo } from "react"
import { useBreakpoints } from "src/hooks/useBreakpoints"

import { formatDuration } from "../utils/formatting-utils"

function QueryTimerBase({ queryTime, ...rest }: { queryTime: number | null } & TypographyProps) {
  const { isMobile } = useBreakpoints()

  return (
    <>
      <Tooltip
        title={
          queryTime ? (
            <Stack>
              <span>Query time: {formatDuration(queryTime, true)}</span>
              {/* <span>Count query time: 0.1s</span> */}
              <span className="secondary">
                This measures the time it takes for the server to process the query and return the
                data.
              </span>
            </Stack>
          ) : null
        }
      >
        <Typography
          variant="body2"
          color="text.secondary"
          component={Stack}
          direction="row"
          alignItems="center"
          gap={1}
          className="QueryTimer"
          {...rest}
        >
          {queryTime === null ? (
            <>
              {/* Seems no longer needed */}
              {/* <CircularSpinner size={14} color="inherit" sx={{ margin: "3px" }} /> */}
              {/* {isMobile ? null : <Skeleton sx={{ flexGrow: 1 }}></Skeleton>} */}
            </>
          ) : (
            <>
              <TimerSharp fontSize="small" sx={{ height: 16, width: 16 }} />
              {isMobile ? null : <span>{formatDuration(queryTime)}</span>}
            </>
          )}
        </Typography>
      </Tooltip>
    </>
  )
}

export const QueryTimer = memo(QueryTimerBase)
