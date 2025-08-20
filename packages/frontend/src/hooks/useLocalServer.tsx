import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { LocalServerStatus, SystemInfo } from "src/interfaces"
import { $localConnectionStatus, $localConnectionStatusText } from "src/stores/account-store"
import { $localAuth } from "src/stores/auth-store"
import {
  $localAvailable,
  $localServerInfo,
  checkLocalServerInfo,
} from "src/stores/local-server-store"
import { localServerEnabled } from "src/utils/environment-utils"
import { logAndReportError } from "src/utils/error-utils"
import { $localRpc } from "src/workers/remotes"

export function useLocalServer() {
  const auth = useStore($localAuth)
  const rpc = useStore($localRpc)
  const serverInfo = useStore($localServerInfo)

  const serverStatus = useMemo<LocalServerStatus>(() => {
    if (auth.needsSetup) return "needs setup"
    if (auth.checked && !auth.needsSetup && !auth.isAuthenticated && !auth.errorMessage) {
      return "needs login"
    }
    return "running"
  }, [auth])

  useEffect(() => {
    const interval = setInterval(async () => {
      await checkLocalServerInfo()
    }, 5_000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const fetchSystemInfo = useCallback(async () => {
    if (!rpc) return
    try {
      const info = await rpc.getSystemInfo()
      setSystemInfo(info)
    } catch (error) {
      logAndReportError(error, "Failed to fetch system info")
    }
  }, [rpc])
  const connectionStatus = useStore($localConnectionStatus)
  const connectionStatusText = useStore($localConnectionStatusText)

  useEffect(() => {
    fetchSystemInfo()
  }, [fetchSystemInfo])

  useEffect(() => {
    checkLocalServerInfo()
  }, [])

  const loading = !auth.checked
  const localAvailable = useStore($localAvailable)

  return {
    auth,
    connectionStatus,
    connectionStatusText,
    loading,
    localAvailable,
    localServerEnabled,
    rpc,
    serverInfo,
    serverStatus,
    systemInfo,
  }
}
