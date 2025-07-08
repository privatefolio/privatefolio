import { ExpandMoreRounded } from "@mui/icons-material"
import { alpha, colors, CssVarsThemeOptions, Fade } from "@mui/material"
import { blue, grey } from "@mui/material/colors"

import { isElectron } from "./utils/electron-utils"

export const MainFont = "'IBM Plex Sans', sans-serif"
export const SerifFont = "'Roboto Serif', serif"
export const MonoFont = "'IBM Plex Mono', monospace"

export const bgColor = "rgb(242, 243, 245)"
export const appBarHeight = 52

export const chipBgOpacity = 0.075

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

declare module "@mui/material/CircularProgress" {
  interface CircularProgressPropsColorOverrides {
    accent: true
  }
}

declare module "@mui/material/TableCell" {
  interface TableCellPropsVariantOverrides {
    actionList: true
    clickable: true
  }
}

declare module "@mui/material" {
  interface TypeBackground {
    paperTransparent: string
  }
  interface Palette {
    accent: Palette["primary"]
    color: {
      blue: string
      cyan: string
      green: string
      indigo: string
      lime: string
      orange: string
      pink: string
      purple: string
      red: string
      yellow: string
    }
  }

  interface PaletteOptions {
    accent: PaletteOptions["primary"]
    color: {
      blue: string
      cyan: string
      green: string
      indigo: string
      lime: string
      orange: string
      pink: string
      purple: string
      red: string
      yellow: string
      // amber,
      // blueGrey,
      // lightBlue,
      // lightGreen,
      // brown,
      // deepOrange,
      // deepPurple,
      // lightBlue,
      // teal,
    }
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
declare module "@mui/system/createTheme" {
  interface BreakpointOverrides {
    xxl: true
  }
}

export const theme: CssVarsThemeOptions = {
  breakpoints: {
    values: {
      lg: 1200,
      md: 900,
      sm: 600,
      xl: 1600,
      xs: 0,
      xxl: 2200,
    },
  },
  colorSchemes: {
    dark: {
      overlays: [
        undefined,
        "linear-gradient(rgba(255 255 255 / 0.05), rgba(255 255 255 / 0.05))",
        "linear-gradient(rgba(255 255 255 / 0.07), rgba(255 255 255 / 0.07))",
        "linear-gradient(rgba(255 255 255 / 0.08), rgba(255 255 255 / 0.08))",
        undefined, // "linear-gradient(rgba(255 255 255 / 0.09), rgba(255 255 255 / 0.09))",
        "linear-gradient(rgba(255 255 255 / 0.10), rgba(255 255 255 / 0.10))",
        "linear-gradient(rgba(255 255 255 / 0.11), rgba(255 255 255 / 0.11))",
        "linear-gradient(rgba(255 255 255 / 0.11), rgba(255 255 255 / 0.11))",
        "linear-gradient(rgba(255 255 255 / 0.12), rgba(255 255 255 / 0.12))",
        "linear-gradient(rgba(255 255 255 / 0.12), rgba(255 255 255 / 0.12))",
        "linear-gradient(rgba(255 255 255 / 0.13), rgba(255 255 255 / 0.13))",
        "linear-gradient(rgba(255 255 255 / 0.13), rgba(255 255 255 / 0.13))",
        "linear-gradient(rgba(255 255 255 / 0.14), rgba(255 255 255 / 0.14))",
        "linear-gradient(rgba(255 255 255 / 0.14), rgba(255 255 255 / 0.14))",
        "linear-gradient(rgba(255 255 255 / 0.14), rgba(255 255 255 / 0.14))",
        "linear-gradient(rgba(255 255 255 / 0.14), rgba(255 255 255 / 0.14))",
        "linear-gradient(rgba(255 255 255 / 0.15), rgba(255 255 255 / 0.15))",
        "linear-gradient(rgba(255 255 255 / 0.15), rgba(255 255 255 / 0.15))",
        "linear-gradient(rgba(255 255 255 / 0.15), rgba(255 255 255 / 0.15))",
        "linear-gradient(rgba(255 255 255 / 0.15), rgba(255 255 255 / 0.15))",
        "linear-gradient(rgba(255 255 255 / 0.16), rgba(255 255 255 / 0.16))",
        "linear-gradient(rgba(255 255 255 / 0.16), rgba(255 255 255 / 0.16))",
        "linear-gradient(rgba(255 255 255 / 0.16), rgba(255 255 255 / 0.16))",
        "linear-gradient(rgba(255 255 255 / 0.16), rgba(255 255 255 / 0.16))",
        "linear-gradient(rgba(255 255 255 / 0.16), rgba(255 255 255 / 0.16))",
      ],
      palette: {
        Avatar: {
          defaultBg: grey[800],
        },
        Skeleton: {
          bg: "rgb(50, 50, 50, 0.66)",
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
          default: "rgb(30, 30, 30)",
          paper: "rgb(40, 40, 40)",
          paperTransparent: "rgba(60, 60, 60, 0.33)", // derived from default + paper
        },
        color: {
          blue: colors.blue[500],
          cyan: colors.cyan[300],
          green: colors.green[600],
          indigo: colors.indigo[300],
          lime: colors.lime[800],
          orange: colors.orange[500],
          pink: colors.pink[300],
          purple: colors.purple[400],
          red: colors.red[400],
          yellow: colors.yellow[600],
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
      overlays: [
        undefined,
        // Toggle these for elevation 1 though 3
        // "linear-gradient(rgba(255 255 255 / 0.05), rgba(255 255 255 / 0.05))",
        // "linear-gradient(rgba(255 255 255 / 0.07), rgba(255 255 255 / 0.07))",
        // "linear-gradient(rgba(255 255 255 / 0.08), rgba(255 255 255 / 0.08))",
        undefined,
        undefined,
        undefined,
        "linear-gradient(rgba(255 255 255 / 1), rgba(255 255 255 / 1))",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      ],
      palette: {
        Skeleton: {
          bg: "rgb(225, 225, 230, 0.33)",
        },
        TableCell: {
          border: "rgba(0,0,0, 0.05)",
        },
        accent: {
          // main: "rgb(136, 101, 160)",
          dark: blue[800], // #1565c0
          light: blue[400], // #42a5f5
          main: blue[600], // #1e88e5
        },
        background: {
          default: bgColor,
          paper: "rgb(253, 253, 253)",
          paperTransparent: "rgba(255, 255, 255, 0.55)",
        },
        color: {
          blue: colors.blue[700],
          cyan: colors.cyan[700],
          green: colors.green[800],
          indigo: colors.indigo[900],
          lime: colors.lime[900],
          orange: colors.orange[900],
          pink: colors.pink[800],
          purple: colors.purple[500],
          red: colors.red[600],
          yellow: colors.yellow[800],
        },
        // divider: "rgba(0,0,0,0.15)",
        info: {
          main: blue[600],
        },
        primary: {
          main: "rgb(30, 30, 30)",
        },
        secondary: {
          main: "rgb(120, 120, 120)",
        },
        text: {
          secondary: "rgba(0, 0, 0, 0.6)",
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
    MuiAlert: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiAlertTitle: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        slotProps: {
          paper: {
            elevation: 1,
            sx: {
              marginTop: "3px",
            },
            transparent: "on",
          },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))": {
            "&:not(.MuiBackdrop-invisible)": {
              backdropFilter: "blur(1px)",
              opacity: "0.75 !important",
              // backgroundColor: "transparent",
              // backgroundColor: "var(--mui-palette-background-default)",
            },
          },
          WebkitAppRegion: "no-drag",
          // "html[data-mui-color-scheme='light'] &": {
          //   background: "rgba(255, 255, 255, 0.33)",
          // },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        // outlined: {
        //   borderColor: "var(--mui-palette-divider) !important",
        // },
        // textSecondary: {
        //   "&:hover": {
        //     color: "var(--mui-palette-primary-main)",
        //   },
        // },
        root: {
          "&.MuiButton-textSecondary:hover, &.MuiButton-outlinedSecondary:hover": {
            color: "var(--mui-palette-primary-main)",
          },
          borderRadius: "32px",
          boxShadow: "unset !important",
          textTransform: "none",
          transition: "none !important",
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
          "&.Mui-focusVisible": {
            background: "var(--mui-palette-action-hover)",
            // outline: "1px dashed rgba(var(--mui-palette-primary-mainChannel) / 0.5)",
            // outlineOffset: 0,
          },
          "&:active:not(.MuiMenuItem-root):not(.MuiListItemButton-root)": {
            transform: "translateY(1px)",
          },
          "&:not(.MuiChip-root) *": { pointerEvents: "none" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--mui-palette-background-paper) !important",
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          justifyContent: "flex-end",
          padding: "0px 16px 16px 16px",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "20px 24px",
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: "16px 24px 0px 24px",
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
          background: alpha(grey[500], chipBgOpacity),
          borderRadius: "2px",
          boxShadow: "none !important",
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
        fullScreen: true,
        maxWidth: "sm",
      },
      styleOverrides: {
        container: {
          alignItems: "flex-start",
          transition: "none !important",
        },
        paper: {
          "&.MuiDialog-paperFullScreen": {
            border: 0,
            margin: 0,
            maxWidth: "100%",
            top: isElectron ? appBarHeight : 0,
            width: "100%",
          },
          "&:not(.MuiDialog-paperFullScreen)": {
            marginTop: 80,
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "0px 16px 16px 16px",
        },
      },
    },
    MuiDrawer: {
      defaultProps: {
        PaperProps: {
          elevation: 4,
          transparent: "on",
        },
        anchor: "right",
      },
      styleOverrides: {
        paper: {
          borderRadius: "0px !important",
        },
        paperAnchorBottom: {
          borderBottom: "none",
          borderLeft: "none",
          borderRight: "none",
        },
        paperAnchorLeft: {
          borderBottom: "none",
          borderLeft: "none",
          borderTop: "none",
          left: 0,
          // borderTopRightRadius: 16,
          // borderBottomRightRadius: 16,
        },
        paperAnchorRight: {
          borderBottom: "none",
          borderRight: "none",
          borderTop: isElectron ? undefined : "none",
          // borderBottomLeftRadius: 16,
          borderTopLeftRadius: isElectron ? "16px !important" : 0,
          top: isElectron ? appBarHeight : 0,
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
      styleOverrides: {
        root: {
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          margin: "4px",
        },
      },
    },
    MuiListItem: {
      defaultProps: {
        disablePadding: true,
      },
    },
    MuiListItemAvatar: {
      styleOverrides: {
        root: {
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          marginRight: "16px",
          minWidth: 0,
        },
      },
    },
    MuiListItemButton: {
      defaultProps: {
        component: "button", // why is this needed?
      },
      styleOverrides: {
        root: {
          // Same as MuiMenuItem
          "&:hover, &.Mui-selected": {
            background: "var(--mui-palette-action-hover)",
            color: "var(--mui-palette-text-primary)",
          },
          borderRadius: "4px",
          color: "var(--mui-palette-text-secondary)",
        },
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
      styleOverrides: {
        root: {
          // Same as MuiListItemButton
          "& *": { pointerEvents: "none" }, // TODO document this
          "&:hover, &.Mui-selected": {
            background: "var(--mui-palette-action-hover)",
            color: "var(--mui-palette-text-primary)",
          },
          borderRadius: "4px",
          color: "var(--mui-palette-text-secondary)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderWidth: "1px !important",
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
        transparent: "on",
      },
      styleOverrides: {
        elevation1: {
          "html[data-mui-color-scheme='dark'] &": {
            boxShadow: "0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 3px 0px rgba(0,0,0,0.12)",
          },
          "html[data-mui-color-scheme='light'] &": {
            boxShadow: "0px 2px 0px -1px rgba(0,0,0,0.2)",
          },
        },
        elevation4: {
          "html[data-mui-color-scheme='light'] &": {
            boxShadow: "0px 2px 0px -1px rgba(0,0,0,0.2)",
          },
        },
        root: {
          border: "1px solid var(--mui-palette-divider)",
        },
      },
      variants: [
        {
          props: { transparent: "on" },
          style: {
            "&:not(.MuiPaper-elevation0)": {
              backgroundColor: "var(--mui-palette-background-paperTransparent)",
            },
            "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))": {
              backdropFilter: "blur(12px)",
            },
          },
        },
      ],
    },
    MuiPopover: {
      defaultProps: {
        TransitionComponent: Fade,
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
        IconComponent: ExpandMoreRounded,
        MenuProps: {
          PaperProps: {
            elevation: 1,
            transparent: "on",
          },
          sx: {
            marginTop: 0.25,
          },
        },
      },
      styleOverrides: {
        root: {
          "& .MuiSvgIcon-root": {
            fontSize: "1.25rem",
          },
          "&.MuiInputBase-colorSecondary fieldset": {
            borderColor: "rgba(var(--mui-palette-secondary-mainChannel) / 0.5)",
          },
          "&.MuiInputBase-colorSecondary:active fieldset": {
            background:
              "rgba(var(--mui-palette-secondary-mainChannel) / var(--mui-palette-action-hoverOpacity))",
            borderColor: "var(--mui-palette-secondary-main)",
          },
          "&.MuiInputBase-colorSecondary:hover fieldset": {
            background:
              "rgba(var(--mui-palette-secondary-mainChannel) / var(--mui-palette-action-hoverOpacity))",
            borderColor: "var(--mui-palette-secondary-main)",
          },
          "&.MuiInputBase-colorSecondary:not(:hover) *": {
            color: "var(--mui-palette-secondary-main)",
          },
          "&:active:not(.MuiMenuItem-root):not(.MuiListItemButton-root)": {
            transform: "translateY(1px)",
          },
        },
        select: {
          paddingBottom: 6,
          paddingTop: 6,
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
        elevation: 4,
      },
    },
    MuiSwitch: {
      defaultProps: {
        focusVisibleClassName: ".Mui-focusVisible",
      },
      styleOverrides: {
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
          "&.MuiSwitch-sizeSmall": {
            "& .MuiSwitch-switchBase": {
              "&.Mui-checked": {
                // transform: translateX(width_root - width_thumb - 2 * margin_switchBase)
                // transform: translateX(30 - 16 - 2*1) = translateX(12px)
                transform: "translateX(12px)",
              },
              "&.Mui-focusVisible .MuiSwitch-thumb": {
                border: "3px solid #fff",
              },
              margin: 2,
              padding: 0,
            },
            "& .MuiSwitch-thumb": {
              height: 14,
              width: 14,
            },
            "& .MuiSwitch-track": {
              borderRadius: 18 / 2,
            },
            height: 18,
            width: 30,
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
            borderTopLeftRadius: "var(--priv-border-radius)",
          },
          "&:last-of-type": {
            borderTopRightRadius: "var(--priv-border-radius)",
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
            cursor: "pointer",
            "html[data-mui-color-scheme='dark'] &:hover": {
              outline: "1px dashed rgba(var(--mui-palette-primary-mainChannel) / 0.33)",
            },
            padding: 0,
          },
        },
        {
          props: { variant: "actionList" },
          style: {
            ".MuiTableRow-root & .MuiIconButton-root": {
              marginBottom: -4,
              marginTop: -4,
              visibility: "hidden",
            },
            ".MuiTableRow-root:hover & .MuiIconButton-root": {
              visibility: "visible",
            },
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
          borderTopLeftRadius: "var(--priv-border-radius)",
          borderTopRightRadius: "var(--priv-border-radius)",
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
    MuiToolbar: {
      styleOverrides: {
        root: {
          height: `${appBarHeight}px !important`,
          minHeight: `${appBarHeight}px !important`,
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        // PopperProps: {
        //   modifiers: [
        //     {
        //       name: "offset",
        //       options: {
        //         offset: [0, 16],
        //       },
        //     },
        //   ],
        // },
        TransitionComponent: Fade,
        TransitionProps: { timeout: 0 },
        arrow: true,
        disableInteractive: true,
        enterDelay: 200,
        followCursor: false,
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
          borderRadius: 4,
          fontSize: "0.8rem",
          fontWeight: 400,
          "html[data-mui-color-scheme='dark'] &": {
            background: "var(--mui-palette-grey-200)",
            color: "var(--mui-palette-common-black)",
          },
          "html[data-mui-color-scheme='dark'] & .secondary": {
            color: "var(--mui-palette-grey-600)",
          },
          maxWidth: 364,
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
        caption: {
          lineHeight: 1.5,
        },
        h5: {
          lineHeight: 1.25,
        },
        h6: {
          fontSize: "1.125rem",
        },
      },
    },
  },
  // shadows: [
  //   "none",
  //   "0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)",
  //   "0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)",
  //   "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)",
  //   "0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)",
  //   "0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)",
  //   "0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)",
  //   "0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)",
  //   "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
  //   "0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)",
  //   "0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)",
  //   "0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)",
  //   "0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)",
  //   "0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)",
  //   "0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)",
  //   "0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)",
  //   "0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)",
  //   "0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)",
  //   "0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)",
  //   "0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)",
  //   "0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)",
  //   "0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)",
  //   "0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)",
  //   "0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)",
  //   "0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)",
  // ],
  shape: {
    borderRadius: 8, // Change in index.css too
  },
  typography: {
    caption: {
      letterSpacing: "0.05rem",
    },
    fontFamily: MainFont,
  },
  zIndex: {},
}
