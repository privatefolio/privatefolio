import { CssVarsThemeOptions, Fade } from "@mui/material"
import { blue, grey } from "@mui/material/colors"

export const MainFont = "'Roboto Flex', sans-serif"
export const SerifFont = "'Roboto Serif', serif"
export const MonoFont = "'IBM Plex Mono', monospace"

export const bgColor = "rgb(242, 242, 245)"

// const cutCorners =
//   "polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)"

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    accent: true
  }
}

declare module "@mui/material/IconButton" {
  interface IconButtonPropsColorOverrides {
    accent: true
  }
}

declare module "@mui/material/Badge" {
  interface BadgePropsColorOverrides {
    accent: true
  }
}

declare module "@mui/material/TableCell" {
  interface TableCellPropsVariantOverrides {
    clickable: true
  }
}

declare module "@mui/material" {
  interface TypeBackground {
    paperTransparent: string
  }
  interface Palette {
    accent: Palette["primary"]
  }

  interface PaletteOptions {
    accent?: PaletteOptions["primary"]
  }
}

declare module "@mui/material/Paper" {
  interface PaperOwnProps {
    /**
     * @default "on"
     */
    transparent?: string
  }
}
declare module "@mui/material/LinearProgress" {
  interface LinearProgressPropsColorOverrides {
    accent: true
  }
}

