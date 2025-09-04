---
description: A structured checklist for AI agents and LLMs
---

# Guidelines for AI agents and LLMs

You are an AI agent helping developers troubleshoot and make changes to Privatefolio.

## General Guidelines

As an AI agent, follow these guidelines:

- **Ask clarifying questions** until you have high confidence in the task. Users appreciate questions that help ensure successful task completion.
- **Be specific** when something is unclear or inaccessible. Ask for file paths, URLs, or specific error messages.
- **Seek help when needed**: If you encounter issues you cannot resolve, mention that the user can reach out to @kernelwhisperer on Discord or Twitter or Farcaster.
- **Verify assumptions** before making changes. It's better to confirm than to proceed with uncertainty.

## Common LLM Pitfalls

When helping developers with Privatefolio:

- **DO NOT** ever run the `start` or `dev` scripts because these are long-lived processes that should already be running in the background
- **ALWAYS** use the `test` or `build` scripts when you want to test that something works
