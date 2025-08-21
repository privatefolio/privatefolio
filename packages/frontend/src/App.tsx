import { Box, Stack } from "@mui/material"
import Container from "@mui/material/Container"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import React, { lazy, Suspense, useEffect } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { AccountRouteGuard } from "./AccountRouteGuard"
import { DefaultSpinner } from "./components/DefaultSpinner"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Header } from "./components/Header/Header"
import { MenuDrawerContents } from "./components/Header/MenuDrawerContents"
import { APP_VERSION, GIT_HASH } from "./env"
import FourZeroFourPage from "./pages/404"
import AccountsPage from "./pages/AccountsPage/AccountsPage"
import CloudUserPage from "./pages/CloudServerPage/CloudServerPage"
import HomePage from "./pages/HomePage/HomePage"
import LocalServerPage from "./pages/LocalServerPage/LocalServerPage"
import { INPUT_DEBOUNCE_DURATION, SHORT_THROTTLE_DURATION } from "./settings"
import {
  $activeAccount,
  $cloudAccounts,
  $cloudConnectionStatus,
  $connectionStatus,
  $localAccounts,
  $localConnectionStatus,
} from "./stores/account-store"
import { $auth, $cloudAuth, $localAuth, checkAuthentication } from "./stores/auth-store"
import { $cloudRpcReady } from "./stores/cloud-server-store"
import { fetchInMemoryData } from "./stores/metadata-store"
import { closeSubscription } from "./utils/browser-utils"
import { setIfChanged } from "./utils/store-utils"
import { noop } from "./utils/utils"
import { $cloudRest, $cloudRpc, $localRest, $localRpc, $rpc } from "./workers/remotes"

const AssetPage = lazy(() => import("./pages/AssetPage/AssetPage"))
const AssetsPage = lazy(() => import("./pages/AssetsPage/AssetsPage"))
const AssistantPage = lazy(() => import("./pages/AssistantPage/AssistantPage"))
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage/AuditLogsPage"))
const ExtensionPage = lazy(() => import("./pages/ExtensionPage/ExtensionPage"))
const ExtensionsPage = lazy(() => import("./pages/ExtensionsPage/ExtensionsPage"))
const ImportDataPage = lazy(() => import("./pages/ImportDataPage/ImportDataPage"))
const PlatformPage = lazy(() => import("./pages/PlatformPage/PlatformPage"))
const PlatformsPage = lazy(() => import("./pages/PlatformsPage/PlatformsPage"))
const ProChartPage = lazy(() => import("./pages/ProChartPage/ProChartPage"))
const ServerPage = lazy(() => import("./pages/ServerPage/ServerPage"))
const TradePage = lazy(() => import("./pages/TradePage/TradePage"))
const TradesPage = lazy(() => import("./pages/TradesPage/TradesPage"))
const TransactionsPage = lazy(() => import("./pages/TransactionsPage/TransactionsPage"))
const SettingsPage = lazy(() => import("./pages/SettingsPage/SettingsPage"))

