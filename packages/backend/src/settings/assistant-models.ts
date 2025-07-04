export type OpenAIChatModelId =
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

export interface AssistantModel {
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

export const AVAILABLE_MODELS: AssistantModel[] = [
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
