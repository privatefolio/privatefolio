import {
  AddCircle,
  ArrowCircleDownRounded,
  Cancel,
  Cloud,
  KeyRounded,
  PauseCircle,
  PlayCircle,
  RestartAlt,
  Settings,
} from "@mui/icons-material"
import {
  Avatar,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Container,
  Fade,
  FormControlLabel,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { useQuery } from "@tanstack/react-query"
import { enqueueSnackbar } from "notistack"
import React, { useEffect, useMemo } from "react"
import { CloudInstanceStatus, getCheckoutLink, getPortalLink } from "src/api/privatecloud-api"
import { CloudLoginForm } from "src/components/AccountPicker/CloudLoginForm"
import { AppLink } from "src/components/AppLink"
import { BackButton } from "src/components/BackButton"
import { CircularSpinner } from "src/components/CircularSpinner"
import { Gravatar } from "src/components/Gravatar"
import { LogoText } from "src/components/Header/LogoText"
import { PaymentPlanChip } from "src/components/PaymentPlanChip"
import { SectionTitle } from "src/components/SectionTitle"
import { StaggeredList } from "src/components/StaggeredList"
import { APP_VERSION } from "src/env"
import { useConfirm } from "src/hooks/useConfirm"
import { ONE_HOUR_CACHE } from "src/settings"
import { $activeAccount } from "src/stores/account-store"
import { getLatestAppVersion } from "src/stores/app-store"
import { $cloudAuth, unlockApp } from "src/stores/auth-store"
import {
  $cloudInstance,
  $cloudPortalLink,
  $cloudServerInfo,
  $cloudServerMutating,
  $cloudSubscription,
  $cloudUser,
  checkCloudInstance,
  checkCloudServerInfo,
  checkSubscription,
  handleCreateServer,
  handleLogout,
  handlePauseServer,
  handleRemoveServer,
  handleRestartServer,
  handleSetupServer,
  handleUnpauseServer,
  handleUpdateServer,
} from "src/stores/cloud-user-store"
import { isElectron, openExternalLink } from "src/utils/electron-utils"
import { formatDate } from "src/utils/formatting-utils"
import { $cloudRest } from "src/workers/remotes"

import { ServerStatusIcon } from "./ServerStatusIcon"

export default function CloudUserPage({ show }: { show: boolean }) {
  const activeAccount = useStore($activeAccount)
  useEffect(() => {
    if (activeAccount) {
      $activeAccount.set("")
    }
  }, [activeAccount])

  useEffect(() => {
    document.title = "PrivateCloud"
  }, [])

  const account = useStore($cloudUser)
  const sub = useStore($cloudSubscription)
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
    if (account) {
      getPortalLink()
        .then((link) => {
          $cloudPortalLink.set(link.url)
        })
        .catch(() => {
          // console.warn("Error fetching portal link:", error)
          $cloudPortalLink.set(null)
        })
    }
  }, [account])

  const paymentPlan = useMemo<{
    cancelAt?: Date
    isPremium: boolean
    loading?: boolean
    name: string
    priceText?: string
    renewal?: Date
  }>(() => {
    if (sub === undefined) {
      return { isPremium: false, loading: true, name: "Loading…" }
    }
    if (sub === null) {
      return { isPremium: false, name: "Free" }
    }

    const item = sub.items.data[0]
    if (!item) {
      return { isPremium: false, name: "Free" }
    }

    const { plan } = item
    const amount = plan.amount / 100
    const currency = plan.currency.toUpperCase().replace("USD", "$")
    const interval = plan.interval

    const name = plan.nickname || "Premium"

    const renewal = new Date(sub.billing_cycle_anchor * 1000)
    renewal.setMonth(new Date(renewal).getMonth() + plan.interval_count)

    return {
      cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : undefined,
      isPremium: true,
      name,
      priceText: `${currency}${amount.toFixed(2)} per ${interval}`,
      renewal,
    }
  }, [sub])

  const confirm = useConfirm()

  if (!account) {
    return (
      <Container maxWidth="xs" sx={{ marginTop: 8 }} disableGutters>
        <StaggeredList component="main" gap={1} show={show} tertiary>
          <BackButton sx={{ marginLeft: 2 }} fallback="/">
            Back
          </BackButton>
          <Card variant="outlined">
            <CloudLoginForm />
          </Card>
        </StaggeredList>
      </Container>
    )
  }

  return (
    <Container maxWidth="xs" sx={{ marginTop: 8 }} disableGutters>
      <StaggeredList component="main" gap={1} show={show} tertiary>
        <BackButton sx={{ marginLeft: 2 }} fallback="/">
          Back
        </BackButton>
        <Card variant="outlined">
          <LogoText color="primary" sx={{ paddingTop: 2, paddingX: 3 }}>
            PrivateCloud™
          </LogoText>
          <CardContent component={Stack} gap={3}>
            <div>
              <SectionTitle>Account</SectionTitle>
              <Stack direction="row" alignItems="flex-start" gap={2} sx={{ overflowX: "auto" }}>
                <Gravatar email={account?.email} />
                <Stack>
                  <Typography variant="caption" component="div">
                    <Stack direction="row" gap={1}>
                      <Typography variant="inherit" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="inherit">
                        {account ? account.email : "Unknown"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" gap={1}>
                      <Typography variant="inherit" color="text.secondary">
                        User ID
                      </Typography>{" "}
                      <Typography variant="inherit">#{account.id}</Typography>
                    </Stack>
                    <Stack direction="row" gap={1}>
                      <Typography variant="inherit" color="text.secondary">
                        Plan
                      </Typography>
                      {paymentPlan.loading ? (
                        <Stack>
                          <Skeleton height={20} width={80} />
                        </Stack>
                      ) : (
                        <>
                          <Typography variant="inherit" component="div">
                            <PaymentPlanChip plan={paymentPlan.name} />
                            {!paymentPlan.loading && !paymentPlan.isPremium && (
                              <>
                                {" "}
                                -{" "}
                                <AppLink
                                  variant="inherit"
                                  href="https://pay.privatefolio.app"
                                  onClick={async (event) => {
                                    event.preventDefault()
                                    const paymentLink = await getCheckoutLink()
                                    if (isElectron) {
                                      openExternalLink?.(paymentLink.url)
                                    } else {
                                      window.open(paymentLink.url, "_blank")
                                    }
                                  }}
                                >
                                  Upgrade to Premium
                                </AppLink>
                              </>
                            )}
                          </Typography>
                        </>
                      )}
                      <Typography
                        variant="inherit"
                        color="text.secondary"
                        component="span"
                        fontStyle="italic"
                      >
                        {paymentPlan.priceText}
                      </Typography>
                    </Stack>
                    {paymentPlan.isPremium && (
                      <Fade in>
                        <Stack>
                          {paymentPlan.cancelAt && (
                            <Typography variant="inherit" color="text.secondary" fontStyle="italic">
                              Your subscription will be canceled on{" "}
                              {formatDate(paymentPlan.cancelAt)}.
                            </Typography>
                          )}
                          {!paymentPlan.cancelAt && paymentPlan.renewal && (
                            <Typography variant="inherit" color="text.secondary" fontStyle="italic">
                              Your subscription renews on {formatDate(paymentPlan.renewal)}.
                            </Typography>
                          )}
                        </Stack>
                      </Fade>
                    )}
                  </Typography>
                </Stack>
              </Stack>
            </div>

            <div>
              <SectionTitle>Cloud server</SectionTitle>
              <Stack direction="row" alignItems="flex-start" gap={2} sx={{ overflowX: "auto" }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  badgeContent={
                    cloudInstance && (
                      <Fade in>
                        <Stack
                          sx={{
                            backgroundColor: "var(--mui-palette-background-paper)",
                            borderRadius: "50%",
                          }}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <ServerStatusIcon status={serverStatus} />
                        </Stack>
                      </Fade>
                    )
                  }
                >
                  <Avatar>
                    <Cloud color="primary" fontSize="small" />
                  </Avatar>
                  {(cloudInstance === undefined ||
                    serverStatus === "pending" ||
                    serverStatus === "creating" ||
                    serverStatus === "restarting") && (
                    <CircularSpinner
                      size={40}
                      rootSx={{
                        left: 0,
                        position: "absolute",
                        top: 0,
                      }}
                      bgColor="transparent"
                    />
                  )}
                </Badge>

                <Stack>
                  {cloudInstance === undefined ? (
                    <Stack>
                      <Skeleton height={18} width={80} />
                      <Skeleton height={18} width={100} />
                      <Skeleton height={18} width={100} />
                      <Skeleton height={32} width={220} />
                    </Stack>
                  ) : (
                    <>
                      <Typography variant="caption" component="div">
                        <Stack direction="row" gap={1}>
                          <Typography variant="inherit" color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="inherit" textTransform="capitalize">
                            {serverStatus}
                          </Typography>
                          <Typography variant="inherit" component="span">
                            {cloudInstance?.statusText && (
                              <Typography
                                variant="inherit"
                                component="span"
                                color="text.secondary"
                                fontStyle="italic"
                              >
                                {cloudInstance.statusText}
                              </Typography>
                            )}
                          </Typography>
                        </Stack>
                        <Stack direction="row" gap={1}>
                          <Typography variant="inherit" component="span" color="text.secondary">
                            Server ID
                          </Typography>{" "}
                          <Typography variant="inherit" component="span">
                            {cloudInstance ? cloudInstance.id : "Unknown"}
                          </Typography>
                        </Stack>
                        {cloudInstance && (
                          <Stack direction="row" gap={1}>
                            <Typography variant="inherit" component="span" color="text.secondary">
                              Server limits
                            </Typography>{" "}
                            <Typography variant="inherit" component="span">
                              {cloudInstance.limits.cpus}{" "}
                              <Typography
                                variant="inherit"
                                component="span"
                                color="text.secondary"
                                fontStyle="italic"
                              >
                                CPUs -{" "}
                              </Typography>
                              {cloudInstance.limits.memory}{" "}
                              <Typography
                                variant="inherit"
                                component="span"
                                color="text.secondary"
                                fontStyle="italic"
                              >
                                RAM
                              </Typography>
                            </Typography>
                          </Stack>
                        )}
                        {serverInfo && (
                          <Stack direction="row" gap={1}>
                            <Typography variant="inherit" component="span" color="text.secondary">
                              Server version
                            </Typography>{" "}
                            <Typography variant="inherit" component="span">
                              {serverInfo.version}
                              <Typography
                                variant="inherit"
                                component="span"
                                color="text.secondary"
                                fontStyle="italic"
                              >
                                {" "}
                                {formatDate(new Date(serverInfo.buildDate))}
                              </Typography>
                            </Typography>
                          </Stack>
                        )}
                      </Typography>
                      <ButtonGroup
                        size="small"
                        variant="outlined"
                        color="secondary"
                        sx={{
                          "& button": {
                            // borderRadius: 0,
                            // paddingY: 1.5,
                            paddingX: 1,
                          },
                          height: 32,
                          paddingY: 0.5,
                        }}
                      >
                        {serverStatus === "needs setup" && (
                          <Button
                            onClick={async () => {
                              const { confirmed, event } = await confirm({
                                confirmText: "Complete setup",
                                content: (
                                  <Stack gap={0} maxWidth={420}>
                                    <Typography variant="body2" color="text.secondary">
                                      To complete the setup, please enter the password of your
                                      PrivateCloud account.
                                      <br />
                                      <br />
                                    </Typography>
                                    <div>
                                      <SectionTitle>Password</SectionTitle>
                                      <TextField
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                      />
                                    </div>
                                  </Stack>
                                ),
                                focusInput: "password",
                                title: "Password required",
                              })

                              if (!event) return

                              const formData = new FormData(event.target as HTMLFormElement)
                              const password = formData.get("password") as string

                              if (confirmed) {
                                handleSetupServer(password)
                              }
                            }}
                            startIcon={<Settings />}
                            disabled={serverMutating}
                          >
                            Setup
                          </Button>
                        )}
                        {serverStatus === "needs login" && (
                          <Button
                            onClick={async () => {
                              const { confirmed, event } = await confirm({
                                confirmText: "Login",
                                content: (
                                  <Stack gap={0} maxWidth={420}>
                                    <Typography variant="body2" color="text.secondary">
                                      To login to your server, please enter the password of your
                                      PrivateCloud account.
                                      <br />
                                      <br />
                                    </Typography>
                                    <div>
                                      <SectionTitle>Password</SectionTitle>
                                      <TextField
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                      />
                                    </div>
                                  </Stack>
                                ),
                                focusInput: "password",
                                title: "Password required",
                              })

                              if (!event) return

                              const formData = new FormData(event.target as HTMLFormElement)
                              const password = formData.get("password") as string

                              if (confirmed) {
                                try {
                                  await unlockApp(password, $cloudAuth, $cloudRest.get())
                                } catch (err) {
                                  enqueueSnackbar(`Cloud server: ${(err as Error).message}`, {
                                    variant: "error",
                                  })
                                }
                              }
                            }}
                            startIcon={<KeyRounded />}
                            disabled={serverMutating}
                          >
                            Login
                          </Button>
                        )}
                        {latestVersion && serverInfo && serverInfo.version !== latestVersion && (
                          <Button
                            onClick={handleUpdateServer}
                            startIcon={<ArrowCircleDownRounded />}
                            disabled={serverMutating}
                          >
                            Update
                          </Button>
                        )}
                        {cloudInstance && serverStatus === "paused" && (
                          <Button
                            onClick={handleUnpauseServer}
                            startIcon={<PlayCircle />}
                            disabled={serverMutating}
                          >
                            Resume
                          </Button>
                        )}
                        {cloudInstance && serverStatus === "running" && (
                          <Button
                            onClick={handlePauseServer}
                            startIcon={<PauseCircle />}
                            disabled={serverMutating}
                          >
                            Pause
                          </Button>
                        )}
                        {cloudInstance !== null && (
                          <Button
                            onClick={handleRestartServer}
                            startIcon={<RestartAlt />}
                            disabled={
                              serverMutating ||
                              (!!cloudInstance &&
                                (["restarting"] as CloudInstanceStatus[]).includes(
                                  cloudInstance.status
                                ))
                            }
                          >
                            Restart
                          </Button>
                        )}
                        {cloudInstance === null && (
                          <Button
                            startIcon={<AddCircle />}
                            onClick={handleCreateServer}
                            disabled={serverMutating}
                          >
                            Create
                          </Button>
                        )}
                        {cloudInstance !== null && (
                          <Button
                            startIcon={<Cancel />}
                            onClick={async () => {
                              const { confirmed, event } = await confirm({
                                confirmText: "Destroy",
                                content: (
                                  <Stack gap={0}>
                                    <Typography variant="body2" color="text.secondary">
                                      Destroy the server instance, which allows you start again.
                                      Optionally you can also remove all user data and start fresh.
                                      <br />
                                      <br />
                                      This action is permanent. Are you sure you wish to continue?
                                      <br />
                                      <br />
                                    </Typography>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          name="remove-data"
                                          color="secondary"
                                          sx={{ marginLeft: 0.5 }}
                                        />
                                      }
                                      label="Remove user data"
                                    />
                                  </Stack>
                                ),
                                title: "Destroy server",
                                variant: "warning",
                              })

                              if (!event) return

                              const formData = new FormData(event.target as HTMLFormElement)
                              const removeData = (formData.get("remove-data") as string) === "on"

                              if (confirmed) {
                                handleRemoveServer(removeData)
                              }
                            }}
                            disabled={serverMutating}
                          >
                            Destroy
                          </Button>
                        )}
                      </ButtonGroup>
                    </>
                  )}
                </Stack>
              </Stack>
            </div>

            <Stack>
              <SectionTitle>Help</SectionTitle>
              <AppLink variant="body2" href="mailto:hello@danielconstantin.net">
                Contact support
              </AppLink>

              {portalLink && (
                <Fade in>
                  <AppLink variant="body2" href={portalLink}>
                    Manage my subscription
                  </AppLink>
                </Fade>
              )}
              {cloudInstance?.url && (
                <Fade in>
                  <AppLink variant="body2" href={cloudInstance.url}>
                    Visit server link
                  </AppLink>
                </Fade>
              )}
            </Stack>
          </CardContent>
          <CardActions>
            <Button onClick={handleLogout} color="primary" variant="contained">
              Logout
            </Button>
          </CardActions>
        </Card>
      </StaggeredList>
    </Container>
  )
}
