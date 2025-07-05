import { AnthropicProviderOptions, createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI, OpenAIResponsesProviderOptions } from "@ai-sdk/openai"
import { createPerplexity } from "@ai-sdk/perplexity"
import { JSONValue, LanguageModelV1, streamText } from "ai"
import { getAssistantSystemPrompt, getAssistantTools, MAX_STEPS } from "src/settings/assistant"
import { AssistantModel, AVAILABLE_MODELS, ModelFamily } from "src/settings/assistant-models"
import { decryptValue } from "src/utils/jwt-utils"

import { corsHeaders } from "../../settings/settings"
import { AuthSecrets, readSecrets } from "../auth-http-api"
import { getValue } from "./kv-api"

function errorHandler(error: unknown) {
  if (error == null) return "unknown error"
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message
  return JSON.stringify(error)
}

function getModel(modelId: string): AssistantModel {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
  if (!model) throw new Error(`Unknown model with id: ${modelId}`)
  return model
}

async function getApiKey(accountName: string, provider: ModelFamily): Promise<string> {
  const secrets = (await readSecrets()) as AuthSecrets
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
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }

  if (!apiKeyEncrypted) {
    throw new Error(`${provider} API key not configured`)
  }

  const apiKey = await decryptValue(apiKeyEncrypted, secrets.jwtSecret)

  if (!apiKey || !apiKey.startsWith(keyPrefix)) {
    throw new Error(`Invalid ${provider} API key`)
  }

  return apiKey
}

// https://ai-sdk.dev/docs/
export async function handleAssistantChat(request: Request): Promise<Response> {
  const { method } = request

  if (method !== "POST") {
    return new Response("Method not allowed - only POST is allowed.", {
      headers: corsHeaders,
      status: 405,
    })
  }

  try {
    const { messages, accountName, modelId } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      })
    }

    const model = getModel(modelId)
    const system = getAssistantSystemPrompt()
    const apiKey = await getApiKey(accountName, model.family)

    let tools = getAssistantTools(accountName)
    let llmModel: LanguageModelV1
    let providerOptions: Record<string, Record<string, JSONValue>>

    switch (model.family) {
      case "openai":
        llmModel = createOpenAI({ apiKey, compatibility: "strict" }).responses(model.id)
        providerOptions = {
          openai: {
            reasoningEffort: "low",
            reasoningSummary: "auto",
          } satisfies OpenAIResponsesProviderOptions,
        }
        tools = {
          // https://ai-sdk.dev/cookbook/node/web-search-agent#using-native-web-search
          web_search_preview: createOpenAI({
            apiKey,
            compatibility: "strict",
          }).tools.webSearchPreview(),
          ...tools,
        }
        break
      case "perplexity":
        llmModel = createPerplexity({ apiKey }).languageModel(model.id)
        break
      case "anthropic":
        llmModel = createAnthropic({ apiKey }).languageModel(model.id)
        providerOptions = {
          anthropic: {
            thinking: { budgetTokens: 1200, type: "enabled" },
          } satisfies AnthropicProviderOptions,
        }
        break
      default:
        throw new Error(`Unsupported model: ${model.id}`)
    }

    const result = streamText({
      maxRetries: 5,
      maxSteps: MAX_STEPS + 2,
      messages,
      model: llmModel,
      providerOptions,
      system,
      tools,
    })

    return result.toDataStreamResponse({
      experimental_sendFinish: true,
      experimental_sendStart: true,
      getErrorMessage: errorHandler,
      headers: corsHeaders,
      sendReasoning: true,
      sendSources: true,
      sendUsage: true,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    })
  }
}
