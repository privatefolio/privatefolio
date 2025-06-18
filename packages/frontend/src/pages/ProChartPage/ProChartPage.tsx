"use client"
import { Box, Paper, Stack } from "@mui/material"
import { animated, useSpring } from "@react-spring/web"
import React, { useEffect, useState } from "react"
import { CircularSpinner } from "src/components/CircularSpinner"
import ProChart from "src/components/ProChart/ProChart"
import { SPRING_CONFIGS } from "src/utils/utils"

const AnimatedPaper = animated(Paper)

export function ProChartPage({ show: _show }: { show: boolean }) {
  const [open, setOpen] = useState(false)
  const [screenHeight, setScreenHeight] = useState(0)

  useEffect(() => {
    setScreenHeight(window.innerHeight)

    const handleResize = () => {
      setScreenHeight(window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const { x } = useSpring({
    config: SPRING_CONFIGS.quick,
    from: { x: 0 },
    to: !open ? { x: 0 } : { x: screenHeight },
  })

  useEffect(() => {
    setTimeout(() => {
      setOpen(true)
    }, 1_000)
  }, [])

  return (
    <Stack
      style={{
        height: "calc(100vh - 72px)",
        maxHeight: "800px",
        minHeight: "360px",
        position: "relative",
        width: "100%",
      }}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      {!open && (
        <Box sx={{ position: "absolute" }}>
          <CircularSpinner />
        </Box>
      )}
      <AnimatedPaper
        elevation={0}
        sx={{
          border: 0,
          height: "100%",
          width: "100%",
        }}
        style={{
          clipPath: x.to((value) => `circle(${value}px at 50% 50%)`),
        }}
      >
        <ProChart />
      </AnimatedPaper>
    </Stack>
  )
}
