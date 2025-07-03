import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getAssistantSystemPrompt, getAssistantTools, MAX_STEPS } from "src/settings/assistant"
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
    const { messages, accountName, model } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required." }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      })
    }

    const openAiApiKeyEncrypted = await getValue(accountName, "assistant_openai_key")

    if (!openAiApiKeyEncrypted) {
      return new Response("OpenAI API key not configured.", {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      })
    }

    const secrets = (await readSecrets()) as AuthSecrets
    const apiKey = await decryptValue(openAiApiKeyEncrypted, secrets.jwtSecret)

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return new Response("Invalid OpenAI API key.", {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      })
    }

    const tools = getAssistantTools(accountName)
    const system = getAssistantSystemPrompt()

    const openai = createOpenAI({ apiKey })
    const result = streamText({
      maxRetries: 5,
      maxSteps: MAX_STEPS + 2,
      messages,
      model: openai.responses(model),
      system,
      tools: {
        // https://ai-sdk.dev/cookbook/node/web-search-agent#using-native-web-search
        web_search_preview: openai.tools.webSearchPreview(),
        ...tools,
      },
    })

    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
      headers: corsHeaders,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    })
  }
}
