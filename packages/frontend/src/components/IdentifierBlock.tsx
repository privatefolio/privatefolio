import { ArrowRightAltRounded, OpenInNew } from "@mui/icons-material"
import {
  Box,
  Chip,
  Link as MuiLink,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material"
import React, { ReactNode, useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import { MonoFont } from "src/theme"
import { noop } from "src/utils/utils"

import { Truncate } from "./Truncate"

export type IdentifierBlockProps = {
  avatar?: ReactNode
  hideName?: boolean
  href?: string
  id: string
  label?: ReactNode
  /**
   * @default "Open in new tab"
   */
  linkText?: ReactNode
  size?: "small" | "medium"
  /**
   * @default "chip"
   */
  variant?: "chip" | "tablecell"
}

export function IdentifierBlock(props: IdentifierBlockProps) {
  let {
    id,
    size,
    variant = "chip",
    label,
    href,
    linkText = "Open in new tab",
    avatar,
    hideName,
  } = props

  if (hideName && props.variant === undefined) variant = "tablecell"

  const [copied, setCopied] = useState(false)
  const [hrefHovered, setHrefHovered] = useState(false)
  const isLocalLink = href && !href.includes("http")

  const labelElement = (
    <Truncate>
      <Typography fontFamily={MonoFont} variant="inherit" component="span">
        {hideName ? null : label || id}
      </Typography>
    </Truncate>
  )

  const mainElement = (
    <Stack direction="row" alignItems="center" gap={1}>
      {avatar}
      {labelElement}
    </Stack>
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1_000)
  }

  const isTablet = useMediaQuery("(max-width: 899px)")

  return (
    <Tooltip
      title={
        hrefHovered ? (
          linkText
        ) : (
          <Stack alignItems="center">
            <Box sx={{ fontFamily: MonoFont, maxWidth: "100%" }}>{id}</Box>
            <span className="secondary">({copied ? "copied" : "copy to clipboard"})</span>
          </Stack>
        )
      }
    >
      {variant === "chip" ? (
        <Chip
          size={size}
          onClick={handleCopy}
          label={mainElement}
          onDelete={href ? noop : undefined}
          deleteIcon={
            <Box
              component={isLocalLink ? RouterLink : MuiLink}
              href={href}
              to={href}
              target={!isLocalLink ? "_blank" : undefined}
              onMouseEnter={() => setHrefHovered(true)}
              onMouseLeave={() => setHrefHovered(false)}
              sx={{
                "&:hover": {
                  background: "var(--mui-palette-action-hover)",
                },
                alignItems: "center",
                display: "flex",
                height: "100%",
                margin: "0px !important",
                paddingX: isTablet ? 1 : 0.5,
              }}
            >
              {!isLocalLink ? (
                <OpenInNew sx={{ height: "1rem !important" }} />
              ) : (
                <ArrowRightAltRounded sx={{ height: "1rem !important" }} />
              )}
            </Box>
          }
        />
      ) : href ? (
        <MuiLink
          component={isLocalLink ? RouterLink : MuiLink}
          href={href}
          to={href}
          target={!isLocalLink ? "_blank" : undefined}
          onMouseEnter={() => setHrefHovered(true)}
          onMouseLeave={() => setHrefHovered(false)}
          underline="none"
        >
          <Stack direction="row" alignItems="center" gap={1}>
            {mainElement}
            {!isLocalLink ? <OpenInNew sx={{ height: "1rem !important" }} /> : <></>}
          </Stack>
        </MuiLink>
      ) : (
        <Box onClick={handleCopy} sx={{ cursor: "pointer" }}>
          {mainElement}
        </Box>
      )}
    </Tooltip>
  )
}
