import { NotificationsRounded, Settings } from "@mui/icons-material"
import { Badge, Box, IconButton, Menu, Tab, Tooltip } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { useBoolean } from "src/hooks/useBoolean"
import { type Notification } from "src/interfaces"
import { $activeAccount, $connectionStatus } from "src/stores/account-store"
import { closeSubscription, isInputFocused } from "src/utils/browser-utils"
import { logAndReportError } from "src/utils/error-utils"
import { $rpc } from "src/workers/remotes"

import { Key } from "../SearchBar/Key"
import { TabsAlt } from "../TabsAlt"
import { NotificationsList } from "./NotificationsList"
import { NotificationsSettings } from "./NotificationsSettings"

const SHORTCUT_KEY = "n"

export function NotificationDropdown() {
  const { value: open, toggle: toggleOpen } = useBoolean(false)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [tabValue, setTabValue] = useState(0)

  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const accountName = useStore($activeAccount)
  const connectionStatus = useStore($connectionStatus)
  const rpc = useStore($rpc)

  useEffect(() => {
    if (!accountName || !rpc) return

    const fetchData = async () => {
      Promise.all([
        rpc.getNotifications(
          accountName,
          "SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 50"
        ),
        rpc.countNotifications(accountName, "SELECT COUNT(*) FROM notifications WHERE status = 0"),
      ])
        .then(([notificationList, count]) => {
          setNotifications(notificationList)
          setUnreadCount(count)
        })
        .catch((error) => {
          logAndReportError(error, "Failed to fetch notifications")
        })
        .finally(() => setIsLoading(false))
    }

    setIsLoading(true)
    fetchData()

    const subscription = rpc.subscribeToNotifications(accountName, () => {
      fetchData()
    })

    return closeSubscription(subscription, rpc)
  }, [accountName, rpc, connectionStatus])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInputFocused()) return
      if (event.ctrlKey || event.metaKey) return

      if (event.key.toLowerCase() === SHORTCUT_KEY) {
        toggleOpen()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [toggleOpen])

  return (
    <>
      <Tooltip
        title={
          <>
            Notifications <Key variant="tooltip">{SHORTCUT_KEY}</Key>
          </>
        }
      >
        <IconButton color="secondary" ref={setAnchorEl} onClick={toggleOpen}>
          <Badge
            badgeContent={unreadCount}
            color="accent"
            variant="dot"
            invisible={unreadCount === 0}
            overlap="circular"
          >
            <NotificationsRounded
              sx={{
                "@keyframes shake": {
                  "0%, 100%": {
                    transform: "rotate(0deg)",
                  },
                  "20%, 60%": {
                    transform: "rotate(-5deg)",
                  },
                  "40%, 80%": {
                    transform: "rotate(5deg)",
                  },
                },
                "button:hover &": {
                  animation: "shake 0.33s ease-in-out",
                },
              }}
              fontSize="medium"
            />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={toggleOpen}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        sx={{
          "& .MuiPopover-paper": {
            maxHeight: 500,
            maxWidth: { sm: 400 },
            width: "100%",
          },
        }}
      >
        <TabsAlt
          value={tabValue}
          onChange={(_event, newValue: number) => {
            setTabValue(newValue)
          }}
        >
          <Tab label="Notifications" />
          <Tab label={<Settings fontSize="small" />} />
        </TabsAlt>

        <Box padding={0.5}>
          {tabValue === 0 && (
            <NotificationsList
              isLoading={isLoading}
              notifications={notifications}
              unreadCount={unreadCount}
            />
          )}
          {tabValue === 1 && <NotificationsSettings />}
        </Box>
      </Menu>
    </>
  )
}
