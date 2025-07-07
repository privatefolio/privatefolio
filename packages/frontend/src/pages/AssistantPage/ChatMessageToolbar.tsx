import { AutoAwesome, ContentCopyRounded, SpeedRounded } from "@mui/icons-material"
import { IconButton, Stack, Tooltip } from "@mui/material"
import { LanguageModelUsage, Message } from "ai"
import { AVAILABLE_MODELS } from "privatefolio-backend/src/settings/assistant-models"
import React, { useMemo, useState } from "react"
import { formatNumber } from "src/utils/formatting-utils"

const opts: Intl.NumberFormatOptions = {
  notation: "compact",
}

export function ChatMessageToolbar(props: { message: Message }) {
  const { message } = props
  const { annotations } = message

  const usage = useMemo(() => {
    const annotation = annotations?.find(
      (x) => x !== null && typeof x === "object" && "key" in x && x.key === "usage"
    )

    if (annotation && typeof annotation === "object" && "value" in annotation) {
      return annotation.value as LanguageModelUsage
    }
  }, [annotations])

  const modelId = useMemo(() => {
    const annotation = annotations?.find(
      (x) => x !== null && typeof x === "object" && "key" in x && x.key === "modelId"
    )

    if (annotation && typeof annotation === "object" && "value" in annotation) {
      return annotation.value as string
    }
  }, [annotations])

  const model = useMemo(() => {
    return AVAILABLE_MODELS.find((x) => x.id === modelId)
  }, [modelId])

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1_000)
  }

  if (message.role === "user") return null
  if (!annotations) return null

  return (
    <Stack direction="row" alignItems="center" gap={1} marginTop={1}>
      <Tooltip title={copied ? "Copied" : "Copy"}>
        <IconButton
          onClick={() => {
            navigator.clipboard.writeText(message.content)
            handleCopy()
          }}
          size="small"
        >
          <ContentCopyRounded fontSize="inherit" />
        </IconButton>
      </Tooltip>
      {usage && (
        <Tooltip
          title={
            <Stack alignItems="center">
              <span>Tokens used: {formatNumber(usage.totalTokens, opts)}</span>
              <span className="secondary">
                ({formatNumber(usage.promptTokens, opts)} for context)
              </span>
              <span className="secondary">
                ({formatNumber(usage.completionTokens, opts)} for response)
              </span>
              <span className="secondary">({copied ? "copied" : "copy to clipboard"})</span>
            </Stack>
          }
        >
          <IconButton
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(String(usage.totalTokens))
              handleCopy()
            }}
          >
            <SpeedRounded fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
      {modelId && (
        <Tooltip
          title={
            <Stack alignItems="center">
              <span>Model used: {model?.label ?? modelId}</span>
              <span className="secondary">({copied ? "copied" : "copy to clipboard"})</span>
            </Stack>
          }
        >
          <IconButton
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(modelId)
              handleCopy()
            }}
          >
            <AutoAwesome fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}
