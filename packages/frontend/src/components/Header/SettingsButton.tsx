import { Settings } from "@mui/icons-material"
import { IconButton, Tooltip } from "@mui/material"
import React, { useEffect } from "react"
import { useBoolean } from "src/hooks/useBoolean"
import { isInputFocused } from "src/utils/browser-utils"

import { Key } from "../SearchBar/Key"
import { SettingsDrawer } from "./SettingsDrawer"

const SHORTCUT_KEY = "v"

export function SettingsButton(props: { size?: "small" | "medium" }) {
  const { value: openSettings, toggle: toggleSettingsOpen } = useBoolean(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInputFocused()) return
      if (event.ctrlKey || event.metaKey) return

      if (event.key.toLowerCase() === SHORTCUT_KEY) {
        toggleSettingsOpen()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [toggleSettingsOpen])

  return (
    <>
      <Tooltip
        title={
          <>
            Device Settings <Key variant="tooltip">{SHORTCUT_KEY}</Key>
          </>
        }
      >
        <IconButton
          onClick={toggleSettingsOpen}
          color="secondary"
          aria-label="Open Settings"
          size={props.size}
        >
          <Settings
            sx={{
              "button:hover &": {
                transform: "rotate(-30deg)",
              },
              transition: "transform 0.33s",
            }}
            fontSize={props.size === "small" ? "small" : "medium"}
          />
        </IconButton>
      </Tooltip>
      <SettingsDrawer open={openSettings} toggleOpen={toggleSettingsOpen} />
    </>
  )
}
