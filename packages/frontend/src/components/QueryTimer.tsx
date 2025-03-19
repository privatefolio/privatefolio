import { TimerSharp } from "@mui/icons-material"
import { Stack, Tooltip, Typography, TypographyProps, useMediaQuery } from "@mui/material"
import React, { memo } from "react"

import { formatDuration } from "../utils/formatting-utils"

function QueryTimerBase({ queryTime, ...rest }: { queryTime: number | null } & TypographyProps) {
  const isMobile = useMediaQuery("(max-width: 599px)")

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
              <TimerSharp fontSize="small" sx={{ padding: 0.25 }} />
              {isMobile ? null : <span>{formatDuration(queryTime)}</span>}
            </>
          )}
        </Typography>
      </Tooltip>
    </>
  )
}

export const QueryTimer = memo(QueryTimerBase)
