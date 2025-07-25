import "./workers/remotes"

import { CloseRounded } from "@mui/icons-material"
import { IconButton } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { KBarProvider } from "kbar"
import { closeSnackbar, SnackbarProvider } from "notistack"
import * as React from "react"
import { lazy } from "react"
import * as ReactDOM from "react-dom/client"
import { BrowserRouter, HashRouter } from "react-router-dom"

import { AnalyticsProvider } from "./AnalyticsProvider"
import App from "./App"
import { FileDownloadSnackbar } from "./components/FileDownloadSnackbar"
import { ConfirmDialogProvider } from "./hooks/useConfirm"
import { ServiceWorkerProvider } from "./ServiceWorkerProvider"
import { ONE_DAY_CACHE } from "./settings"
import { ThemeProvider } from "./ThemeProvider"
import { isElectron } from "./utils/electron-utils"
import { ONE_DAY } from "./utils/formatting-utils"

const Router = isElectron ? HashRouter : BrowserRouter

const queryClient = new QueryClient({
  defaultOptions: {
    queries: ONE_DAY_CACHE,
  },
})

const maxAge = ONE_DAY
const persister = createAsyncStoragePersister({
  key: "privatefolio-cache",
  storage: window.localStorage,
  // throttleTime: 1_000,
})

// eslint-disable-next-line unused-imports/no-unused-vars
const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((x) => ({
    default: x.ReactQueryDevtools,
  }))
)

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ServiceWorkerProvider>
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ maxAge, persister }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ThemeProvider>
            <ConfirmDialogProvider>
              <KBarProvider
                options={{
                  disableDocumentLock: true,
                  // enableHistory: true, does not do what I expected it to do
                  toggleShortcut: "/",
                }}
              >
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
        {/* {isDevelopment && <ReactQueryDevtools />} */}
      </PersistQueryClientProvider>
    </Router>
  </ServiceWorkerProvider>
)
