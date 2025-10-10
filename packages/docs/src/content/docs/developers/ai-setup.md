---
title: AI setup
description: Configure AI assistants with OpenAI, Anthropic, and Perplexity providers in Privatefolio
---

# AI setup

## Overview

- Leverages Vercel AI SDK for an interactive portfolio analysis assistant in both frontend and backend.
- Users chat with an AI that can query on-chain data, run SQL via tools, and fetch current market info via web search.

## Providers & SDKs

- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/ui-utils`): powers chat streaming and UI hooks in the frontend.
- **OpenAI** (`@ai-sdk/openai` v1.3.22): used for chat completions and tool-enabled search via `createOpenAI().responses(modelId)` and `tools.webSearchPreview()`.
- **Anthropic** (`@ai-sdk/anthropic` v1.2.12): language models via `createAnthropic({ apiKey }).languageModel(modelId)`.
- **Perplexity** (`@ai-sdk/perplexity` v1.1.9): language models via `createPerplexity({ apiKey }).languageModel(modelId)`.

## Frontend Integration

- **Assistant Page**: `packages/frontend/src/pages/AssistantPage/AssistantPage.tsx` sets up tabs and routes.
- **Chat UI**: `AssistantChat.tsx` uses `useChat` from `@ai-sdk/react` to manage messages, stream responses, and handle stops.
- **State Management**: nanostores (`$assistantModel`, `$assistantMode`, `$activeAccount`) control model selection and account context.
- **UI Components**: model selector (`AssistantModelSelect.tsx`), settings (`AssistantSettings.tsx`), message toolbar and history components.

## Backend / API Integration

- **Assistant HTTP API**: `packages/backend/src/api/account/assistant-http-api.ts` exports `handleAssistantChat`.
  - Endpoint: `POST /assistant-chat`
  - Request: JSON `{ accountName, id (conversationId), modelId, messages: Message[] }`.
  - Response: chunked streaming (`Transfer-Encoding: chunked`) via `streamText` from Vercel AI SDK.
- **Business Logic**:
  - Fetch encrypted API key (`getApiKey`) from KV store.
  - Select model and provider options based on `model.family` and `model.capabilities`.
  - Assemble system prompt (`getAssistantSystemPrompt` in `settings/assistant.ts`).
  - Initialize tools (`getAssistantTools`) for on-chain data access.
- **Chat Persistence**: `assistant-api.ts` provides upsert and query functions (`upsertChatMessage`, `getChatHistoryByConversation`).

## Environment Variables & Configuration

- **Backend Service**:
  - `JWT_SECRET`: decrypts per-account AI keys stored in KV.
  - `PORT`: HTTP server port (default 5555).
- **Provider Credentials** (per account, stored encrypted in KV):
  - `assistant_openai_key` (prefixed `sk-`)
  - `assistant_anthropic_key` (prefixed `sk-ant-`)
  - `assistant_perplexity_key` (prefixed `pplx-`)

## Prompt & Model Management

- **System Prompt**: template in `packages/backend/src/settings/assistant.ts` via `getAssistantSystemPrompt`, includes timestamp and tool descriptions.
- **Models**: definitions in `packages/backend/src/settings/assistant-models.ts`, listing IDs, families, capabilities, context windows, and cost per 1k tokens.
- **Metadata**: each chat message stores `modelId`, `usage`, `finishReason`, and prompt context in JSON metadata.

## Development & Testing

- **Local Setup**: run `yarn dev` (frontend & backend) or `yarn dev:electron` for desktop.
- **AI Keys**: load provider API keys into KV using the `AuthSecrets` mechanism and `assistant_*_key` entries.
- **Testing**:
  - Frontend: `packages/frontend` uses Vitest and mocks `useChat` as needed.
  - Backend: run `vitest` in `packages/backend`, stub `streamText` or mock `createOpenAI`/`createAnthropic` calls.

## Security & Cost Considerations

- Store AI keys encrypted; never log raw keys.
- Monitor token usage via metadata (`usage` returned by `streamText`) and use cost settings in `assistant-models.ts`.
- Choose smaller, cost-efficient models (`o4-mini`, `gpt-4.1-mini`) when high throughput is needed.
- Rate limits and authentication enforced via JWT and per-account secrets; no built-in rate throttling in AI API layer—implement externally if needed.
