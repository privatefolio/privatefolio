import { AnthropicProviderOptions, createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI, OpenAIResponsesProviderOptions } from "@ai-sdk/openai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { createPerplexity } from "@ai-sdk/perplexity"
import { JSONValue, LanguageModelV1, Message, StepResult, streamText, Tool } from "ai"
import { ChatMessage } from "src/interfaces"
import { getAssistantSystemPrompt, getAssistantTools, MAX_STEPS } from "src/settings/assistant"
import { AssistantModel, AVAILABLE_MODELS, ModelFamily } from "src/settings/assistant-models"
import { logAndReportError } from "src/utils/error-utils"
import { decryptValue } from "src/utils/jwt-utils"

import { corsHeaders } from "../../settings/settings"
import { Api } from "../api"
import { AuthSecrets, readSecrets } from "../auth-http-api"
import { getValue } from "./kv-api"

function errorHandler(error: unknown) {
  let newError: Error
  if (error == null) newError = new Error("Unknown Error")
  if (typeof error === "string") newError = new Error(error)
  if (error instanceof Error) newError = error
  logAndReportError(newError, "Error in assistant chat handler")
  return JSON.stringify(newError.message)
}

type ChatResult = Omit<StepResult<Record<string, Tool>>, "stepType" | "isContinued"> & {
  readonly steps: StepResult<Record<string, Tool>>[]
}

function resultToChatMessage(
  result: ChatResult,
  conversationId: string,
  systemPrompt: string,
  modelId: string
): ChatMessage {
  const parts: Message["parts"] = []

  if (result.text) parts.push({ text: result.text, type: "text" })

  for (const step of result.steps) {
    step.toolCalls.forEach((x, index) =>
      parts.push({
        toolInvocation: {
          ...x,
          result: step.toolResults[index],
          state: step.toolResults[index] ? "result" : "call",
        },
        type: "tool-invocation",
      })
    )

    step.sources.forEach((x) =>
      parts.push({
        source: x,
        type: "source",
      })
    )

    if (step.reasoning) {
      parts.push({
        details: step.reasoningDetails,
        reasoning: step.reasoning,
        type: "reasoning",
      })
    }
  }

  return {
    conversationId,
    id: result.response.id,
    message: result.text,
    metadata: JSON.stringify({
      exactModelId: result.response.modelId,
      finishReason: result.finishReason,
      modelId,
      systemPrompt,
      usage: result.usage,
    }),
    parts: JSON.stringify(parts),
    role: "assistant",
    // timestamp: new Date(result.response.timestamp).getTime(),
    timestamp: Date.now(),
  }
}

function getModel(modelId: string): AssistantModel {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
  if (!model) throw new Error(`Unknown model with id: ${modelId}`)
  return model
}