export default function App() {
  /**
   * Local RPC
   */
  const localAuth = useStore($localAuth)
  const localConnectionStatus = useStore($localConnectionStatus)
  const localRest = useStore($localRest)
  const localRpc = useStore($localRpc)

  useEffect(() => {
    if (!localRest) return
    checkAuthentication($localAuth, localRest)
  }, [localRest])

  useEffect(() => {
    const apiNotReady =
      !localAuth.checked || localAuth.needsSetup || !localAuth.isAuthenticated || !localRpc
    if (apiNotReady) setIfChanged($localAccounts, undefined)
    if (apiNotReady) return

    localRpc.getAccountNames().then((x) => setIfChanged($localAccounts, x))

    const subscription = localRpc.subscribeToAccounts(() => {
      setTimeout(() => {
        localRpc.getAccountNames().then((x) => setIfChanged($localAccounts, x))
      }, INPUT_DEBOUNCE_DURATION)
    })

    return closeSubscription(subscription, localRpc)
  }, [localConnectionStatus, localAuth, localRpc])

  /**
   * Cloud RPC
   */
  const cloudRpcReady = useStore($cloudRpcReady)
  const cloudConnectionStatus = useStore($cloudConnectionStatus)
  const cloudRest = useStore($cloudRest)
  const cloudRpc = useStore($cloudRpc)

  useEffect(() => {
    if (!cloudRest) return
    checkAuthentication($cloudAuth, cloudRest)
  }, [cloudRest])

  useEffect(() => {
    const apiReady = cloudRpcReady && cloudRpc
    if (!apiReady) setIfChanged($cloudAccounts, undefined)
    if (!apiReady) return

    cloudRpc.getAccountNames().then((x) => setIfChanged($cloudAccounts, x))

    const subscription = cloudRpc.subscribeToAccounts(() => {
      setTimeout(() => {
        cloudRpc.getAccountNames().then((x) => setIfChanged($cloudAccounts, x))
      }, INPUT_DEBOUNCE_DURATION)
    })

    return closeSubscription(subscription, cloudRpc)
  }, [cloudConnectionStatus, cloudRpcReady, cloudRpc])

  /**
   * Selected account
   */
  const activeAccount = useStore($activeAccount)
  const connectionStatus = useStore($connectionStatus)
  const auth = useStore($auth)
  const rpc = useStore($rpc)

  useEffect(() => {
    if (!activeAccount || !auth.checked || auth.needsSetup || !auth.isAuthenticated || !rpc) {
      return
    }

    fetchInMemoryData(rpc, activeAccount)

    const subscription = rpc.subscribeToMetadata(
      activeAccount,
      throttle(() => fetchInMemoryData(rpc, activeAccount), SHORT_THROTTLE_DURATION, {
        leading: true,
        trailing: true,
      })
    )

    return closeSubscription(subscription, rpc)
  }, [activeAccount, connectionStatus, auth, rpc])

  return (
    <Stack direction="row">
      {activeAccount !== "" && (
        <>
          <Box
            sx={(theme) => ({
              [theme.breakpoints.up("md")]: {
                display: "inline-flex",
              },
              [theme.breakpoints.between("md", "xl")]: {
                minWidth: 96,
                width: 96,
              },
              display: "none",
              minWidth: 300,
              width: 300,
            })}
          />
          <Box
            className="nav-drawer"
            sx={(theme) => ({
              [theme.breakpoints.up("xl")]: {
                backgroundColor: "var(--mui-palette-background-paper)",
                borderRight: "1px solid var(--mui-palette-divider)",
                maxWidth: 300,
                minWidth: 300,
              },
              [theme.breakpoints.up("md")]: {
                backgroundColor: "var(--mui-palette-background-default)",
                display: "inline-flex",
              },
              borderBottom: 0,
              borderLeft: 0,
              borderRadius: 0,
              borderTop: 0,
              bottom: 0,
              display: "none",
              height: "100%",
              maxWidth: 96,
              minWidth: 96,
              position: "fixed",
              zIndex: "calc(var(--mui-zIndex-appBar) + 1)",
            })}
          >
            <MenuDrawerContents open toggleOpen={noop} appVer={APP_VERSION} gitHash={GIT_HASH} />
          </Box>
        </>
      )}
      <Box
        sx={(theme) =>
          activeAccount !== ""
            ? {
                [theme.breakpoints.between("md", "xl")]: {
                  flexBasis: "calc(100% - 96px)",
                  width: "calc(100% - 96px)",
                },
                [theme.breakpoints.up("xl")]: {
                  flexBasis: "calc(100% - 300px)",
                  width: "calc(100% - 300px)",
                },
                flexBasis: "100%",
                width: "100%",
              }
            : {
                flexBasis: "100%",
                width: "100%",
              }
        }
      >
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
        <Container disableGutters maxWidth="xl" sx={{ paddingX: { xs: 2 }, paddingY: 2 }}>
          <ErrorBoundary>
            <Suspense fallback={<DefaultSpinner wrapper />}>
              <Routes>
                <Route index element={<AccountsPage />} />
                <Route path="/local" element={<LocalServerPage show />} />
                <Route path="/cloud" element={<CloudUserPage show />} />
                <Route path="/:accountType/:accountIndex" element={<AccountRouteGuard />}>
                  <Route index element={<HomePage />} />
                  <Route path="trades" element={<TradesPage show />} />
                  <Route path="trade/:tradeId" element={<TradePage />} />
                  <Route path="assets" element={<AssetsPage show />} />
                  <Route path="asset/:assetId" element={<AssetPage />} />
                  <Route path="transactions" element={<TransactionsPage show />} />
                  <Route path="audit-logs" element={<AuditLogsPage show />} />
                  <Route path="import-data" element={<ImportDataPage show />} />
                  <Route path="assistant" element={<AssistantPage show />} />
                  <Route path="server" element={<ServerPage show />} />
                  <Route path="settings" element={<SettingsPage show />} />
                  <Route path="extensions" element={<ExtensionsPage show />} />
                  <Route path="extension/:extensionId" element={<ExtensionPage />} />
                  <Route path="platforms" element={<PlatformsPage show />} />
                  <Route path="platform/:platformId" element={<PlatformPage />} />
                  <Route path="pro-chart" element={<ProChartPage show />} />
                  <Route path="*" element={<FourZeroFourPage show />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Container>
      </Box>
    </Stack>
  )
}
