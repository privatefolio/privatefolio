import { LinearProgress, LinearProgressProps } from "@mui/material"
import React, { memo, useEffect, useState } from "react"

type ProgressWithMemoryProps = LinearProgressProps & {
  lastQueryTime: number
  loading: boolean
}

function ProgressWithMemoryBase(props: ProgressWithMemoryProps) {
  const { sx, loading, lastQueryTime: queryTime, ...rest } = props

  const [queryCount, setQueryCount] = useState(0)
  const [value, setValue] = useState(0)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (loading) {
      setValue(5)
      setOpacity(1)
      setQueryCount((prev) => prev + 1)

      const interval = setInterval(() => {
        setValue((prev) => {
          if (prev < 90) {
            return prev + 10
          }
          return 100
        })
      }, queryTime / 10)

      return () => {
        clearInterval(interval)
        setTimeout(() => {
          setOpacity(0)
        }, 400)
      }
    }

    if (!loading) {
      setValue(100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <LinearProgress
      key={queryCount}
      variant="determinate"
      value={value}
      style={{
        transition: value === 100 ? "opacity .4s linear" : "none",
      }}
      sx={{
        "& span": {
          transition: "transform .2s linear",
        },
        opacity,
        ...sx,
      }}
      {...rest}
    />
  )
}

export const ProgressWithMemory = memo(ProgressWithMemoryBase)