async function getApiKey(accountName: string, provider: ModelFamily): Promise<string> {
  const { jwtSecret } = (await readSecrets()) as AuthSecrets
  let apiKeyEncrypted: string | null = null
  let keyPrefix = ""

  switch (provider) {
    case "openai":
      apiKeyEncrypted = await getValue(accountName, "assistant_openai_key")
      keyPrefix = "sk-"
      break
    case "perplexity":
      apiKeyEncrypted = await getValue(accountName, "assistant_perplexity_key")
      keyPrefix = "pplx-"
      break
    case "anthropic":
      apiKeyEncrypted = await getValue(accountName, "assistant_anthropic_key")
      keyPrefix = "sk-ant-"
      break
    case "custom": {
      // Custom models may need API keys depending on the server
      apiKeyEncrypted = await getValue(accountName, "assistant_custom_api_key")
      if (!apiKeyEncrypted) {
        return "" // No API key configured - some custom servers don't need one
      }
      const apiKey = await decryptValue(apiKeyEncrypted, secrets.jwtSecret)
      return apiKey || ""
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }

  if (!apiKeyEncrypted) {
    throw new Error(`${provider} API key not configured`)
  }

  const apiKey = await decryptValue(apiKeyEncrypted, jwtSecret)

  if (!apiKey || !apiKey.startsWith(keyPrefix)) {
    throw new Error(`Invalid ${provider} API key`)
  }

  return apiKey
}

async function getCustomApiUrl(accountName: string): Promise<string> {
  const secrets = (await readSecrets()) as AuthSecrets
  const apiUrlEncrypted = await getValue(accountName, "assistant_custom_api_url")

  if (!apiUrlEncrypted) {
    return "http://localhost:12434/engines/v1" // Default fallback URL
  }

  const apiUrl = await decryptValue(apiUrlEncrypted, secrets.jwtSecret)
  return apiUrl || "http://localhost:12434/engines/v1"
}

type AssistantChatRequest = {
  accountName: string
  id: string
  messages: Message[]
  modelId: string
}

// https://ai-sdk.dev/docs/
export async function handleAssistantChat(request: Request, writeApi: Api): Promise<Response> {
  const { method } = request

  if (method !== "POST") {
    return new Response("Method not allowed - only POST is allowed.", {
      headers: corsHeaders,
      status: 405,
    })
  }

  try {
    const req = (await request.json()) as AssistantChatRequest

    const { messages, accountName, modelId, id: conversationId } = req

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      })
    }

    const model = getModel(modelId)
    const apiKey = await getApiKey(accountName, model.family)

    const lastUserMessage = messages.findLast((message) => message.role === "user")
    if (!lastUserMessage) {
      throw new Error("No user message found")
    }

    await writeApi.upsertChatMessage(accountName, {
      conversationId,
      id: lastUserMessage.id,
      message: lastUserMessage.content,
      role: lastUserMessage.role as "user" | "assistant" | "system",
      timestamp: Date.now(),
    })

    let tools = getAssistantTools(accountName)
    let llmModel: LanguageModelV1
    let providerOptions: Record<string, Record<string, JSONValue>>

    switch (model.family) {
      case "openai":
        llmModel = createOpenAI({ apiKey, compatibility: "strict" }).responses(model.id)
        providerOptions = {
          openai: {
            reasoningEffort: "medium",
            reasoningSummary: "detailed",
          } satisfies OpenAIResponsesProviderOptions,
        }
        if (model.capabilities?.includes("web-search")) {
          tools = {
            // https://ai-sdk.dev/cookbook/node/web-search-agent#using-native-web-search
            webSearch: {
              ...createOpenAI({
                apiKey,
                compatibility: "strict",
              }).tools.webSearchPreview(),
              description:
                "Search the web/internet for current market information, news, and external data",
            },
            ...tools,
          }
        }
        break
      case "perplexity":
        llmModel = createPerplexity({ apiKey }).languageModel(model.id)
        tools = {}
        break
      case "anthropic":
        llmModel = createAnthropic({ apiKey }).languageModel(model.id)
        if (model.capabilities?.includes("reasoning")) {
          providerOptions = {
            anthropic: {
              thinking: {
                budgetTokens: 1200,
                type: "enabled",
              },
            } satisfies AnthropicProviderOptions,
          }
        }
        if (model.capabilities?.includes("web-search")) {
          // https://github.com/vercel/ai/issues/6666#issuecomment-3005289250
        }
        break
      case "custom": {
        const customApiUrl = await getCustomApiUrl(accountName)
        llmModel = createOpenAICompatible({
          apiKey: apiKey || undefined,
          baseURL: customApiUrl,
          name: "custom",
        }).languageModel(model.id)
        providerOptions = {}
        tools = {}
        break
      }
      default:
        throw new Error(`Unsupported model: ${model.id}`)
    }

    const system = getAssistantSystemPrompt(tools)

    const result = streamText({
      maxRetries: 5,
      maxSteps: MAX_STEPS + 5,
      messages,
      model: llmModel,
      onFinish: (message) => {
        // console.log("📜 LOG > onFinish: > message:", message)
        writeApi
          .upsertChatMessage(
            accountName,
            resultToChatMessage(message, conversationId, system, modelId)
          )
          .catch(console.error)
      },
      // onStepFinish: async (step) => {
      //   console.log("📜 LOG > onStepFinish: > step:", step)
      //   await writeApi.upsertChatMessage(accountName, stepToChatMessage(step, conversationId))
      // },
      providerOptions,
      system,
      tools,
    })

    return result.toDataStreamResponse({
      experimental_sendFinish: true,
      experimental_sendStart: true,
      getErrorMessage: (error) => {
        const errorMessage = errorHandler(error)

        writeApi
          .upsertChatMessage(accountName, {
            conversationId,
            message: errorMessage,
            metadata: JSON.stringify({ modelId, severity: "error" }),
            role: "system",
            timestamp: Date.now(),
          })
          .catch(console.error)

        return errorMessage
      },
      headers: {
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
        ...corsHeaders,
      },
      sendReasoning: true,
      sendSources: true,
      sendUsage: true,
    })
  } catch (error) {
    return new Response(String(error), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    })
  }
}
