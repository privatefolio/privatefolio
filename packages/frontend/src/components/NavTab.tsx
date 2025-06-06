import { Tab, TabProps } from "@mui/material"
import React from "react"
import { NavLink } from "react-router-dom"

export function NavTab(props: TabProps<typeof NavLink>) {
  return (
    <Tab
      component={NavLink}
      LinkComponent={NavLink}
      sx={{ textTransform: "none" }}
      replace
      {...props}
    />
  )
}
