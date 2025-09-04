# Backend

## Overview

Privatefolio Backend is a Node.js/Bun service that aggregates multi-chain cryptocurrency data, provides a REST and WebSocket API, and persists data in a local SQLite database. It powers the desktop app and frontend with real-time account balances, transactions, and price history.

## Architecture

```
Frontend  <── HTTP/WebSocket ──>  Backend Server  <── API SDK ──>  Data Aggregator (Relayer)
                                              │
                                              └── SQLite (persistent storage)
```

- **API Server** handles HTTP routes and WebSocket RPC for frontend communication.
- **Backend Relayer** schedules tasks for data fetching, processing, and side-effects.
- **Database** uses SQLite for fast, local persistence.
- **Utilities** provide config management, process control, and inter-service communications.

## Package structure

```text
packages/backend/
├── src/
│   ├── api/            # HTTP & WebSocket API definitions
│   ├── config/         # Environment and settings loaders
│   ├── sqlite/         # Schema and migration logic
│   ├── utils/          # Helper functions
│   ├── backend-server.ts  # HTTP/WebSocket server implementation
│   ├── backend-relayer.ts # Task scheduler and data aggregator
│   └── start.ts        # Entry point wiring server + relayer
├── data/               # Runtime database and log files
├── build/              # Compiled outputs for production
├── test/               # Vitest test suites organized by feature
└── package.json        # Scripts, dependencies, and build setup
```

## Core Components

- **API Server** (`src/backend-server.ts`): serves REST (`/ping`, `/info`, `/download`, `/upload`) and WebSocket RPC. Serves static frontend build.
- **Backend Relayer** (`src/backend-relayer.ts`, `src/start.ts`): uses Cron via `croner` and audit-log subscriptions to enqueue data tasks (balances, prices, net worth).
- **Database** (`src/sqlite/`): initializes and migrates SQLite database; defines interfaces in `src/interfaces.ts`.
- **Utilities** (`src/utils/`, `src/backend-comms.ts`): config parsing, throttling, file upload/download handlers, and inter-process messaging.
- **Configuration** (`src/server-env.ts`, `src/settings.ts`): loads environment variables (PORT, APP_VERSION, GIT_HASH, GIT_DATE) and default settings (throttle durations, data dirs).

## API Endpoints

- **HTTP**
  - `GET /ping` → `pong`
  - `GET /info` → build metadata (version, commit, build date)
  - `GET /download` & `POST /upload` → file operations for account backups
  - `OPTIONS /*` → CORS preflight
  - Static file serving from frontend build
- **WebSocket RPC**
  - Dynamic method invocation: send `{ id, method, params }`, receives `{ id, result }` or error.
  - Supports callback functions via `FunctionReference` messages.

## Database

- Uses SQLite via `sqlite3` (Node.js) and `sqlite` (Bun) packages.
- Database files located under `packages/backend/data/databases/`.
- Schema and migrations defined in `src/sqlite/`; initialized on startup.
- Data access via typed interfaces (`src/interfaces.ts`).

## Configuration

- Environment variables:
  - `PORT` (default 4001 dev, 5555 prod)
  - `APP_VERSION`, `GIT_HASH`, `GIT_DATE` (populated from git/npm)
  - `DATA_LOCATION` (overrides default data directory)
  - `BUN_SQL`, `GITHUB_CI` (test flags)
- Settings file: `src/settings.ts` defines throttle durations and cron schedule.

## Development

Prerequisites: Node.js v20+, Bun, Yarn.

```sh
yarn             # install dependencies
yarn build       # compile TypeScript & build frontend
yarn dev         # runs backend (watch) + relayer
```

## Testing

```sh
yarn test        # run Vitest (Node SQLite)
yarn test:bun    # run Bun-specific SQLite tests
yarn test:ci     # CI mode (Node + Bun)
```

Tests located in `packages/backend/test/` organized by feature (e.g., `balances`, `tags`, `bun`).

## Deployment

```sh
# build production bundle
yarn build
# Docker image build & run (from packages/backend)
yarn docker:build
yarn docker:run
yarn docker:remove
```

In Electron, backend is started automatically on app launch.
