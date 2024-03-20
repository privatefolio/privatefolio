import "./workers/remotes"

import * as React from "react"
import * as ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import { AnalyticsProvider } from "./AnalyticsProvider"
import App from "./App"
import { ConfirmDialogProvider } from "./hooks/useConfirm"
import { ThemeProvider } from "./ThemeProvider"

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter future={{ v7_startTransition: true }}>
    <ThemeProvider>
      <ConfirmDialogProvider>
        <App />
        <AnalyticsProvider />
      </ConfirmDialogProvider>
    </ThemeProvider>
  </BrowserRouter>
)
