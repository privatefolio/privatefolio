import { ConstructionRounded } from "@mui/icons-material"
import { AlertTitle } from "@mui/material"
import React from "react"

import { AppLink } from "./AppLink"
import { Callout } from "./Callout"

export function WorkInProgressCallout() {
  return (
    <Callout icon={<ConstructionRounded fontSize="inherit" />}>
      <AlertTitle>This feature is still being developed.</AlertTitle>
      If you have any ideas on how we can improve it, please let us know on{" "}
      <AppLink href="https://github.com/privatefolio/privatefolio/issues/new">
        GitHub
      </AppLink> or <AppLink href="https://discord.gg/YHHu9nK8VD">Discord</AppLink>!
    </Callout>
  )
}
