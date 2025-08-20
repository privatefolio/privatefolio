import { useStore } from "@nanostores/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { getPortalLink } from "src/api/privatecloud-api"
import { APP_VERSION } from "src/env"
import { ONE_HOUR_CACHE } from "src/settings"
import { $cloudConnectionStatus, $cloudConnectionStatusText } from "src/stores/account-store"
import { getLatestAppVersion } from "src/stores/app-store"
import { $cloudAuth } from "src/stores/auth-store"
import {
  $cloudAvailable,
  $cloudInstance,
  $cloudPortalLink,
  $cloudServerInfo,
  $cloudServerMutating,
  $cloudSubscription,
  $cloudUser,
  checkCloudInstance,
  checkCloudServerInfo,
  checkCloudUser,
  checkSubscription,
} from "src/stores/cloud-server-store"
import { cloudEnabled } from "src/utils/environment-utils"

export function useCloudServer() {
  const cloudUser = useStore($cloudUser)
  const subscription = useStore($cloudSubscription)
  const cloudInstance = useStore($cloudInstance)
  const serverMutating = useStore($cloudServerMutating)
  const serverInfo = useStore($cloudServerInfo)
  const auth = useStore($cloudAuth)

  const { data: latestVersion = APP_VERSION } = useQuery({
    queryFn: getLatestAppVersion,
    queryKey: ["latest-app-version"],
    ...ONE_HOUR_CACHE,
  })

  const serverStatus = useMemo(() => {
    if (auth.needsSetup) return "needs setup"
    if (auth.checked && !auth.needsSetup && !auth.isAuthenticated && !auth.errorMessage) {
      return "needs login"
    }
    if (serverMutating) return "pending"
    if (cloudInstance === undefined) return
    return cloudInstance?.status || "unknown"
  }, [auth, cloudInstance, serverMutating])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!$cloudUser.get()) return
      await Promise.all([checkSubscription(), checkCloudInstance()])
      await checkCloudServerInfo()
    }, 5_000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const portalLink = useStore($cloudPortalLink)

  useEffect(() => {
    if (cloudUser) {
      getPortalLink()
        .then((link) => {
          $cloudPortalLink.set(link.url)
        })
        .catch(() => {
          // console.warn("Error fetching portal link:", error)
          $cloudPortalLink.set(null)
        })
    }
  }, [cloudUser])

  const paymentPlan = useMemo<{
    cancelAt?: Date
    isPremium: boolean
    loading?: boolean
    name: string
    priceText?: string
    renewal?: Date
  }>(() => {
    if (subscription === undefined) {
      return { isPremium: false, loading: true, name: "Loading…" }
    }
    if (subscription === null) {
      return { isPremium: false, name: "Free" }
    }

    const item = subscription.items.data[0]
    if (!item) {
      return { isPremium: false, name: "Free" }
    }

    const { plan } = item
    const amount = plan.amount / 100
    const currency = plan.currency.toUpperCase().replace("USD", "$")
    const interval = plan.interval

    const name = plan.nickname || "Premium"

    const renewal = new Date(subscription.billing_cycle_anchor * 1000)
    renewal.setMonth(new Date(renewal).getMonth() + plan.interval_count)

    return {
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : undefined,
      isPremium: true,
      name,
      priceText: `${currency}${amount.toFixed(2)} per ${interval}`,
      renewal,
    }
  }, [subscription])

  const cloudAvailable = useStore($cloudAvailable)
  const connectionStatus = useStore($cloudConnectionStatus)
  const connectionStatusText = useStore($cloudConnectionStatusText)

  useEffect(() => {
    checkCloudUser()
  }, [])

  useEffect(() => {
    if (!cloudUser) return

    setTimeout(async () => {
      await Promise.all([checkSubscription(), checkCloudInstance()])
      await checkCloudServerInfo()
    }, 0)
  }, [cloudUser])

  const serverChanging =
    serverStatus === "pending" ||
    serverStatus === "creating" ||
    serverStatus === "restarting" ||
    serverMutating

  const serverLoading = cloudInstance === undefined
  const connectionLoading = connectionStatus === undefined
  const loading = !!cloudUser && (serverLoading || serverChanging || connectionLoading)

  return {
    auth,
    cloudAvailable,
    cloudEnabled,
    cloudInstance,
    cloudUser,
    connectionLoading,
    connectionStatus,
    connectionStatusText,
    latestVersion,
    loading,
    paymentPlan,
    portalLink,
    serverChanging,
    serverInfo,
    serverLoading,
    serverMutating,
    serverStatus,
    subscription,
  }
}
