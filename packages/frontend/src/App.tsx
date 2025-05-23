import { Box, Paper, Stack } from "@mui/material"
import Container from "@mui/material/Container"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { useEffect } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { AccountIndexRoute } from "./AccountIndexRoute"
import { CircularSpinner } from "./components/CircularSpinner"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ConnectionBanner } from "./components/Header/ConnectionBanner"
import { Header } from "./components/Header/Header"
import { MenuDrawerContents } from "./components/Header/MenuDrawerContents"
import { APP_VERSION, GIT_HASH } from "./env"
import FourZeroFourPage from "./pages/404"
import AccountsPage from "./pages/AccountsPage/AccountsPage"
import LocalAuthPage from "./pages/AccountsPage/LocalAuthPage"
import AssetPage from "./pages/AssetPage/AssetPage"
import AssetsPage from "./pages/AssetsPage/AssetsPage"
import AuditLogsPage from "./pages/AuditLogsPage/AuditLogsPage"
import CloudUserPage from "./pages/CloudUserPage/CloudUserPage"
import HomePage from "./pages/HomePage/HomePage"
import ImportDataPage from "./pages/ImportDataPage/ImportDataPage"
import ServerPage from "./pages/ServerPage/ServerPage"
import TradesPage from "./pages/TradesPage/TradesPage"
import TransactionsPage from "./pages/TransactionsPage/TransactionsPage"
import { SHORT_THROTTLE_DURATION } from "./settings"
import {
  $activeAccount,
  $cloudAccounts,
  $cloudConnectionStatus,
  $cloudConnectionStatusText,
  $connectionStatus,
  $localAccounts,
  $localConnectionStatus,
  $localConnectionStatusText,
} from "./stores/account-store"
import { checkLatestAppVersion } from "./stores/app-store"
import { $auth, $cloudAuth, $localAuth, checkAuthentication } from "./stores/auth-store"
import {
  $cloudAvailable,
  $cloudRpcReady,
  $cloudUser,
  checkCloudInstance,
  checkCloudServerInfo,
  checkCloudUser,
  checkSubscription,
} from "./stores/cloud-user-store"
import { fetchInMemoryData } from "./stores/metadata-store"
import { closeSubscription } from "./utils/browser-utils"
import { localServerEnabled, noop } from "./utils/utils"
import { $cloudRest, $cloudRpc, $localRest, $localRpc, $rpc } from "./workers/remotes"

export default function App() {
  const localAuth = useStore($localAuth)
  const localConnectionStatus = useStore($localConnectionStatus)
  const localRest = useStore($localRest)
  const localRpc = useStore($localRpc)

  useEffect(() => {
    if (!localRest) return

    checkAuthentication($localAuth, localRest)
  }, [localRest])

  useEffect(() => {
    if (!localAuth.checked || localAuth.needsSetup || !localAuth.isAuthenticated || !localRpc) {
      return
    }

    localRpc.getAccountNames().then($localAccounts.set)

    const subscription = localRpc.subscribeToAccounts(() => {
      localRpc.getAccountNames().then($localAccounts.set)
    })

    return closeSubscription(subscription, localRpc)
  }, [localConnectionStatus, localAuth, localRpc])

  const cloudRpcReady = useStore($cloudRpcReady)
  const cloudConnectionStatus = useStore($cloudConnectionStatus)
  const cloudAvailable = useStore($cloudAvailable)
  const cloudRest = useStore($cloudRest)
  const cloudRpc = useStore($cloudRpc)

  useEffect(() => {
    if (!cloudRest) return

    checkAuthentication($cloudAuth, cloudRest)
  }, [cloudRest])

  useEffect(() => {
    if ((!cloudRpcReady || !cloudRpc) && $cloudAccounts.get() !== undefined) {
      $cloudAccounts.set(undefined)
    }
    if (!cloudRpcReady || !cloudRpc) return

    cloudRpc.getAccountNames().then($cloudAccounts.set)

    const subscription = cloudRpc.subscribeToAccounts(() => {
      cloudRpc.getAccountNames().then($cloudAccounts.set)
    })

    return closeSubscription(subscription, cloudRpc)
  }, [cloudConnectionStatus, cloudRpcReady, cloudRpc])

  useEffect(() => {
    checkCloudUser()
    checkLatestAppVersion()
  }, [])

  const cloudUser = useStore($cloudUser)

  useEffect(() => {
    if (!cloudUser) return

    setTimeout(async () => {
      await Promise.all([checkSubscription(), checkCloudInstance()])
      await checkCloudServerInfo()
    }, 0)
  }, [cloudUser])

  const activeAccount = useStore($activeAccount)
  const connectionStatus = useStore($connectionStatus)
  const auth = useStore($auth)
  const rpc = useStore($rpc)

  useEffect(() => {
    if (!activeAccount || !auth.checked || auth.needsSetup || !auth.isAuthenticated || !rpc) {
      return
    }

    fetchInMemoryData()

    const subscription = rpc.subscribeToAssetMetadata(
      activeAccount,
      throttle(fetchInMemoryData, SHORT_THROTTLE_DURATION, {
        leading: false,
        trailing: true,
      })
    )

    return closeSubscription(subscription, rpc)
  }, [activeAccount, connectionStatus, auth, rpc])

  if (localServerEnabled && !localAuth.checked) {
    return (
      <Box
        sx={{ alignItems: "center", display: "flex", height: "100vh", justifyContent: "center" }}
      >
        <CircularSpinner />
      </Box>
    )
  }

  if (localServerEnabled && (!localAuth.isAuthenticated || localAuth.needsSetup)) {
    return <LocalAuthPage />
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
              <Route path="/privatecloud" element={<CloudUserPage show />} />
              <Route path="/u/:accountIndex" element={<AccountIndexRoute />}>
                <Route index element={<HomePage />} />
                <Route path="assets" element={<AssetsPage show />} />
                <Route path="trades" element={<TradesPage show />} />
                <Route path="asset/:assetId" element={<AssetPage />} />
                <Route path="transactions" element={<TransactionsPage show />} />
                <Route path="audit-logs" element={<AuditLogsPage show />} />
                <Route path="import-data" element={<ImportDataPage show />} />
                <Route path="server" element={<ServerPage show />} />
                <Route path="*" element={<FourZeroFourPage show />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
          <Stack
            sx={{
              bottom: 0,
              left: 0,
              position: "fixed",
              width: "100%",
              zIndex: "var(--mui-zIndex-tooltip)",
            }}
          >
            {localServerEnabled && (
              <ConnectionBanner
                key="local"
                statusAtom={$localConnectionStatus}
                statusTextAtom={$localConnectionStatusText}
                prefix="Local connection"
              />
            )}
            {cloudAvailable && (
              <ConnectionBanner
                key="cloud"
                statusAtom={$cloudConnectionStatus}
                statusTextAtom={$cloudConnectionStatusText}
                prefix="Cloud connection"
              />
            )}
          </Stack>
        </Container>
      </Box>
    </Stack>
  )
}
