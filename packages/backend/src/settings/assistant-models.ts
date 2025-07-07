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

export type PerplexityModelId =
  | "sonar-deep-research"
  | "sonar-reasoning-pro"
  | "sonar-reasoning"
  | "sonar-pro"
  | "sonar"
  | "r1-1776"

export type AnthropicModelId =
  | "claude-4-opus-20250514"
  | "claude-4-sonnet-20250514"
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-3-haiku-20240307"

export type ModelId = OpenAIChatModelId | PerplexityModelId | AnthropicModelId

export type ModelFamily = "openai" | "perplexity" | "anthropic"

export type ModelCapability = "web-search" | "reasoning" | "tools"

export interface AssistantModel {
  capabilities?: ModelCapability[]
  contextWindow: number
  costPer1kTokens: {
    input: number
    output: number
  }
  description: string
  family: ModelFamily
  id: ModelId
  label: string
}

export const AVAILABLE_MODELS: AssistantModel[] = [
  // OpenAI Models
  // {
  //   capabilities: ["tools", "web-search"],
  //   contextWindow: 128000,
  //   costPer1kTokens: {
  //     input: 0.0025,
  //     output: 0.01,
  //   },
  //   description: "Great for most tasks",
  //   family: "openai",
  //   id: "gpt-4o",
  //   label: "GPT-4o",
  // },
  {
    capabilities: ["tools", "web-search", "reasoning"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.06,
      output: 0.24,
    },
    description: "Uses advanced reasoning",
    family: "openai",
    id: "o3",
    label: "GPT-o3",
  },
  {
    capabilities: ["tools", "web-search", "reasoning"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.0015,
      output: 0.006,
    },
    description: "Fastest at advanced reasoning",
    family: "openai",
    id: "o4-mini",
    label: "GPT-o4-mini",
  },
  {
    capabilities: ["tools"],
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.0025,
      output: 0.01,
    },
    description: "Good for writing and exploring ideas",
    family: "openai",
    id: "gpt-4.5-preview",
    label: "GPT-4.5",
  },
  {
    capabilities: ["tools", "web-search"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.0025,
      output: 0.01,
    },
    description: "Great for quick coding and analysis",
    family: "openai",
    id: "gpt-4.1",
    label: "GPT-4.1",
  },
  {
    capabilities: ["tools", "web-search"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.00015,
      output: 0.0006,
    },
    description: "Faster for everyday tasks",
    family: "openai",
    id: "gpt-4.1-mini",
    label: "GPT-4.1-mini",
  },
  // {
  //   capabilities: ["tools", "web-search"],
  //   contextWindow: 128000,
  //   costPer1kTokens: {
  //     input: 0.00015,
  //     output: 0.0006,
  //   },
  //   description: "Cost-efficient for most tasks",
  //   family: "openai",
  //   id: "gpt-4o-mini",
  //   label: "GPT-4o-mini",
  // },
  // {
  //   capabilities: ["tools", "web-search"],
  //   contextWindow: 128000,
  //   costPer1kTokens: {
  //     input: 0.01,
  //     output: 0.03,
  //   },
  //   description: "Advanced model with large context",
  //   family: "openai",
  //   id: "gpt-4-turbo",
  //   label: "GPT-4-turbo",
  // },
  // {
  //   capabilities: ["tools", "web-search"],
  //   contextWindow: 16385,
  //   costPer1kTokens: {
  //     input: 0.0005,
  //     output: 0.0015,
  //   },
  //   description: "Fast and efficient for simple tasks",
  //   family: "openai",
  //   id: "gpt-3.5-turbo",
  //   label: "GPT-3.5-turbo",
  // },
  // Perplexity Models
  {
    capabilities: ["web-search"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.002,
      output: 0.008,
    },
    description:
      "Best suited for exhaustive research, generating detailed reports and in-depth insights",
    family: "perplexity",
    id: "sonar-deep-research",
    label: "Sonar Deep Research",
  },
  {
    capabilities: ["web-search", "reasoning"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.002,
      output: 0.008,
    },
    description:
      "Enhanced reasoning model with multi-step problem-solving capabilities and real-time search",
    family: "perplexity",
    id: "sonar-reasoning-pro",
    label: "Sonar Reasoning Pro",
  },
  {
    capabilities: ["web-search", "reasoning"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.001,
      output: 0.005,
    },
    description: "Quick problem-solving and reasoning model, ideal for evaluating complex queries",
    family: "perplexity",
    id: "sonar-reasoning",
    label: "Sonar Reasoning",
  },
  {
    capabilities: ["web-search"],
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.003,
      output: 0.015,
    },
    description:
      "Advanced search model optimized for complex queries and deeper content understanding",
    family: "perplexity",
    id: "sonar-pro",
    label: "Sonar Pro",
  },
  {
    capabilities: ["web-search"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.001,
      output: 0.001,
    },
    description: "Lightweight, cost-effective search model designed for quick, grounded answers",
    family: "perplexity",
    id: "sonar",
    label: "Sonar",
  },
  {
    capabilities: ["reasoning"],
    contextWindow: 128000,
    costPer1kTokens: {
      input: 0.002,
      output: 0.008,
    },
    description: "Advanced reasoning model",
    family: "perplexity",
    id: "r1-1776",
    label: "R1-1776",
  },
  // Anthropic Models
  {
    capabilities: ["tools", "web-search", "reasoning"],
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.015,
      output: 0.075,
    },
    description: "Most intelligent model for complex tasks",
    family: "anthropic",
    id: "claude-4-opus-20250514",
    label: "Claude 4 Opus",
  },
  {
    capabilities: ["tools", "web-search", "reasoning"],
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.003,
      output: 0.015,
    },
    description: "Optimal balance of intelligence, cost, and speed",
    family: "anthropic",
    id: "claude-4-sonnet-20250514",
    label: "Claude 4 Sonnet",
  },
  {
    capabilities: ["tools", "web-search", "reasoning"],
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.003,
      output: 0.015,
    },
    description: "Optimal balance of intelligence, cost, and speed",
    family: "anthropic",
    id: "claude-3-7-sonnet-20250219",
    label: "Claude 3.7 Sonnet",
  },
  {
    capabilities: ["tools", "web-search"],
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.003,
      output: 0.015,
    },
    description: "Optimal balance of intelligence, cost, and speed",
    family: "anthropic",
    id: "claude-3-5-sonnet-20241022",
    label: "Claude 3.5 Sonnet",
  },
  {
    capabilities: ["tools", "web-search"],
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.0008,
      output: 0.004,
    },
    description: "Fastest, most cost-effective model",
    family: "anthropic",
    id: "claude-3-5-haiku-20241022",
    label: "Claude 3.5 Haiku",
  },

  {
    capabilities: ["tools"],
    contextWindow: 200000,
    costPer1kTokens: {
      input: 0.00025,
      output: 0.00125,
    },
    description: "Fastest, most cost-effective model",
    family: "anthropic",
    id: "claude-3-haiku-20240307",
    label: "Claude 3 Haiku",
  },
]

type ModeId = "read" | "write" | "deep-research"

type Mode = {
  description: string
  id: ModeId
  label: string
}

export const AVAILABLE_MODES: Mode[] = [
  {
    description: "Give the model read access to your data",
    id: "read",
    label: "Read",
  },
  {
    description: "Give the model read-write access to your data",
    id: "write",
    label: "Write",
  },
  {
    description: "Give the model a 15-minute window to complete a difficult task",
    id: "deep-research",
    label: "Deep Research",
  },
]
