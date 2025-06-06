import {
  KeyboardArrowLeftRounded,
  KeyboardArrowRightRounded,
  KeyboardDoubleArrowLeftRounded,
  KeyboardDoubleArrowRightRounded,
} from "@mui/icons-material"
import { inputBaseClasses, Stack, TextField, Tooltip, Typography } from "@mui/material"
import IconButton from "@mui/material/IconButton"
import * as React from "react"
import { MonoFont } from "src/theme"

import { Key, MAIN_KEY } from "./SearchBar/Key"

interface TablePaginationActionsProps {
  count: number
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, page: number) => void
  page: number
  rowsPerPage: number
}

export function TablePaginationActions(props: TablePaginationActionsProps) {
  const { count, page, rowsPerPage, onPageChange } = props

  const lastPage = Math.ceil(count / rowsPerPage) - 1

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0)
  }

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1)
  }

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1)
  }

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, lastPage))
  }

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "ArrowLeft") {
          if (page > 0) {
            onPageChange(event as any, page - 1)
          }
        } else if (event.key === "ArrowRight") {
          if (page < lastPage) {
            onPageChange(event as any, page + 1)
          }
        } else if (event.key === "ArrowDown") {
          if (page !== 0) {
            onPageChange(event as any, 0)
          }
        } else if (event.key === "ArrowUp") {
          if (page !== lastPage) {
            onPageChange(event as any, lastPage)
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [page, lastPage, onPageChange])

  return (
    <Stack sx={{ flexShrink: 0, ml: 2.5 }} direction="row" alignItems="center">
      <Tooltip
        title={
          <>
            Go to first page <Key variant="tooltip">{MAIN_KEY}</Key>
            <Key variant="tooltip">↓</Key>
          </>
        }
      >
        <span>
          <IconButton
            size="small"
            onClick={handleFirstPageButtonClick}
            disabled={page === 0}
            aria-label="Go to first page"
            color="secondary"
          >
            <KeyboardDoubleArrowLeftRounded />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={
          <>
            Go to previous page <Key variant="tooltip">{MAIN_KEY}</Key>
            <Key variant="tooltip">←</Key>
          </>
        }
      >
        <span>
          <IconButton
            size="small"
            onClick={handleBackButtonClick}
            disabled={page === 0}
            aria-label="Go to previous page"
            color="secondary"
          >
            <KeyboardArrowLeftRounded />
          </IconButton>
        </span>
      </Tooltip>
      <Stack gap={1} paddingX={1} direction="row" alignItems="center">
        <TextField
          size="small"
          variant="outlined"
          value={page + 1}
          sx={{
            width: 72,
            [`& .${inputBaseClasses.input}`]: {
              fontFamily: MonoFont,
              fontSize: "0.875rem",
              paddingY: 0.5,
              textAlign: "center",
            },
            [`& .${inputBaseClasses.root}`]: {
              background: "var(--mui-palette-background-default)",
              borderRadius: 2,
            },
          }}
          type="number"
          onChange={(event: any) => {
            onPageChange(event, Math.max(0, Math.min(event.target.value - 1, lastPage)))
          }}
        />
        <Typography variant="body2" color="text.secondary">
          of {lastPage + 1}
        </Typography>
      </Stack>
      <Tooltip
        title={
          <>
            Go to next page <Key variant="tooltip">{MAIN_KEY}</Key>
            <Key variant="tooltip">→</Key>
          </>
        }
      >
        <span>
          <IconButton
            size="small"
            onClick={handleNextButtonClick}
            disabled={page >= lastPage}
            aria-label="Go to next page"
            color="secondary"
          >
            <KeyboardArrowRightRounded />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={
          <>
            Go to last page <Key variant="tooltip">{MAIN_KEY}</Key>
            <Key variant="tooltip">↑</Key>
          </>
        }
      >
        <span>
          <IconButton
            size="small"
            onClick={handleLastPageButtonClick}
            disabled={page >= lastPage}
            aria-label="Go to last page"
            color="secondary"
          >
            <KeyboardDoubleArrowRightRounded />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}
