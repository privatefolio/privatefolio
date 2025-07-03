import { ListItemAvatar, ListItemText, Select, SelectProps, Stack } from "@mui/material"
import React from "react"

import { MenuItemWithTooltip } from "./MenuItemWithTooltip"

function OpenAiIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997V10.5z"
        fill="currentColor"
      />
    </svg>
  )
}

type OpenAIChatModelId =
  | "o1"
  | "o1-2024-12-17"
  | "o1-mini"
  | "o1-mini-2024-09-12"
  | "o1-preview"
  | "o1-preview-2024-09-12"
  | "o3-mini"
  | "o3-mini-2025-01-31"
  | "o3"
  | "o3-2025-04-16"
  | "o4-mini"
  | "o4-mini-2025-04-16"
  | "gpt-4.1"
  | "gpt-4.1-2025-04-14"
  | "gpt-4.1-mini"
  | "gpt-4.1-mini-2025-04-14"
  | "gpt-4.1-nano"
  | "gpt-4.1-nano-2025-04-14"
  | "gpt-4o"
  | "gpt-4o-2024-05-13"
  | "gpt-4o-2024-08-06"
  | "gpt-4o-2024-11-20"
  | "gpt-4o-audio-preview"
  | "gpt-4o-audio-preview-2024-10-01"
  | "gpt-4o-audio-preview-2024-12-17"
  | "gpt-4o-search-preview"
  | "gpt-4o-search-preview-2025-03-11"
  | "gpt-4o-mini-search-preview"
  | "gpt-4o-mini-search-preview-2025-03-11"
  | "gpt-4o-mini"
  | "gpt-4o-mini-2024-07-18"
  | "gpt-4-turbo"
  | "gpt-4-turbo-2024-04-09"
  | "gpt-4-turbo-preview"
  | "gpt-4-0125-preview"
  | "gpt-4-1106-preview"
  | "gpt-4"
  | "gpt-4-0613"
  | "gpt-4.5-preview"
  | "gpt-4.5-preview-2025-02-27"
  | "gpt-3.5-turbo-0125"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-1106"
  | "chatgpt-4o-latest"

export interface AiModel {
  contextWindow: number
  costPer1kTokens: {
    input: number
    output: number
  }
  description: string
  family: "openai"
  label: string
  value: OpenAIChatModelId
}

const AVAILABLE_MODELS: AiModel[] = [
  {
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.0025,
      output: 0.01,
    },
    description: "Great for most tasks",
    family: "openai",
    label: "GPT-4o",
    value: "gpt-4o",
  },
  {
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.06,
      output: 0.24,
    },
    description: "Uses advanced reasoning",
    family: "openai",
    label: "GPT-o3",
    value: "o3",
  },
  {
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.0015,
      output: 0.006,
    },
    description: "Fastest at advanced reasoning",
    family: "openai",
    label: "GPT-o4-mini",
    value: "o4-mini",
  },
  // {
  //   description: "Great at coding and visual reasoning",
  //   family: "openai",
  //   label: "GPT-o4-mini-high",
  //   value: "o4-mini-high",
  // },
  {
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.0025,
      output: 0.01,
    },
    description: "Good for writing and exploring ideas",
    family: "openai",
    label: "GPT-4.5-preview",
    value: "gpt-4.5-preview",
  },
  {
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.0025,
      output: 0.01,
    },
    description: "Great for quick coding and analysis",
    family: "openai",
    label: "GPT-4.1",
    value: "gpt-4.1",
  },
  {
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.00015,
      output: 0.0006,
    },
    description: "Faster for everyday tasks",
    family: "openai",
    label: "GPT-4.1-mini",
    value: "gpt-4.1-mini",
  },
  {
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.00015,
      output: 0.0006,
    },
    description: "Cost-efficient for most tasks",
    family: "openai",
    label: "GPT-4o-mini",
    value: "gpt-4o-mini",
  },
  {
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.01,
      output: 0.03,
    },
    description: "Advanced model with large context",
    family: "openai",
    label: "GPT-4-turbo",
    value: "gpt-4-turbo",
  },
  {
    contextWindow: 16385,
    costPer1kTokens: {
      input: 0.0005,
      output: 0.0015,
    },
    description: "Fast and efficient for simple tasks",
    family: "openai",
    label: "GPT-3.5-turbo",
    value: "gpt-3.5-turbo",
  },
]

function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M tokens`
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K tokens`
  } else {
    return `${tokens} tokens`
  }
}

function formatCost(cost: number): string {
  if (cost >= 1) {
    return `$${cost.toFixed(2)}`
  } else if (cost >= 0.001) {
    return `$${cost.toFixed(3)}`
  } else {
    return `$${cost.toFixed(5)}`
  }
}

function ModelTooltip({ model }: { model: AiModel }) {
  return (
    <Stack>
      <strong>{model.label}</strong>
      <span>{model.description}</span>
      <span className="secondary">Context Window: {formatContextWindow(model.contextWindow)}</span>
      <span className="secondary">Input Cost: {formatCost(model.costPer1kTokens.input)}</span>
      <span className="secondary">Output Cost: {formatCost(model.costPer1kTokens.output)}</span>
    </Stack>
  )
}

export type AiModelSelectProps = SelectProps<string>

export function AiModelSelect(props: AiModelSelectProps) {
  const { ...rest } = props

  return (
    <Select size="small" sx={{ minWidth: 320 }} inputProps={{ name: "model-select" }} {...rest}>
      {AVAILABLE_MODELS.map((model) => (
        <MenuItemWithTooltip
          key={model.value}
          value={model.value}
          tooltipProps={{
            placement: "right",
            title: <ModelTooltip model={model} />,
          }}
        >
          <Stack direction="row" alignItems="center">
            <ListItemAvatar>{model.family === "openai" && <OpenAiIcon size={16} />}</ListItemAvatar>
            <ListItemText primary={model.label} />
          </Stack>
        </MenuItemWithTooltip>
      ))}
    </Select>
  )
}
