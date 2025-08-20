import {
  BugReport,
  Cancel,
  DesktopWindows,
  DeviceUnknown,
  NotificationsOutlined,
  PhoneAndroid,
  TabletMac,
} from "@mui/icons-material"
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Tooltip,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import React, { useCallback, useEffect, useState } from "react"
import { type Notification, PushDevice, PushSub } from "src/interfaces"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { $serviceWorker, getDeviceId } from "src/stores/notifications-store"
import { formatUserAgent } from "src/utils/browser-utils"
import { logAndReportError } from "src/utils/error-utils"
import { $rpc } from "src/workers/remotes"

import { CaptionText } from "../CaptionText"
import { DefaultSpinner } from "../DefaultSpinner"
import { LearnMore } from "../LearnMore"
import { LoadingButton } from "../LoadingButton"
import { SectionTitle } from "../SectionTitle"

export function NotificationsSettings() {
  const accountName = useStore($activeAccount)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)
  const deviceId = getDeviceId()

  const [pushDevices, setPushDevices] = useState<PushDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [isEnablingPush, setIsEnablingPush] = useState(false)

  useEffect(() => {
    if (accountName && rpc) {
      setIsLoading(true)
      rpc
        .getPushDevices(accountName)
        .then(setPushDevices)
        .catch((error) => {
          logAndReportError(error, "Failed to fetch push devices")
        })
        .finally(() => setIsLoading(false))
    }
  }, [accountName, rpc, connectionStatus])

  const handleSendTestNotification = useCallback(async () => {
    if (!accountName || !rpc) return

    setIsSendingTest(true)
    try {
      await rpc.createAndPushNotification(
        accountName,
        "Test Notification",
        "This is a test notification from Privatefolio"
      )
      enqueueSnackbar("Test notification sent", { variant: "success" })
    } catch (error) {
      logAndReportError(error, "Failed to send test notification")
      enqueueSnackbar("Failed to send test notification", { variant: "error" })
    } finally {
      setIsSendingTest(false)
    }
  }, [accountName, rpc])

  const handleEnablePush = useCallback(async () => {
    if (!accountName || !rpc) return

    setIsEnablingPush(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        throw new Error("Notification permission denied")
      }

      const vapidPublicKey = await rpc.getVapidPublicKey()
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not available")
      }

      const serviceWorker = $serviceWorker.get()
      if (!serviceWorker) {
        throw new Error("Service worker not available")
      }

      const subscription = await serviceWorker.pushManager.subscribe({
        applicationServerKey: vapidPublicKey,
        userVisibleOnly: true,
      })

      await rpc.addPushDevice(
        accountName,
        subscription.toJSON() as PushSub,
        deviceId,
        navigator.userAgent
      )

      await rpc.getPushDevices(accountName).then(setPushDevices)
      enqueueSnackbar("Push notifications enabled", { variant: "success" })
    } catch (error) {
      logAndReportError(error, "Failed to enable push notifications")
      const errorMessage =
        error instanceof Error ? error.message : "Failed to enable push notifications"
      enqueueSnackbar(`Error: ${errorMessage}`, { variant: "error" })
    } finally {
      setIsEnablingPush(false)
    }
  }, [accountName, rpc, deviceId])

  const handleRemoveDevice = useCallback(
    async (endpoint: string) => {
      if (!accountName || !rpc) return

      try {
        await rpc.removePushDevice(accountName, endpoint)
        setPushDevices((prev) => prev.filter((device) => device.subscription.endpoint !== endpoint))
        enqueueSnackbar("Push notifications disabled for device", { variant: "success" })
      } catch (error) {
        logAndReportError(error, "Failed to remove device")
        enqueueSnackbar("Failed to remove device", { variant: "error" })
      }
    },
    [accountName, rpc]
  )

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <DeviceUnknown />

    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile") || ua.includes("android")) {
      return <PhoneAndroid />
    }
    if (ua.includes("ipad") || ua.includes("tablet")) {
      return <TabletMac />
    }
    return <DesktopWindows />
  }

  const currentDeviceConnected = pushDevices.some((device) => device.deviceId === deviceId)

  if (isLoading) return <DefaultSpinner wrapper />

  return (
    <>
      <Stack gap={1} alignItems="flex-start">
        <Box sx={{ width: "100%" }}>
          <SectionTitle marginX={0.5} marginTop={0.5}>
            Devices
          </SectionTitle>
          <List disablePadding={false} sx={{ margin: 0 }}>
            {pushDevices.length === 0 && (
              <CaptionText marginX={0.5}>
                Devices that allow push notifications will appear here...
              </CaptionText>
            )}
            {pushDevices.map((device) => (
              <ListItem
                key={device.deviceId}
                sx={{
                  backgroundColor: "var(--mui-palette-action-hover)",
                  borderRadius: 1,
                  paddingLeft: 1,
                  paddingY: 0,
                }}
                disablePadding={false}
                secondaryAction={
                  <Tooltip title="Remove device">
                    <IconButton
                      color="secondary"
                      onClick={() => handleRemoveDevice(device.subscription.endpoint)}
                      size="small"
                    >
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      background: "var(--mui-palette-background-paper)",
                      borderRadius: 0.75,
                      color: "var(--mui-palette-text-primary)",
                    }}
                  >
                    {getDeviceIcon(device.userAgent)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={formatUserAgent(device.userAgent)}
                  secondary={device.deviceId === deviceId && <CaptionText>This device</CaptionText>}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {!currentDeviceConnected && (
          <LearnMore
            title={
              <>
                Chrome users on Android may need to install the app before using this feature. Go to{" "}
                <b>Device settings</b> and click the <b>Install as PWA</b> button.
              </>
            }
          >
            <LoadingButton
              size="small"
              variant="contained"
              onClick={handleEnablePush}
              disabled={isEnablingPush}
              loading={isEnablingPush}
              loadingText="Enabling push notifications…"
              startIcon={<NotificationsOutlined />}
            >
              Allow push notifications on this device
            </LoadingButton>
          </LearnMore>
        )}

        {pushDevices.length > 0 && (
          <LoadingButton
            size="small"
            variant="outlined"
            color="secondary"
            onClick={handleSendTestNotification}
            disabled={isSendingTest}
            loading={isSendingTest}
            loadingText="Sending test notification…"
            startIcon={<BugReport />} // TODO8
          >
            Send test notification
          </LoadingButton>
        )}
      </Stack>
    </>
  )
}
