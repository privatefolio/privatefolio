import { Box, Paper, Stack } from "@mui/material"
import Container from "@mui/material/Container"
import { a, useTransition } from "@react-spring/web"
import React, { useEffect } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"

import { AccountIndexRoute } from "./AccountIndexRoute"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Header } from "./components/Header/Header"
import { MenuDrawerContents } from "./components/Header/MenuDrawerContents"
import { APP_VERSION, GIT_HASH } from "./env"
import FourZeroFourPage from "./pages/404"
import AssetPage from "./pages/AssetPage/AssetPage"
import AssetsPage from "./pages/AssetsPage/AssetsPage"
import AuditLogsPage from "./pages/AuditLogsPage/AuditLogsPage"
import BalancesPage from "./pages/BalancesPage/BalancesPage"
import ImportDataPage from "./pages/ImportDataPage/ImportDataPage"
import LandingPage from "./pages/LandingPage/LandingPage"
import LandingPageHeader from "./pages/LandingPage/LandingPageHeader"
import { PnLPage } from "./pages/PnLPage/PnLPage"
import TransactionsPage from "./pages/TransactionsPage/TransactionsPage"
import { $pendingTask } from "./stores/task-store"
import { SPRING_CONFIGS } from "./utils/utils"

function toggleOpen() {
  // intentionally left blank
}

export default function App() {
  const location = useLocation()
  const { pathname } = location
  const appPath = pathname.split("/").slice(3).join("/")

  const transitions = useTransition(location, {
    config: SPRING_CONFIGS.veryQuick,
    enter: {
      // delay: 133,
      opacity: 2,
    },
    exitBeforeEnter: true,
    from: { opacity: 1 },
    keys: (location) => location.pathname,
    leave: { opacity: 1 },
  })

  useEffect(() => {
    const beforeUnloadHandler = (event) => {
      // Recommended
      event.preventDefault()
      // Included for legacy support, e.g. Chrome/Edge < 119
      event.returnValue = true
    }

    $pendingTask.listen((pendingTask) => {
      if (pendingTask) {
        window.addEventListener("beforeunload", beforeUnloadHandler)
      } else {
        window.removeEventListener("beforeunload", beforeUnloadHandler)
      }
    })
  }, [])

  return (
    <Stack direction="row">
      {pathname !== "/" ? (
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
      ) : null}

      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            "html[data-mui-color-scheme='dark'] &": {
              background: `radial-gradient(
              max(50vw, 400px) min(500px, 50vw) at 50% 0px,
              rgba(var(--mui-palette-accent-mainChannel) / 0.25), #fff0
            )`,
              height: "100%",
              left: 0,
              pointerEvents: "none",
              position: "absolute",
              right: 0,
              top: 0,
              width: "100%",
              zIndex: -1,
            },
          }}
        />
        {pathname !== "/" ? <Header /> : <LandingPageHeader />}
        <Container disableGutters maxWidth="xl" sx={{ paddingTop: 2, paddingX: { xs: 2 } }}>
          {transitions((styles, item, { key }) => (
            <a.div
              style={
                {
                  ...styles,
                  maxWidth: 1536 - 32,
                  paddingBottom: 24,
                  position: "absolute",
                  width: "calc(100% - 32px)",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
              }
            >
              <ErrorBoundary>
                <Routes location={item}>
                  <Route path="/u/:accountIndex" element={<AccountIndexRoute />}>
                    <Route
                      index
                      element={<BalancesPage show={key === pathname && appPath === ""} />}
                    />
                    <Route
                      path="pnl"
                      element={<PnLPage show={key === pathname && appPath === "pnl"} />}
                    />
                    <Route
                      path="asset/:assetId"
                      element={<AssetPage show={key === pathname && appPath.includes("asset")} />}
                    />
                    <Route
                      path="import-data"
                      element={
                        <ImportDataPage show={key === pathname && appPath === "import-data"} />
                      }
                    />
                    <Route
                      path="transactions"
                      element={
                        <TransactionsPage show={key === pathname && appPath === "transactions"} />
                      }
                    />
                    <Route
                      path="audit-logs"
                      element={
                        <AuditLogsPage show={key === pathname && appPath === "audit-logs"} />
                      }
                    />
                    <Route
                      path="assets"
                      element={<AssetsPage show={key === pathname && appPath === "assets"} />}
                    />
                    <Route path="*" element={<FourZeroFourPage show />} />
                  </Route>
                  <Route
                    path="/"
                    element={<LandingPage show={key === pathname && pathname === "/"} />}
                  />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </ErrorBoundary>
            </a.div>
          ))}
        </Container>
      </Box>
    </Stack>
  )
}
