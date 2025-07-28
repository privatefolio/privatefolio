import {
  BugReport,
  FilterListRounded,
  InboxRounded,
  Inventory2Outlined,
  MarkEmailReadOutlined,
  MarkEmailUnreadOutlined,
  MoreHoriz,
  ReplyRounded,
  SvgIconComponent,
} from "@mui/icons-material"
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useScrollTrigger,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useCallback, useMemo, useState } from "react"
import { Notification } from "src/interfaces"
import { $activeAccount } from "src/stores/account-store"
import { formatDate } from "src/utils/formatting-utils"
import { $rpc } from "src/workers/remotes"

import { CaptionText } from "../CaptionText"
import { DefaultSpinner } from "../DefaultSpinner"
import { SectionTitle } from "../SectionTitle"

interface NotificationsListProps {
  isLoading: boolean
  notifications: Notification[]
  unreadCount: number
}

type FilterOption = "inbox" | "unread" | "archived"

type FilterShape = {
  icon: SvgIconComponent
  label: string
  value: FilterOption
}

const FILTER_OPTIONS: FilterShape[] = [
  { icon: InboxRounded, label: "Unread and read", value: "inbox" },
  { icon: MarkEmailUnreadOutlined, label: "Unread", value: "unread" },
  { icon: Inventory2Outlined, label: "Archived", value: "archived" },
]

const MORE_ACTIONS = [
  { icon: MarkEmailReadOutlined, id: "mark-all-read", label: "Mark all as read" },
  { icon: Inventory2Outlined, id: "archive-all", label: "Archive all" },
  { icon: Inventory2Outlined, id: "archive-read", label: "Archive read" },
]

