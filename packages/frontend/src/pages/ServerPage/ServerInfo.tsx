import { useStore } from "@nanostores/react"
import { formatFileSize } from "privatefolio-backend/src/utils/formatting-utils"
import React, { useCallback, useEffect, useState } from "react"
import { InfoCard, InfoCardRow, InfoCards } from "src/components/InfoCard"
import { SystemInfo } from "src/interfaces"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { logAndReportError } from "src/utils/error-utils"

import { formatNumber } from "../../utils/formatting-utils"
import { $rpc } from "../../workers/remotes"

export function ServerInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const connectionStatus = useStore($connectionStatus)

  useEffect(() => {
    document.title = `Server info - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const fetchSystemInfo = useCallback(async () => {
    try {
      const info = await rpc.getSystemInfo()
      setSystemInfo(info)
    } catch (error) {
      logAndReportError(error, "Failed to fetch system info")
    }
  }, [rpc])

  useEffect(() => {
    fetchSystemInfo()
  }, [fetchSystemInfo])

  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === "connected") {
        fetchSystemInfo()
      }
    }, 1_000)

    return () => clearInterval(interval)
  }, [connectionStatus, fetchSystemInfo])

  return (
    <InfoCards>
      <InfoCard>
        <InfoCardRow title="CPU model" value={systemInfo === null ? null : systemInfo.cpuModel} />
        <InfoCardRow
          title="CPU threads"
          value={systemInfo === null ? null : formatNumber(systemInfo.cpuCores)}
        />
        <InfoCardRow
          title="Memory"
          value={systemInfo === null ? null : formatFileSize(systemInfo.memory)}
        />
        <InfoCardRow title="Platform" value={systemInfo === null ? null : systemInfo.platform} />
        <InfoCardRow
          title="Node version"
          value={systemInfo === null ? null : systemInfo.nodeVersion}
        />
        <InfoCardRow
          title="Privatefolio version"
          value={systemInfo === null ? null : systemInfo.version}
        />
      </InfoCard>
    </InfoCards>
  )
}