export const theme: CssVarsThemeOptions = {
  colorSchemes: {
    dark: {
      palette: {
        Avatar: {
          defaultBg: grey[800],
        },
        Skeleton: {
          bg: "rgb(50, 50, 50)",
        },
        TableCell: {
          border: "rgba(255,255,255, 0.05)",
        },
        accent: {
          // main: "rgb(136, 101, 160)",
          dark: blue[800],
          light: blue[400],
          main: blue[600],
        },
        background: {
          default: "rgb(40, 40, 40)",
          paper: "rgb(43 43 43)",
          paperTransparent: "rgba(45, 45, 45, 0.33)", // derived from default + paper
        },
        info: {
          main: blue[400],
        },
        primary: {
          main: "rgb(240,240,240)",
        },
        secondary: {
          main: "rgb(160, 160, 160)",
        },
        text: {
          secondary: "rgba(255, 255, 255, 0.55)",
        },
      },
    },
    light: {
      palette: {
        Skeleton: {
          bg: "rgb(225, 225, 230)",
        },
        TableCell: {
          border: "rgba(0,0,0, 0.05)",
        },
        accent: {
          // main: "rgb(136, 101, 160)",
          dark: blue[800],
          light: blue[400],
          main: blue[600],
        },
        background: {
          default: bgColor,
          paper: "rgba(255, 255, 255, 1)",
          paperTransparent: "rgba(255, 255, 255, 1)",
          // paper: "rgb(246 246 248)", // derived from default + paper
          // paperTransparent: "rgba(255, 255, 255, 0.33)",
        },
        info: {
          main: blue[600],
        },
        primary: {
          main: "rgb(80, 80, 80)",
        },
        secondary: {
          main: "rgb(120, 120, 120)",
        },
        text: {
          secondary: "rgba(0, 0, 0, 0.66)",
        },
      },
    },
  },
  // transitions: {
  //   easing: {
  //     // sharp: "cubic-bezier(1.000, 0.000, 0.000, 1.000)",
  //   },
  // },
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))": {
            "&:not(.MuiBackdrop-invisible)": {
              backdropFilter: "blur(1px)",
              // backgroundColor: "transparent",
              // backgroundColor: "var(--mui-palette-background-default)",
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        // textSecondary: {
        //   "&:hover": {
        //     color: "var(--mui-palette-primary-main)",
        //   },
        // },
        contained: {
          "&:hover": {
            boxShadow: "unset",
          },
          boxShadow: "unset",
        },
        root: {
          "&.MuiButton-textSecondary:hover, &.MuiButton-outlinedSecondary:hover": {
            color: "var(--mui-palette-primary-main)",
          },
          borderRadius: "32px",
          textTransform: "none",
        },
        sizeSmall: {
          lineHeight: 1.2,
          minWidth: "unset",
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true, // No more ripple, on the whole application 💣!
      },
      styleOverrides: {
        root: {
          "&:active:not(.MuiMenuItem-root):not(.MuiListItemButton-root)": {
            transform: "translateY(1px)",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          "& svg": {
            height: 16,
            width: 16,
          },
          padding: "6px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
        },
        sizeMedium: {
          fontSize: "0.875rem",
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        PaperProps: {
          elevation: 4,
          transparent: "on",
        },
      },
      styleOverrides: {
        container: {
          transition: "none !important",
        },
        root: {
          marginBottom: 48,
          // marginBottom: "56px !important",
        },
      },
    },
    MuiDrawer: {
      defaultProps: {
        PaperProps: {
          elevation: 2,
          transparent: "on",
        },
        anchor: "right",
        disableScrollLock: true,
        slotProps: { backdrop: { invisible: true } },
      },
      styleOverrides: {
        paperAnchorLeft: {
          borderBottom: "none",
          borderBottomRightRadius: 16,
          borderLeft: "none",
          borderTop: "none",
          borderTopRightRadius: 16,
          left: 0,
        },
        paperAnchorRight: {
          borderBottom: "none",
          borderBottomLeftRadius: 16,
          borderRight: "none",
          borderTop: "none",
          borderTopLeftRadius: 16,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&.MuiIconButton-colorSecondary:hover": {
            color: "var(--mui-palette-primary-main)",
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        bar: {
          borderRadius: 2,
        },
        root: {
          borderRadius: 2,
        },
      },
    },
    MuiList: {
      defaultProps: {
        disablePadding: true,
      },
    },
    MuiMenu: {
      defaultProps: {
        PaperProps: {
          elevation: 1,
        },
      },
      styleOverrides: {
        root: {
          maxHeight: "50vh",
        },
      },
    },
    MuiMenuItem: {
      defaultProps: {
        color: "secondary",
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
        transparent: "on",
      },
      styleOverrides: {
        root: {
          "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))": {
            backdropFilter: "blur(12px)",
          },
          border: "1px solid var(--mui-palette-divider)",
          boxShadow: "unset",
        },
      },
      variants: [
        {
          props: { transparent: "on" },
          style: {
            backgroundColor: "var(--mui-palette-background-paperTransparent)",
            "html[data-mui-color-scheme='dark'] &": {
              backgroundColor: "var(--mui-palette-background-paperTransparent)",
            },
          },
        },
      ],
    },
    MuiPopover: {
      defaultProps: {
        TransitionComponent: Fade,
        disableScrollLock: true,
        slotProps: {
          paper: {
            elevation: 1,
            transparent: "on",
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          PaperProps: {
            elevation: 1,
            transparent: "on",
          },
        },
      },
    },
    MuiSkeleton: {
      defaultProps: {
        animation: "wave",
      },
    },
    MuiSwipeableDrawer: {
      defaultProps: {
        elevation: 2,
      },
    },
    MuiSwitch: {
      defaultProps: {
        focusVisibleClassName: ".Mui-focusVisible",
      },
      styleOverrides: {
        // TODO this needs work
        root: ({ theme }) => ({
          "& .MuiSwitch-switchBase": {
            "&.Mui-checked": {
              "& + .MuiSwitch-track": {
                // backgroundColor: theme.palette.mode === "dark" ? "#2ECA45" : "#65C466",
                border: 0,
                opacity: 1,
              },
              "&.Mui-disabled + .MuiSwitch-track": {
                opacity: 0.5,
              },
              color: "#fff",
              transform: "translateX(16px)",
            },
            "&.Mui-disabled + .MuiSwitch-track": {
              opacity: theme.palette.mode === "light" ? 0.7 : 0.3,
            },
            "&.Mui-disabled .MuiSwitch-thumb": {
              color:
                theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[600],
            },
            "&.Mui-focusVisible .MuiSwitch-thumb": {
              border: "6px solid #fff",
              color: theme.palette.accent.main,
            },
            margin: 2,
            padding: 0,
            transitionDuration: "300ms",
          },
          "& .MuiSwitch-thumb": {
            boxSizing: "border-box",
            height: 22,
            width: 22,
          },
          "& .MuiSwitch-track": {
            background: "var(--mui-palette-background-default)",
            borderRadius: 26 / 2,
            opacity: 1,
            transition: theme.transitions.create(["background-color"]),
          },
          height: 26,
          padding: 0,
          width: 42,
        }),
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          // https://stackoverflow.com/questions/33318207/max-width-not-working-for-table-cell
          tableLayout: "fixed",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          padding: "4px 16px 6px 16px",
        },
        root: {
          "tbody tr:last-of-type &": {
            borderBottom: "none",
          },
        },
        stickyHeader: {
          "&:first-of-type": {
            borderTopLeftRadius: 8,
          },
          "&:last-of-type": {
            borderTopRightRadius: 8,
          },
          background: "var(--mui-palette-background-paper)",
        },
      },
      variants: [
        {
          props: { variant: "clickable" },
          style: {
            "& > *": {
              display: "block",
              padding: "6px 16px",
            },
            "&:hover": {
              outline: "1px dashed rgba(var(--mui-palette-secondary-mainChannel) / 0.5)",
              outlineOffset: -1,
            },
            "html[data-mui-color-scheme='dark'] &:hover": {
              outline: "1px dashed rgba(var(--mui-palette-primary-mainChannel) / 0.33)",
            },
            padding: 0,
          },
        },
      ],
    },
    MuiTablePagination: {
      styleOverrides: {
        displayedRows: {
          margin: 0,
        },
        root: {
          overflow: "unset",
        },
        toolbar: {
          minHeight: "38px !important",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        head: {
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        },
        root: {
          "&.MuiTableRow-hover:hover": {
            background: "rgba(var(--mui-palette-secondary-mainChannel) / 0.075) !important",
          },
          "html[data-mui-color-scheme='dark'] &.MuiTableRow-hover:hover": {
            background: "rgba(var(--mui-palette-primary-mainChannel) / 0.05) !important",
          },
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        PopperProps: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 16],
              },
            },
          ],
        },
        TransitionProps: { timeout: 0 },
        arrow: true,
        disableInteractive: true,
        enterDelay: 0,
        followCursor: true,
      },
      styleOverrides: {
        arrow: {
          color: "var(--mui-palette-grey-900)",
          "html[data-mui-color-scheme='dark'] &": {
            color: "var(--mui-palette-grey-200)",
          },
        },
        tooltip: {
          "& .secondary": {
            color: "var(--mui-palette-grey-400)",
          },
          background: "var(--mui-palette-grey-900)",
          border: "1px solid var(--mui-palette-background-default)",
          borderRadius: 0,
          fontSize: "0.8rem",
          fontWeight: 300,
          "html[data-mui-color-scheme='dark'] &": {
            background: "var(--mui-palette-grey-200)",
            color: "var(--mui-palette-common-black)",
          },
          "html[data-mui-color-scheme='dark'] & .secondary": {
            color: "var(--mui-palette-grey-600)",
          },
          maxWidth: 340,
          paddingBottom: 8,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        body1: {
          lineHeight: 1.25,
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    body1: {
      fontWeight: 300,
    },
    body2: {
      fontWeight: 300,
    },
    caption: {
      fontWeight: 300,
      letterSpacing: "0.05rem",
    },
    fontFamily: MainFont,
  },
}
