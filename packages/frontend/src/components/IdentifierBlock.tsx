import { ArrowRightAltRounded, OpenInNew } from "@mui/icons-material"
import { Box, Chip, Link as MuiLink, Stack, Tooltip, Typography } from "@mui/material"
import React, { ReactNode, useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import { MonoFont } from "src/theme"
import { noop } from "src/utils/utils"

import { Truncate } from "./Truncate"

type IdentifierBlockProps = {
  href?: string
  id: string
  label?: ReactNode
  /**
   * @default "Open in new tab"
   */
  linkText?: string
  size?: "small" | "medium"
  /**
   * @default "chip"
   */
  variant?: "chip" | "tablecell"
}

export function IdentifierBlock(props: IdentifierBlockProps) {
  const { id, size, variant = "chip", label, href, linkText = "Open in new tab" } = props

  const [copied, setCopied] = useState(false)
  const [hrefHovered, setHrefHovered] = useState(false)
  const isLocalLink = href && !href.includes("http")

  const labelElement = (
    <Truncate>
      <Typography fontFamily={MonoFont} variant="inherit" component="span">
        {label || id}
      </Typography>
    </Truncate>
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1_000)
  }

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
          label={labelElement}
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
                paddingX: 1,
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
      ) : (
        <Box onClick={handleCopy} sx={{ cursor: "pointer" }}>
          {labelElement}
        </Box>
      )}
    </Tooltip>
  )
}
