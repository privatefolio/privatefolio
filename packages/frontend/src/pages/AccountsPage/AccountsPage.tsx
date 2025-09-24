import { Add, ArrowOutwardRounded, Cloud } from "@mui/icons-material"
import { Avatar, Box, Button, Fade, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { AccountAvatar, SIZE_MAP } from "src/components/AccountAvatar"
import { AddAccountDialog } from "src/components/AccountPicker/AddAccountDialog"
import { AppLink } from "src/components/AppLink"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { StaggeredList } from "src/components/StaggeredList"
import { useBoolean } from "src/hooks/useBoolean"
import { useBreakpoints } from "src/hooks/useBreakpoints"
import { useLocalServer } from "src/hooks/useLocalServer"
import { useNonAccountRoute } from "src/hooks/useNonAccountRoute"
import { $cloudAccounts, $localAccounts } from "src/stores/account-store"
import { $cloudRpcReady, $cloudUser } from "src/stores/cloud-server-store"
import { SerifFont } from "src/theme"
import { isElectron } from "src/utils/electron-utils"
import { SPRING_CONFIGS } from "src/utils/utils"

export default function AccountsPage() {
  useNonAccountRoute()
  useEffect(() => {
    document.title = `Accounts - Privatefolio`
  }, [])

  const localAccounts = useStore($localAccounts)
  const cloudAccounts = useStore($cloudAccounts)

  const { value: addAccountOpen, toggle: toggleAddAccount } = useBoolean(false)

  const cloudUser = useStore($cloudUser)
  const cloudRpcReady = useStore($cloudRpcReady)

  useEffect(() => {
    const firstAccount = document.getElementById("account-0")
    firstAccount?.focus()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const firstAccount = document.getElementById("account-0")
      firstAccount?.focus()
    }, 50)
    return () => clearTimeout(timeout)
  }, [])

  const { isDesktop } = useBreakpoints()

  const { localAvailable, loading: localLoading, auth } = useLocalServer()

  const showWelcomeMessage = !localLoading && !localAvailable && cloudUser === null
  const showConfigureMessage =
    !localLoading && !localAvailable && cloudUser && cloudRpcReady === false
  const showUnlockMessage =
    !localLoading && localAvailable && !auth.isAuthenticated && cloudUser === null

  const allAccounts = useMemo<
    {
      accountIndex: number
      accountName: string
      type: "local" | "cloud"
    }[]
  >(
    () => [
      ...(localAccounts ?? []).map((x, index) => ({
        accountIndex: index,
        accountName: x,
        type: "local" as const,
      })),
      ...(cloudAccounts ?? []).map((x, index) => ({
        accountIndex: index,
        accountName: x,
        type: "cloud" as const,
      })),
    ],
    [localAccounts, cloudAccounts]
  )

  return (
    <>
      <Stack
        sx={{
          background: "var(--mui-palette-background-default)",
          height: { sm: "calc(100vh - 64px - 24px)", xs: "calc(100vh - 56px - 24px)" },
          left: 0,
          marginBottom: 3,
          marginTop: { sm: 8, xs: 7 },
          position: "fixed",
          top: 0,
          width: "100%",
          // zIndex: 1000,
        }}
        alignItems="center"
        justifyContent="center"
      >
        {showWelcomeMessage ? (
          <Fade in timeout={400}>
            <Stack gap={3} alignItems="center">
              <Stack gap={0.5} alignItems="center">
                <Typography variant="h5" textAlign="center" fontWeight={700}>
                  Welcome to Privatefolio!
                </Typography>
                <Typography variant="caption" textAlign="center" gutterBottom>
                  This web app is powered by the cloud.
                </Typography>
                <Button
                  size="large"
                  variant="contained"
                  component={Link}
                  to="/cloud"
                  endIcon={<Cloud />}
                  sx={{
                    paddingY: 0.25,
                  }}
                >
                  Login to PrivateCloud™
                </Button>
              </Stack>
              {!isElectron && (
                <Stack gap={0.5} alignItems="center">
                  <Typography variant="caption" textAlign="center" gutterBottom>
                    If you wish to self-host,
                    <br />
                    you can use the desktop app or deploy via Docker.
                  </Typography>
                  <Button
                    size="large"
                    variant="outlined"
                    href="https://privatefolio.xyz/apps"
                    component={AppLink}
                    endIcon={<ArrowOutwardRounded sx={{ fontSize: "1rem !important" }} />}
                    sx={{
                      paddingY: 0.25,
                    }}
                  >
                    Download the Desktop app
                  </Button>
                </Stack>
              )}
            </Stack>
          </Fade>
        ) : showConfigureMessage ? (
          <Stack gap={2} alignItems="center">
            <Typography variant="h5" textAlign="center" fontWeight={700}>
              Your cloud instance is not yet set up.
            </Typography>
            <Button
              size="large"
              variant="contained"
              component={Link}
              to="/cloud"
              endIcon={<Cloud />}
              sx={{
                paddingY: 0.25,
              }}
            >
              Configure your cloud instance
            </Button>
          </Stack>
        ) : showUnlockMessage ? (
          <Stack gap={2} alignItems="center">
            <Typography variant="h5" textAlign="center" fontWeight={700}>
              Your local data is locked.
            </Typography>
            <Button
              size="large"
              variant="contained"
              component={Link}
              to="/local"
              sx={{
                paddingY: 0.25,
              }}
            >
              Unlock app
            </Button>
          </Stack>
        ) : !localAccounts && !cloudAccounts ? (
          <Stack alignItems="center" justifyContent="center" gap={1}>
            <DefaultSpinner />
          </Stack>
        ) : (
          <Box
            sx={{
              maxWidth: "calc(100% - 32px)",
              overflowX: { sm: "auto", xs: "hidden" },
              overflowY: { sm: "hidden", xs: "auto" },
              paddingX: { sm: 0, xs: 1 },
              paddingY: { sm: 1, xs: 0 },
            }}
          >
            <StaggeredList
              gap={2}
              secondary
              config={SPRING_CONFIGS.quick}
              delay={0}
              alignItems="flex-start"
              justifyContent="center"
              sx={{
                flexDirection: { sm: "row", xs: "column" },
                minWidth: "fit-content",
                ...(allAccounts.length > 0 &&
                  allAccounts.length < 6 &&
                  isDesktop && {
                    "& .MuiButton-root .MuiTypography-root": { visibility: "hidden" },
                    "& .MuiButton-root:focus .MuiTypography-root": { visibility: "visible" },
                    "& .MuiButton-root:hover .MuiTypography-root": { visibility: "visible" },
                  }),
              }}
            >
              {allAccounts.map((x, index) => (
                <Button
                  size="large"
                  component={Link}
                  key={`${x.type}-${x.accountName}`}
                  sx={{ borderRadius: 0.25, padding: 2, width: 156 }}
                  to={`/${x.type === "local" ? "l" : "c"}/${x.accountIndex}`}
                  aria-label={`Switch to account ${x.accountName}`}
                  // autoFocus={index === 0} // Doesn't work
                  id={`account-${index}`}
                >
                  <Stack alignItems="center" gap={1}>
                    <AccountAvatar alt={x.accountName} size="xl" type={x.type} />
                    <Typography variant="h6" fontFamily={SerifFont}>
                      {x.accountName}
                    </Typography>
                  </Stack>
                </Button>
              ))}
              <Button
                aria-label="Add account"
                size="large"
                sx={{ borderRadius: 0.25, padding: 2, width: 156 }}
                onClick={toggleAddAccount}
                autoFocus={allAccounts.length === 0}
              >
                <Stack alignItems="center" gap={1}>
                  <Avatar
                    sx={{
                      height: SIZE_MAP.xl / 2,
                      margin: `${SIZE_MAP.xl / 4}px`,
                      width: SIZE_MAP.xl / 2,
                    }}
                  >
                    <Add sx={{ fontSize: SIZE_MAP.xl / 3 }} />
                  </Avatar>
                  <Typography variant="h6" fontFamily={SerifFont} sx={{ marginX: -0.25 }}>
                    Add account
                  </Typography>
                </Stack>
              </Button>
            </StaggeredList>
          </Box>
        )}
      </Stack>
      <AddAccountDialog open={addAccountOpen} toggleOpen={toggleAddAccount} />
    </>
  )
}
