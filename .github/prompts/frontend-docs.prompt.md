Find the frontend project inside the monorepo at `./packages/frontend` and read its related files (e.g., package.json, README.md, config files, source code) to extract key details. Then write or rewrite [FRONTEND.MD](../../docs/FRONTEND.md) — delivering the most important insights in a compact manner. It should have the following structure:

# Privatefolio Frontend

## Overview
- A brief paragraph summarizing the frontend’s purpose and its tech stack.

## Architecture
- A concise diagram or description of the frontend’s architecture, including component hierarchy, state management, and API/data flow.

## Directory Structure
- Outline the key folders and files under `packages/frontend`, explaining their roles (e.g., `src/components`, `src/stores`, `public`).

## Core Components
- **App Shell**: Main entry (`src/App.tsx`), routing, and layout.
- **Views & Pages**: Key pages (e.g., Portfolio, Transactions, Settings).
- **UI Components**: Shared components library, charts, tables, forms.
- **State Management**: Global store setup (nanostores, hooks) and data fetching logic.
- **Service Layer**: API integration, WebSocket handling, and Electron IPC (`src/api`, `src/hooks`).

## API Integration
- Describe how the frontend communicates with backend (REST endpoints, WebSocket RPC, IPC in Electron).

## Configuration
- Document environment variables, build-time settings, and config files (e.g., `vite.config.ts`, `public/manifest.json`).

## Features
- Highlight major user-facing features: portfolio analytics, transaction search, price history, custom tags, backup/restore.

## Development
- Prerequisites (Node.js, Yarn), installation (`yarn`), local development (`yarn dev`), and build (`yarn build`).

## Testing
- How to run frontend tests (`yarn test`), test structure (`src/**/__tests__` or `src/**/?(*.)+(test|spec).ts(x)?`), and CI commands.

## Deployment
- Instructions for building and deploying the frontend (static site or Electron packaging, Vercel config).
