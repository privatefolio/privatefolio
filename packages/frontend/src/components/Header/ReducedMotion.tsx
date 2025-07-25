import {
  AnimationRounded,
  DisplaySettingsRounded,
  RadioButtonUncheckedRounded,
} from "@mui/icons-material"
import { Tab } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"

import { $reducedMotion } from "../../stores/app-store"
import { TabsAlt } from "../TabsAlt"

export function ReducedMotion() {
  const reducedMotion = useStore($reducedMotion)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    const newReducedMotion = newValue === 0 ? "always" : newValue === 1 ? "user" : "never"
    $reducedMotion.set(newReducedMotion)
    localStorage.setItem("privatefolio-reduced-motion", newReducedMotion)
  }

  return (
    <TabsAlt
      value={reducedMotion === "always" ? 0 : reducedMotion === "user" ? 1 : 2}
      onChange={handleTabChange}
      largeSize
    >
      <Tab label="Fewer" icon={<RadioButtonUncheckedRounded />} iconPosition="start" />
      <Tab label="System" icon={<DisplaySettingsRounded />} iconPosition="start" />
      <Tab label="More " icon={<AnimationRounded />} iconPosition="start" />
    </TabsAlt>
  )
}
