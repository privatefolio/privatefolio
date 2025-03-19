import { Stack, StackProps } from "@mui/material"
import { animated, AnimationConfig, useTrail } from "@react-spring/web"
import React, { Children } from "react"

import { SPRING_CONFIGS } from "../utils/utils"

export type StaggeredListProps = StackProps & {
  config?: Partial<AnimationConfig>
  delay?: number
  secondary?: boolean
  show?: boolean
  tertiary?: boolean
}

const SHOW_STATE = { opacity: 1 }
const HIDE_STATE = { opacity: 1 }
const INIT_STATE = { opacity: 1 }

const SEC_SHOW_STATE = { opacity: 1, y: 0 }
const SEC_HIDE_STATE = { opacity: 0, y: 60 }
const SEC_INIT_STATE = { opacity: 0, y: 60 }

const TER_SHOW_STATE = { opacity: 1, y: 0 }
const TER_HIDE_STATE = { opacity: 0, y: 15 }
const TER_INIT_STATE = { opacity: 0, y: 15 }

export function StaggeredList(props: StaggeredListProps) {
  const {
    children,
    show = true,
    config,
    secondary = false,
    tertiary = false,
    delay,
    ...rest
  } = props
  const hideState = tertiary ? TER_HIDE_STATE : secondary ? SEC_HIDE_STATE : HIDE_STATE
  const showState = tertiary ? TER_SHOW_STATE : secondary ? SEC_SHOW_STATE : SHOW_STATE
  const initState = tertiary ? TER_INIT_STATE : secondary ? SEC_INIT_STATE : INIT_STATE

  const items = Children.toArray(children)
  const trails = useTrail(items.length, {
    config: config || (show ? SPRING_CONFIGS.quicker : SPRING_CONFIGS.veryQuick),
    delay,
    from: show ? initState : hideState,
    reverse: !show,
    to: show ? showState : hideState,
  })

  return (
    <Stack {...rest}>
      {trails.map((props, index) => (
        <animated.div key={index} style={props}>
          {items[index]}
        </animated.div>
      ))}
    </Stack>
  )
}
