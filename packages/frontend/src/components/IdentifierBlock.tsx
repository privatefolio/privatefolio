import { ArrowRightAltRounded, OpenInNew } from "@mui/icons-material"
import {
  Box,
  Button,
  Chip,
  Link as MuiLink,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material"
import React, { ReactNode, useState } from "react"
import { MonoFont } from "src/theme"
import { noop } from "src/utils/utils"

import { AppLink } from "./AppLink"
import { CaptionText } from "./CaptionText"
import { Truncate } from "./Truncate"

export type IdentifierBlockProps = {
  avatar?: ReactNode
  hideName?: boolean
  hideTooltip?: boolean
  href?: string
  id: string
  label?: ReactNode
  /**
   * @default "Open in new tab"
   */
  linkText?: ReactNode
  secondary?: ReactNode
  /**
   * @default "small"
   */
  size?: "small" | "medium"
  /**
   * @default "chip"
   */
  variant?: "chip" | "tablecell" | "button"
}

export function IdentifierBlock(props: IdentifierBlockProps) {
  let {
    id,
    size = "small",
    variant = "chip",
    label,
    href,
    linkText = "Open in new tab",
    avatar,
    secondary,
    hideName,
    hideTooltip,
  } = props

  if (hideName && props.variant === undefined) variant = "tablecell"

  const [copied, setCopied] = useState(false)
  const [hrefHovered, setHrefHovered] = useState(false)
  const isLocalLink = href && !href.includes("http")

  const labelElement = (
    <Truncate>
      <Typography
        // fontFamily={MonoFont}
        variant="inherit"
        component="span"
      >
        {hideName ? null : label || id}
      </Typography>
    </Truncate>
  )

  const mainElement = (
    <Stack
      direction="row"
      alignItems="center"
      gap={size === "small" && variant !== "tablecell" ? 0.5 : 1}
    >
      {avatar}
      <Stack>
        {labelElement}
        <CaptionText>{secondary}</CaptionText>
      </Stack>
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
        hideTooltip ? null : hrefHovered || (variant !== "chip" && !!href) ? (
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
              component={AppLink}
              href={href}
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
      ) : variant === "button" ? (
        <Button component={AppLink} href={href} size={size}>
          {mainElement}
        </Button>
      ) : href ? (
        <MuiLink component={AppLink} href={href} underline="none">
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
