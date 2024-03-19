import "./workers/remotes"

import { Paper, Stack } from "@mui/material"
import * as React from "react"
import * as ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import { AnalyticsProvider } from "./AnalyticsProvider"
import App from "./App"
import { MenuDrawerContents } from "./components/Header/MenuDrawerContents"
import { APP_VERSION, GIT_HASH } from "./env"
import { ConfirmDialogProvider } from "./hooks/useConfirm"
import { ThemeProvider } from "./ThemeProvider"

function toggleOpen() {
  // intentionally left blank
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter future={{ v7_startTransition: true }}>
    <ThemeProvider>
      <ConfirmDialogProvider>
        <Stack direction="row">
          <Paper
            sx={{
              display: { xl: "inline-flex", xs: "none" },
              height: "100vh",
              minWidth: 300,
            }}
            elevation={1}
          >
            <MenuDrawerContents
              open={true}
              toggleOpen={toggleOpen}
              appVer={APP_VERSION}
              gitHash={GIT_HASH}
            />
          </Paper>
          <App />
        </Stack>
        <AnalyticsProvider />
      </ConfirmDialogProvider>
    </ThemeProvider>
  </BrowserRouter>
)
