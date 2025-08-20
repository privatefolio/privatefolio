import { DnsRounded, WifiOffRounded } from "@mui/icons-material"
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Fade,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material"
import React, { useEffect } from "react"
import LocalLoginForm from "src/components/AccountPicker/LocalLoginForm"
import { AppLink } from "src/components/AppLink"
import { CircularSpinner } from "src/components/CircularSpinner"
import { LogoText } from "src/components/Header/LogoText"
import { SectionTitle } from "src/components/SectionTitle"
import { ServerStatusIcon } from "src/components/ServerStatusIcon"
import { StaggeredList } from "src/components/StaggeredList"
import { useHelpLinks } from "src/hooks/useHelpLinks"
import { useLocalServer } from "src/hooks/useLocalServer"
import { useNonAccountRoute } from "src/hooks/useNonAccountRoute"
import { $localAuth, lockApp } from "src/stores/auth-store"
import { isElectron, restartBackend } from "src/utils/electron-utils"
import { formatDate, formatFileSize } from "src/utils/formatting-utils"
import { $localRest } from "src/workers/remotes"

export default function LocalServerPage({ show }: { show: boolean }) {
  useNonAccountRoute()
  useEffect(() => {
    document.title = "Local server - Privatefolio"
  }, [])

  const { auth, serverInfo, serverStatus, systemInfo, localServerEnabled } = useLocalServer()
  const { bugGitHubUrl, featureGitHubUrl, questionDiscordUrl } = useHelpLinks()

  if (isElectron && window.electron?.backend.getErrorMessage()) {
    return (
      <Container maxWidth="xs" sx={{ marginTop: 8 }} disableGutters>
        <CardContent component={Stack} gap={2} alignItems="center">
          <WifiOffRounded sx={{ fontSize: 100 }} />
          <Alert severity="error">{window.electron?.backend.getErrorMessage()}</Alert>
          <Button variant="contained" onClick={restartBackend}>
            Restart local server
          </Button>
          <Stack alignSelf="flex-start">
            <SectionTitle>Help</SectionTitle>
            <AppLink variant="body2" href={bugGitHubUrl}>
              Report an issue
            </AppLink>
            <AppLink variant="body2" href={featureGitHubUrl}>
              Request a feature
            </AppLink>
            <AppLink variant="body2" href={questionDiscordUrl}>
              Ask a question
            </AppLink>
          </Stack>
        </CardContent>
      </Container>
    )
  }
  if (localServerEnabled && (!auth.isAuthenticated || auth.needsSetup) && !auth.kioskMode) {
    return (
      <Container maxWidth="xs" sx={{ marginTop: 8 }} disableGutters>
        <StaggeredList component="main" gap={1} show={show} tertiary>
          <LocalLoginForm />
        </StaggeredList>
      </Container>
    )
  }

  return (
    <Container maxWidth="xs" sx={{ marginTop: 8 }} disableGutters>
      <StaggeredList component="main" gap={1} show={show} tertiary>
        <Card variant="outlined">
          <LogoText color="primary" sx={{ paddingTop: 2, paddingX: 3 }}>
            Local server
          </LogoText>
          <CardContent component={Stack} gap={3}>
            <div>
              <Stack direction="row" alignItems="flex-start" gap={2} sx={{ overflowX: "auto" }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  badgeContent={
                    serverInfo && (
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
                    <DnsRounded color="primary" fontSize="small" />
                  </Avatar>
                  {serverInfo === undefined && (
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
                  {serverInfo === undefined ? (
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
                        </Stack>
                        {serverInfo && (
                          <Stack direction="row" gap={1}>
                            <Typography variant="inherit" component="span" color="text.secondary">
                              Server limits
                            </Typography>{" "}
                            <Typography variant="inherit" component="span">
                              {systemInfo?.cpuCores}{" "}
                              <Typography
                                variant="inherit"
                                component="span"
                                color="text.secondary"
                                fontStyle="italic"
                              >
                                CPUs -{" "}
                              </Typography>
                              {formatFileSize(systemInfo?.memory ?? 0)}{" "}
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
                    </>
                  )}
                </Stack>
              </Stack>
            </div>

            <Stack>
              <SectionTitle>Help</SectionTitle>
              <AppLink variant="body2" href={bugGitHubUrl}>
                Report an issue
              </AppLink>
              <AppLink variant="body2" href={featureGitHubUrl}>
                Request a feature
              </AppLink>
              <AppLink variant="body2" href={questionDiscordUrl}>
                Ask a question
              </AppLink>
            </Stack>
          </CardContent>
          <CardActions>
            <Button
              onClick={() => {
                lockApp($localAuth, $localRest.get())
              }}
              color="primary"
              variant="contained"
            >
              Lock app
            </Button>
          </CardActions>
        </Card>
      </StaggeredList>
    </Container>
  )
}