export function NotificationsList(props: NotificationsListProps) {
  const { isLoading, notifications, unreadCount } = props

  const accountName = useStore($activeAccount)
  const rpc = useStore($rpc)

  const handleNotificationClick = useCallback(
    async (notificationId: number, status: number) => {
      if (!accountName || !rpc) return

      try {
        await rpc.patchNotification(accountName, notificationId, { status })
      } catch (err) {
        console.error("Failed to update notification status:", err)
      }
    },
    [accountName, rpc]
  )

  const [filter, setFilter] = useState<FilterOption>("inbox")
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null)

  const [listRef, setListRef] = useState<HTMLElement | null>(null)

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    target: listRef ?? undefined,
    threshold: 1,
  })

  // Filter notifications based on the selected filter
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const status = notification.status ?? 0
      switch (filter) {
        case "inbox":
          return status !== 2
        case "unread":
          return status === 0
        case "archived":
          return status === 2
        default:
          return true
      }
    })
  }, [notifications, filter])

  const handleBulkAction = useCallback(
    async (actionId: string) => {
      if (!accountName || !rpc) return

      try {
        const target = filteredNotifications.filter((notification) => {
          const status = notification.status ?? 0
          switch (actionId) {
            case "mark-all-read":
              return status === 0 // Only unread notifications
            case "archive-all":
              return status !== 2 // All non-archived notifications
            case "archive-read":
              return status === 1 // Only read notifications
            default:
              return false
          }
        })

        const targetStatus = actionId === "mark-all-read" ? 1 : 2 // 1 = read, 2 = archived

        await rpc.patchNotifications(
          accountName,
          target.map((notification) => notification.id),
          {
            status: targetStatus,
          }
        )
      } catch (err) {
        console.error("Failed to execute bulk action:", err)
      }
    },
    [accountName, rpc, filteredNotifications]
  )

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }

  const handleFilterSelect = (selectedFilter: FilterOption) => {
    setFilter(selectedFilter)
    handleFilterClose()
  }

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreAnchorEl(event.currentTarget)
  }

  const handleMoreClose = () => {
    setMoreAnchorEl(null)
  }

  const handleMoreActionSelect = (actionId: string) => {
    handleBulkAction(actionId)
    handleMoreClose()
  }

  const activeFilterOption = FILTER_OPTIONS.find((option) => option.value === filter)

  if (isLoading) return <DefaultSpinner wrapper />

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          borderBottom: "1px solid",
          borderColor: trigger ? "var(--mui-palette-divider)" : "transparent",
          paddingBottom: 0.5,
          transition: "border-color 0.2s ease-in-out",
        }}
      >
        <SectionTitle marginX={0.5} marginTop={0.5}>
          {(filter === "archived" || unreadCount === 0) && (
            <Box component="span" sx={{ textTransform: "capitalize" }}>
              {filter}
            </Box>
          )}
          {filter !== "archived" && unreadCount > 0 && `${unreadCount} unread notifications`}
        </SectionTitle>
        <Stack direction="row">
          <Tooltip title={`Filter: ${activeFilterOption?.label || "All"}`}>
            <IconButton
              size="small"
              color={filter === "inbox" ? "secondary" : "primary"}
              onClick={handleFilterClick}
            >
              <Badge badgeContent={filter === "inbox" ? 0 : 1} color="accent" variant="dot">
                <FilterListRounded fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
            anchorOrigin={{
              horizontal: "right",
              vertical: "bottom",
            }}
            transformOrigin={{
              horizontal: "right",
              vertical: "top",
            }}
          >
            {FILTER_OPTIONS.map((option) => {
              const IconComponent = option.icon
              return (
                <MenuItem
                  key={option.value}
                  selected={filter === option.value}
                  onClick={() => handleFilterSelect(option.value)}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconComponent fontSize="small" />
                    <Typography variant="body2">{option.label}</Typography>
                  </Stack>
                </MenuItem>
              )
            })}
          </Menu>
          {filter !== "archived" && filteredNotifications.length > 0 && (
            <Tooltip title="More actions">
              <IconButton size="small" color="secondary" onClick={handleMoreClick}>
                <MoreHoriz fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Menu
            anchorEl={moreAnchorEl}
            open={Boolean(moreAnchorEl)}
            onClose={handleMoreClose}
            anchorOrigin={{
              horizontal: "right",
              vertical: "bottom",
            }}
            transformOrigin={{
              horizontal: "right",
              vertical: "top",
            }}
          >
            {MORE_ACTIONS.map((action) => {
              const IconComponent = action.icon
              return (
                <MenuItem key={action.id} onClick={() => handleMoreActionSelect(action.id)}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconComponent fontSize="small" />
                    <Typography variant="body2">{action.label}</Typography>
                  </Stack>
                </MenuItem>
              )
            })}
          </Menu>
        </Stack>
      </Stack>
      <Box ref={setListRef} sx={{ maxHeight: 380, overflowY: "auto", width: "100%" }}>
        <List disablePadding={false} sx={{ margin: 0 }}>
          {filteredNotifications.length === 0 && (
            <CaptionText marginX={0.5}>
              {filter === "inbox"
                ? "Nothing to see here yet..."
                : `No ${filter} notifications found.`}
            </CaptionText>
          )}
          {filteredNotifications.map(({ createdAt, id, status = 0, text, title }, index) => (
            <ListItem
              divider={index !== filteredNotifications.length - 1}
              key={id}
              disablePadding={false}
              sx={{
                "&:hover": {
                  "& .actions": {
                    visibility: "visible",
                  },
                  "& .date": {
                    visibility: "hidden",
                  },
                },
                alignItems: "flex-start",
                paddingLeft: 0.5,
                paddingRight: 1,
                paddingY: 1,
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    background: "var(--mui-palette-background-paper)",
                    borderRadius: 0.75,
                    color: "var(--mui-palette-text-primary)",
                    marginTop: 1.25,
                  }}
                >
                  <BugReport />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primaryTypographyProps={{
                  component: "div",
                }}
                primary={
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    marginBottom={0.75}
                    alignItems="center"
                  >
                    <Typography variant="body1">{title}</Typography>
                    <Typography variant="caption" color="text.secondary" className="date">
                      {formatDate(createdAt)}
                      <Badge
                        color="accent"
                        variant="dot"
                        sx={{ marginLeft: 1 }}
                        invisible={status !== 0} // Hide badge if read (1) or archived (2)
                      />
                    </Typography>
                  </Stack>
                }
                secondaryTypographyProps={{
                  variant: "body2",
                }}
                secondary={text}
              />
              <Stack
                direction="row"
                justifyContent="flex-end"
                className="actions"
                sx={{
                  "& button": {
                    borderRadius: 0.75,
                  },
                  alignItems: "center",
                  backgroundColor: "var(--mui-palette-background-paper)",
                  border: "1px solid var(--mui-palette-divider)",
                  borderRadius: 1,
                  justifyContent: "center",
                  padding: 0.25,
                  position: "absolute",
                  right: 4,
                  top: 4,
                  visibility: "hidden",
                  zIndex: 1,
                }}
              >
                {status === 2 ? (
                  <>
                    <Tooltip title="Unarchive">
                      <IconButton
                        onClick={() => handleNotificationClick(id, 1)}
                        size="small"
                        color="secondary"
                      >
                        <ReplyRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Tooltip title="Archive">
                      <IconButton
                        onClick={() => handleNotificationClick(id, 2)}
                        size="small"
                        color="secondary"
                      >
                        <Inventory2Outlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={status === 1 ? "Mark as unread" : "Mark as read"}>
                      <IconButton
                        onClick={() => handleNotificationClick(id, status === 1 ? 0 : 1)}
                        size="small"
                        color="secondary"
                      >
                        {status === 1 ? (
                          <MarkEmailUnreadOutlined fontSize="small" />
                        ) : (
                          <MarkEmailReadOutlined fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  )
}
