import { ConstructionRounded } from "@mui/icons-material"
import { AlertTitle, Link } from "@mui/material"
import React from "react"

import { Callout } from "./Callout"

export function WorkInProgressCallout() {
  return (
    <Callout icon={<ConstructionRounded fontSize="inherit" />}>
      <AlertTitle>This feature is still being developed.</AlertTitle>
      If you have any ideas on how we can improve it, please let us know on{" "}
      <Link target="_blank" href="https://github.com/privatefolio/privatefolio/issues/new">
        GitHub
      </Link>{" "}
      or{" "}
      <Link target="_blank" href="https://discord.gg/YHHu9nK8VD">
        Discord
      </Link>
      !
    </Callout>
  )
}
