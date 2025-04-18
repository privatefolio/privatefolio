Search the monorepo for architecture-related files (e.g., package.json, README.md, config files) to extract key details. Then rewrite [ARCHITECTURE.MD](../../docs/ARCHITECTURE.md) — delivering the most important insights in a compact manner. It should have the following structure:

# [Project Name] Architecture

## Overview
- A brief paragraph summarizing the project’s purpose and monorepo setup (e.g., managed with Yarn/Lerna).

## Structure
- **Root Config:** One-liner covering package manager, license, workspace layout, and build system.

## Packages Summary
For each major package (e.g., Frontend, Backend, Electron):
- **Path & Version:** e.g., `packages/frontend` — vX.Y.Z
- **Description & Key Tech:** A summary of its role and its relationship to other packages.
- **Core Features & Tools:** Detailed list of features and the tools behind them (if applicable).

## Workflow & Integration
- Key commands for building, testing, and running, along with a brief note on shared dependencies and inter-package integrations.

## Deployment
- A couple of bullet points per package summarizing the deployment approach.

Focus on clarity and brevity by using concise bullet points and short sentences.
