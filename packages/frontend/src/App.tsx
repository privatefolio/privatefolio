import { Box, CircularProgress, Paper, Stack } from "@mui/material"
import Container from "@mui/material/Container"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useEffect } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { AccountIndexRoute } from "./AccountIndexRoute"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Header } from "./components/Header/Header"
import { InfoBanner } from "./components/Header/InfoBanner"
import { MenuDrawerContents } from "./components/Header/MenuDrawerContents"
import { APP_VERSION, GIT_HASH } from "./env"
import FourZeroFourPage from "./pages/404"
import AccountsPage from "./pages/AccountsPage/AccountsPage"
import AssetPage from "./pages/AssetPage/AssetPage"
import AssetsPage from "./pages/AssetsPage/AssetsPage"
import AuditLogsPage from "./pages/AuditLogsPage/AuditLogsPage"
import AuthPage from "./pages/AuthPage"
import HomePage from "./pages/HomePage/HomePage"
import ImportDataPage from "./pages/ImportDataPage/ImportDataPage"
import ServerPage from "./pages/ServerPage/ServerPage"
import SettingsPage from "./pages/SettingsPage/SettingsPage"
import TradesPage from "./pages/TradesPage/TradesPage"
import TransactionsPage from "./pages/TransactionsPage/TransactionsPage"
import { SHORT_THROTTLE_DURATION } from "./settings"
import {
  $accounts,
  $activeAccount,
  $connectionErrorMessage,
  $connectionStatus,
} from "./stores/account-store"
import { $auth, checkAuthentication } from "./stores/auth-store"
import { checkLogin as checkCloudLogin } from "./stores/cloud-account-store"
import { $infoBanner } from "./stores/info-banner-store"
import { fetchInMemoryData } from "./stores/metadata-store"
import { closeSubscription } from "./utils/browser-utils"
import { noop, sleep } from "./utils/utils"
import { $localRpc, $rpc } from "./workers/remotes"

export default function App() {
  const connectionStatus = useStore($connectionStatus)
  const connectionErrorMessage = useStore($connectionErrorMessage)

  const { checked: authChecked, needsSetup, isAuthenticated } = useStore($auth)

  useEffect(() => {
    $infoBanner.set(connectionErrorMessage ?? null)
  }, [connectionErrorMessage])

  useEffect(() => {
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (!authChecked || needsSetup || !isAuthenticated) return

    Promise.all([$localRpc.get().getAccountNames(), sleep(0)]).then(([accounts]) => {
      $accounts.set(accounts)
    })

    const subscription = $localRpc.get().subscribeToAccounts(() => {
      $localRpc.get().getAccountNames().then($accounts.set)
    })

    return closeSubscription(subscription)
  }, [connectionStatus, authChecked, needsSetup, isAuthenticated])

  useEffect(() => {
    checkCloudLogin()
  }, [])

  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    if (!activeAccount || !authChecked || needsSetup || !isAuthenticated) return

    fetchInMemoryData()

    const subscription = $rpc.get().subscribeToAssetMetadata(
      activeAccount,
      throttle(fetchInMemoryData, SHORT_THROTTLE_DURATION, {
        leading: false,
        trailing: true,
      })
    )

    return closeSubscription(subscription)
  }, [activeAccount, connectionStatus, authChecked, needsSetup, isAuthenticated])

  if (!authChecked) {
    return (
      <Box
        sx={{ alignItems: "center", display: "flex", height: "100vh", justifyContent: "center" }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated || needsSetup) {
    return <AuthPage />
  }

  return (
    <Stack direction="row">
      {activeAccount && (
        <>
          <Box
            sx={{
              // TODO2 make this smaller
              "@media (min-width: 1836px)": {
                display: "inline-flex",
              },
              display: "none",
              minWidth: 300,
              width: 300,
            }}
          />
          <Paper
            sx={{
              // xl + width
              "@media (min-width: 1836px)": {
                display: "inline-flex",
              },
              borderBottom: 0,
              borderLeft: 0,
              borderRadius: 0,
              borderTop: 0,
              bottom: 0,
              display: "none",
              // height: "100%-25", // Notice bar
              height: "100%",
              minWidth: 300,
              position: "fixed",
              // top: 25, // Notice bar
            }}
            elevation={0}
          >
            <MenuDrawerContents
              open={true}
              toggleOpen={noop}
              appVer={APP_VERSION}
              gitHash={GIT_HASH}
            />
          </Paper>
        </>
      )}
      <Box sx={{ flexBasis: "100%", width: "100%" }}>
        {/* TODO0 */}
        {/* <Box
          sx={{
            background: `radial-gradient(
              150vh 150vh at calc(50% + 200px) -40vh,
              rgba(250,220,255,0.1), rgba(250,220,255,0.33), #fff0
            )`,
            height: "100%",
            "html[data-mui-color-scheme='dark'] &": {
              background: `radial-gradient(
                150vh 150vh at calc(50% + 200px) -40vh,
                rgba(250,220,255,0.1), rgba(250,220,255,0.01), #fff0
              )`,
            },
            left: 0,
            pointerEvents: "none",
            position: "absolute",
            right: 0,
            top: 0,
            width: "100%",
            zIndex: -1,
          }}
        /> */}
        <Header />
        <Container disableGutters maxWidth="xl" sx={{ paddingTop: 2, paddingX: { xs: 2 } }}>
          <ErrorBoundary>
            <Routes>
              <Route index element={<AccountsPage />} />
              <Route path="/u/:accountIndex" element={<AccountIndexRoute />}>
                <Route index element={<HomePage />} />
                <Route path="assets" element={<AssetsPage show />} />
                <Route path="trades" element={<TradesPage show />} />
                <Route path="asset/:assetId" element={<AssetPage />} />
                <Route path="transactions" element={<TransactionsPage show />} />
                <Route path="audit-logs" element={<AuditLogsPage show />} />
                <Route path="import-data" element={<ImportDataPage show />} />
                <Route path="server" element={<ServerPage show />} />
                <Route path="settings" element={<SettingsPage show />} />
                <Route path="*" element={<FourZeroFourPage show />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
          <InfoBanner />
        </Container>
      </Box>
    </Stack>
  )
}
