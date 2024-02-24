import { ArrowRightAltRounded, GitHub, Telegram } from "@mui/icons-material"
import { Box, Button, IconButton, Link as MuiLink, Paper, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React from "react"
import { Link } from "react-router-dom"
import { StaggeredList } from "src/components/StaggeredList"
import { $activeIndex } from "src/stores/account-store"
import { SerifFont } from "src/theme"

export default function LandingPage({ show }: { show: boolean }) {
  const activeIndex = useStore($activeIndex)

  return (
    <Stack gap={8}>
      <StaggeredList
        show={show}
        paddingX={1}
        direction={{ md: "row", xs: "column" }}
        justifyContent={{ md: "center", xs: "flex-start" }}
        alignItems={{ md: "center", xs: "unset" }}
        gap={{ md: 2 }}
      >
        <Box
          sx={{
            height: { md: 640, xs: "52.5vh" },
            // maxWidth: 720,
            objectFit: "cover",
            objectPosition: "center top",
            width: "100%",
          }}
          component="img"
          src="/landing/mobile-demo.png"
        />
        <StaggeredList show={show} gap={1} sx={{ maxWidth: { md: 240 } }}>
          <Typography variant="h6" fontFamily={SerifFont} lineHeight={1.25} gutterBottom>
            Empower your crypto portfolio with{" "}
            <Box
              component="u"
              sx={{
                color: "accent.main",
                textDecorationStyle: "wavy",
                textUnderlinePosition: "under",
              }}
            >
              advanced analytics
            </Box>
            .
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Surface strengths and weaknesses, inspect historical net worth and balances, prepare
            your tax report, and more.
            <br />
            Privatefolio is an open-source, local-first app.
          </Typography>
          <Button
            size="large"
            component={Link}
            to={`/u/${activeIndex}`}
            variant="contained"
            color="accent"
            sx={{
              "& > span": {
                transition: "transform 0.2s ease-in-out",
              },
              "&:hover > span": {
                transform: "translateX(4px)",
              },
              background:
                "linear-gradient(0deg, var(--mui-palette-accent-dark) 0%, var(--mui-palette-accent-main) 100%)",
              color: "var(--mui-palette-common-white)",
              marginTop: 2,
            }}
            endIcon={<ArrowRightAltRounded />}
          >
            Launch app
          </Button>
        </StaggeredList>
      </StaggeredList>
      <StaggeredList gap={2} sx={{ width: "100%" }} show={show}>
        <Paper sx={{ marginX: "auto", maxWidth: 420, padding: 2 }}>
          <Stack gap={1} alignItems="flex-start">
            <Typography fontFamily={SerifFont} variant="h6">
              Join our newsletter
            </Typography>
            <Typography variant="body2" color="text.secondary" marginTop={-1}>
              Keep up with the latest updates and news.
            </Typography>
            <Button
              target="_blank"
              href="https://kernelwhisperer.substack.com/?utm_source=landing&utm_medium=web&utm_campaign=landing_1"
              LinkComponent={MuiLink}
              variant="contained"
            >
              Subscribe
            </Button>
          </Stack>
        </Paper>
        <Paper sx={{ marginX: "auto", maxWidth: 420, padding: 2 }}>
          <Stack gap={1} alignItems="flex-start">
            <Typography fontFamily={SerifFont} variant="h6">
              Start a discussion
            </Typography>
            <Typography variant="body2" color="text.secondary" marginTop={-1}>
              Find us on Discord or Telegram.
            </Typography>
            <Stack direction="row">
              <IconButton
                size="large"
                target="_blank"
                href="https://t.me/privatefolio"
                LinkComponent={MuiLink}
              >
                <Telegram fontSize="small" />
              </IconButton>
              <IconButton
                size="large"
                target="_blank"
                href="https://discord.gg/5ebfcrZY"
                LinkComponent={MuiLink}
              >
                <svg
                  fill="currentColor"
                  width="20px"
                  height="20px"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M464,66.52A50,50,0,0,0,414.12,17L97.64,16A49.65,49.65,0,0,0,48,65.52V392c0,27.3,22.28,48,49.64,48H368l-13-44L464,496ZM324.65,329.81s-8.72-10.39-16-19.32C340.39,301.55,352.5,282,352.5,282a139,139,0,0,1-27.85,14.25,173.31,173.31,0,0,1-35.11,10.39,170.05,170.05,0,0,1-62.72-.24A184.45,184.45,0,0,1,191.23,296a141.46,141.46,0,0,1-17.68-8.21c-.73-.48-1.45-.72-2.18-1.21-.49-.24-.73-.48-1-.48-4.36-2.42-6.78-4.11-6.78-4.11s11.62,19.09,42.38,28.26c-7.27,9.18-16.23,19.81-16.23,19.81-53.51-1.69-73.85-36.47-73.85-36.47,0-77.06,34.87-139.62,34.87-139.62,34.87-25.85,67.8-25.12,67.8-25.12l2.42,2.9c-43.59,12.32-63.44,31.4-63.44,31.4s5.32-2.9,14.28-6.77c25.91-11.35,46.5-14.25,55-15.21a24,24,0,0,1,4.12-.49,205.62,205.62,0,0,1,48.91-.48,201.62,201.62,0,0,1,72.89,22.95S333.61,145,292.44,132.7l3.39-3.86S329,128.11,363.64,154c0,0,34.87,62.56,34.87,139.62C398.51,293.34,378.16,328.12,324.65,329.81Z" />
                  <path d="M212.05,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.8,0,24.7-11.83,24.7-26.57C237,229.81,225.85,218,212.05,218Z" />
                  <path d="M300.43,218c-13.8,0-24.7,11.84-24.7,26.57s11.14,26.57,24.7,26.57c13.81,0,24.7-11.83,24.7-26.57S314,218,300.43,218Z" />
                </svg>
              </IconButton>
              <IconButton
                size="large"
                target="_blank"
                href="https://github.com/kernelwhisperer/privatefolio"
                LinkComponent={MuiLink}
              >
                <GitHub fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>
      </StaggeredList>
    </Stack>
  )
}
