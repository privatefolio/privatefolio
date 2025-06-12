// https://github.com/timc1/kbar/blob/main/src/KBarSearch.tsx

import { Search } from "@mui/icons-material"
import { InputAdornment, inputBaseClasses, TextField } from "@mui/material"
import { useKBar, VisualState } from "kbar"
import * as React from "react"

import { CircularSpinner } from "../CircularSpinner"

export const KBAR_LISTBOX = "kbar-listbox"
export const getListboxItemId = (id: number) => `kbar-listbox-item-${id}`

type SearchInputProps = {
  defaultPlaceholder?: string
  loading?: boolean
}

export function SearchInput(props: SearchInputProps) {
  const { query, search, actions, currentRootActionId, activeIndex, showing, options } = useKBar(
    (state) => ({
      actions: state.actions,
      activeIndex: state.activeIndex,
      currentRootActionId: state.currentRootActionId,
      search: state.searchQuery,
      showing: state.visualState === VisualState.showing,
    })
  )

  const [inputValue, setInputValue] = React.useState(search)
  React.useEffect(() => {
    query.setSearch(inputValue)
  }, [inputValue, query])

  const { defaultPlaceholder, loading } = props

  React.useEffect(() => {
    query.setSearch("")
    query.getInput().focus()
    return () => query.setSearch("")
  }, [currentRootActionId, query])

  const placeholder = React.useMemo((): string => {
    const defaultText = defaultPlaceholder ?? "Type a command or search…"
    return currentRootActionId && actions[currentRootActionId]
      ? actions[currentRootActionId].name
      : defaultText
  }, [actions, currentRootActionId, defaultPlaceholder])

  return (
    <>
      <TextField
        size="small"
        sx={{
          [`& .${inputBaseClasses.input}`]: {
            fontWeight: 200,
            paddingY: 0.5,
          },
          [`& .${inputBaseClasses.root}`]: {
            // backgroundColor: "var(--mui-palette-background-paperTransparent)",
            // borderRadius: 0,
          },
          [`& .${inputBaseClasses.root} fieldset`]: {
            border: "none",
          },
          minWidth: 520,
          width: "100%",
        }}
        ref={query.inputRefSetter}
        autoFocus
        autoComplete="off"
        role="combobox"
        spellCheck="false"
        aria-expanded={showing}
        aria-controls={KBAR_LISTBOX}
        aria-activedescendant={getListboxItemId(activeIndex)}
        value={inputValue}
        placeholder={placeholder}
        onChange={(event) => {
          // props.onChange?.(event)
          setInputValue(event.target.value)
          options?.callbacks?.onQueryChange?.(event.target.value)
        }}
        onKeyDown={(event) => {
          // props.onKeyDown?.(event)
          if (currentRootActionId && !search && event.key === "Backspace") {
            const parent = actions[currentRootActionId].parent
            query.setCurrentRootAction(parent)
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ height: 24, width: 30 }}>
              {loading ? (
                <CircularSpinner size={16} sx={{ marginLeft: 0.5 }} />
              ) : (
                <Search color="secondary" />
              )}
            </InputAdornment>
          ),
        }}
      />
    </>
  )
}
