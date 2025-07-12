Search the monorepo for AI-related files (e.g., SDK initialization, provider configs, API routes, environment variables) to extract key details about AI integration. Then write or rewrite [AI.md](../../docs/AI.md) — delivering the most important insights in a concise format. It should have the following structure:

# Privatefolio AI Usage Guide

## Overview
- A brief paragraph summarizing how the project leverages AI services and the role they play in the overall product.

## Providers & SDKs
- **Vercel AI SDK**: Where and how it is initialized/configured.
- **OpenAI**: Models used, endpoints, and purpose.
- **Anthropic**: Models used, endpoints, and purpose.
- **Perplexity**: Models used, endpoints, and purpose.

## Frontend Integration
- **Assistant Chat Page**: File/path of the chat UI, state management, and message flow.

## Backend / API Integration
- **Assistant API (App Router)**: Location of the API route, request/response schema, and business logic.
- **Assistant HTTP API**: Stand-alone endpoint(s), authentication, and rate-limiting specifics.

## Environment Variables & Configuration
- List required environment variables for each provider (API keys, org IDs, model versions, etc.) and default configuration values.

## Prompt & Model Management
- Explain where prompts are stored/managed, how context is assembled, and any caching or retrieval mechanisms.

## Development & Testing
- Steps to set up local AI provider credentials, stub/mock providers for tests, and run development servers with AI features enabled.

## Security & Cost Considerations
- Tips on securely storing keys, monitoring usage, and controlling token/credit expenditure.

Focus on clarity and brevity by using concise bullet points and short sentences. 
