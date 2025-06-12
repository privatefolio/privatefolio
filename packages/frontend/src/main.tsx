import "./workers/remotes"

import { CloseRounded } from "@mui/icons-material"
import { IconButton } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { KBarProvider } from "kbar"
import { closeSnackbar, SnackbarProvider } from "notistack"
import * as React from "react"
import * as ReactDOM from "react-dom/client"
import { BrowserRouter, HashRouter } from "react-router-dom"

import { AnalyticsProvider } from "./AnalyticsProvider"
import App from "./App"
import { FileDownloadSnackbar } from "./components/FileDownloadSnackbar"
import { ConfirmDialogProvider } from "./hooks/useConfirm"
import { ThemeProvider } from "./ThemeProvider"
import { isElectron } from "./utils/electron-utils"

const Router = isElectron ? HashRouter : BrowserRouter

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider>
        <ConfirmDialogProvider>
          {/* <NoticeBoard /> */}
          <KBarProvider options={{ disableDocumentLock: true, toggleShortcut: "/" }}>
            <SnackbarProvider
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              maxSnack={3}
              // transitionDuration={{ enter: 225, exit: 195 }}
              Components={{
                fileDownload: FileDownloadSnackbar,
              }}
              action={(snackbarId) => (
                <IconButton onClick={() => closeSnackbar(snackbarId)} size="small">
                  <CloseRounded fontSize="small" />
                </IconButton>
              )}
            >
              <App />
            </SnackbarProvider>
          </KBarProvider>
          <AnalyticsProvider />
        </ConfirmDialogProvider>
      </ThemeProvider>
    </LocalizationProvider>
  </Router>
)
