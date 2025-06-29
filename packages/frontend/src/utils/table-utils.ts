import type { SxProps, Theme } from "@mui/material"
import type { ReactNode } from "react"

export type Order = "asc" | "desc"

export type BaseType = {
  id: string | number
}

export type ActiveFilterMap<T extends BaseType> = Partial<Record<keyof T, string | number>>

export type ValueSelector<T> = (row: T) => string | number | undefined

export interface HeadCell<T extends BaseType> {
  filterable?: boolean
  hidden?: boolean
  key?: keyof T
  label?: ReactNode
  numeric?: boolean
  sortable?: boolean
  sx?: SxProps<Theme>
  timestamp?: boolean
  valueSelector?: ValueSelector<T>
}

export type TableRowComponentProps<T extends BaseType> = {
  headCells: HeadCell<T>[]
  isMobile: boolean
  isTablet: boolean
  relativeTime: boolean
  row: T
}
