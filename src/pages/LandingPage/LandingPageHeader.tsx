import { AppBar, Button, Container, Stack, Toolbar } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { Link } from "react-router-dom"
import { Logo } from "src/components/Header/Logo"
import { $activeIndex } from "src/stores/account-store"

export default function LandingPageHeader() {
  const activeIndex = useStore($activeIndex)

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: "none !important",
          border: "none",
          color: "var(--mui-palette-primary-main) !important",
        }}
      >
        <Toolbar disableGutters>
          <Container
            disableGutters
            maxWidth="xl"
            sx={{ marginTop: -0.5, paddingX: { xs: 2 }, paddingY: 0, position: "relative" }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              sx={{
                height: "100%",
                paddingX: {
                  sm: 2,
                  xs: 1,
                },
                width: "100%",
              }}
            >
              <Logo />
              <Button
                component={Link}
                to={`/u/${activeIndex}`}
                variant="outlined"
                color="secondary"
                sx={{ minWidth: 107 }}
              >
                Launch app
              </Button>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>
    </>
  )
}
