# Frontend

## Overview
- The Privatefolio Frontend is a React and Vite powered TypeScript application that delivers a responsive and interactive UI for tracking multi-chain cryptocurrency portfolios. It leverages Material‑UI for design, nanostores for state management, and Comlink/WebWorker‑backed SQLite for client‑side data persistence, with seamless integration into Electron.

## Architecture
- App Shell (`src/App.tsx`) initializes routing and layout.
- Views & Pages consume shared UI components and data stores.
- State Management via nanostores stores global state and persists settings.
- Service Layer communicates through REST/WebSocket (FeathersJS) and Electron IPC.
- Data Layer runs in a WebWorker using Comlink + wa‑sqlite for local SQLite access.

## Directory Structure
- packages/frontend/
  - public/: static assets and PWA manifest
  - src/
    - components/: reusable UI elements (charts, tables, forms)
    - views/: page components (Portfolio, Transactions, Settings)
    - stores/: nanostores state and persistence logic
    - api/: REST/WebSocket client setup and hooks
    - hooks/: custom React hooks (data fetching, IPC)
    - styles/: theme and global styles
    - App.tsx, main.tsx: entry point and router
  - build/: compiled bundles and assets
  - vite.config.ts, tsconfig.json: build and compiler configuration
  - vercel.json: deployment settings for Vercel

## Core Components
- App Shell: routing with React Router Dom, layout and top‑level providers (`src/App.tsx`).
- Views & Pages: key user screens — Portfolio overview, Transaction history, Search/Command palette, Settings.
- UI Components: Material‑UI based library for charts (lightweight‑charts), tables, inputs and notifications.
- State Management: nanostores in `src/stores` for reactive global state, persistent settings via `@nanostores/persistent`.
- Service Layer: API modules in `src/api` using FeathersJS REST/WebSocket; Electron IPC exposed via preload for desktop.

## API Integration
- REST calls and real‑time RPC via FeathersJS clients configured at runtime with `VITE_APP_VERSION`, `VITE_GIT_HASH`, `VITE_GIT_DATE`.
- WebSocket subscriptions for live updates (balances, prices).
- Electron IPC (`window.electron.*`) for native features (notifications, file import/export).

## Configuration
- Environment Variables: VITE_APP_VERSION, VITE_GIT_HASH, VITE_GIT_DATE, VITE_PUBLIC_…
- Vite Config (`vite.config.ts`): aliasing, plugin setup (`@vitejs/plugin-react`, rollup visualizer).
- Vercel Settings (`vercel.json`) for static deployment and rewrites.

## Features
- Portfolio Analytics: real‑time balance charts and net worth tracking.
- Transaction Management: list, search (by hash), and tag transactions.
- Price History: interactive candlestick and line charts per asset.
- Command Palette: quick search and actions via `kbar`.
- Backup & Restore: import/export data as JSON or CSV.

## Development
- Prerequisites: Node.js v20+, Yarn 1.22+
- Install: `yarn`
- Dev Server: `cd packages/frontend && yarn dev` (runs on port 4000)
- Build: `yarn build`

## Testing
- Run Unit & Integration: `yarn test`
- Test Patterns: files matching `src/**/?(*.)+(test|spec).ts(x)?`
- CI: included in `yarn test:ci` via root Lerna workflow

## Deployment
- Static Site: serve `packages/frontend/build` on any web host or Vercel.
- Electron: packaged into desktop app via `yarn bundle` in root (see ELECTRON_SETUP.md).

## Contributing
- Please read [`CONTRIBUTING.md`](../../../CONTRIBUTING.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for guidelines on code style, testing, and workflow.
