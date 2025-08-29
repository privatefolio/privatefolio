# Privatefolio
  
Privatefolio is a monorepo investment portfolio manager built with Lerna, featuring a React frontend, Node.js/Bun backend, and Electron desktop app.

As an agent, follow these rules:
- Never run the `start` or `dev` scripts because these are long-lived processes that should be run in the background.
- To test that something works, run the `test` script or the `build` script.

Now, the project documentation, all concatenated below.

## AI.md

# Privatefolio AI Usage Guide

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


---

## ARCHITECTURE.md

# Privatefolio Architecture

## Overview
Privatefolio is a free, open-source cryptocurrency portfolio manager built as a monorepo using Lerna for package management. It enables users to track all their crypto assets in one place with a focus on privacy and data ownership. The application is structured as a desktop app with a React frontend and a Node.js/Bun backend, packaged with Electron for cross-platform compatibility.

## Structure
- **Root Config:** Yarn workspaces (v1.22.22) with nohoist, AGPL-3.0 license, Lerna (v8.1.3) for monorepo management, and TypeScript for type safety across all packages.

## Packages Summary

- **`packages/frontend`**
  - **Description & Key Tech:** React-based UI that provides the user interface using Material-UI, Vite, and TypeScript.
  - **Core Features & Tools:**
    - Interactive portfolio visualization with lightweight-charts
    - Command palette (`kbar`) and comprehensive search functionality
    - WebWorker-based SQLite integration for client-side data processing
    - State management with nanostores for reactive updates

- **`packages/backend`**
  - **Description & Key Tech:** Node.js/Bun server providing data processing, API integration, and SQLite database management.
  - **Core Features & Tools:**
    - Multi-chain cryptocurrency data aggregation and processing
    - SQLite database for persistent storage with cross-platform compatibility
    - Scheduled tasks with Croner for periodic data updates
    - Support for both Bun and Node.js SQLite implementations

- **`packages/electron`**
  - **Description & Key Tech:** Desktop application wrapper using Electron with platform-specific optimizations.
  - **Core Features & Tools:**
    - Cross-platform desktop integration (Windows, Linux, macOS)
    - Local file system access for database and configuration
    - Auto-launch capabilities and system tray integration
    - Inter-process communication between frontend and backend

## Workflow & Integration
- **Development:** `yarn dev` runs parallel development servers for frontend and backend, `yarn dev:electron` includes Electron.
- **Building:** `yarn build` for all packages, platform-specific binaries with `yarn bundle:[win|linux|mac]`.
- **Testing:** Comprehensive test suite with `yarn test` and `yarn test:bun` for Bun-specific tests, continuous integration with `yarn test:ci`.
- **Integration:** Packages share common TypeScript interfaces and utilities, with backend exposing APIs consumed by frontend.

## Deployment
- **Frontend:**
  - Compiled with Vite for optimal bundle size and performance
  - Can be deployed as a static site or packaged within Electron

- **Backend:**
  - Runs as a local service within the Electron app
  - Optimized for Bun runtime with fallbacks for Node.js compatibility

- **Electron:**
  - Windows builds with Nsis installer, Linux with DEB packages, macOS with DMG
  - Automated deployment process via GitHub Actions triggered by version changes (`yarn new-version`)
  - Binaries published to GitHub releases for user distribution


---

## BACKEND.md

# Privatefolio Backend

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

## Directory Structure
```
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

## Contributing
See [CONTRIBUTING.md](../CONTRIBUTING.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for guidelines on code style, testing, and pull request workflow.


---

## DOCKER_BUILD.md

# Running Privatefolio using Docker

This document explains how to use Docker to run Privatefolio.
The Docker image uses a multi-stage build process. It builds the frontend bundle and installs backend production dependencies.
The final image utilizes Bun to serve the compiled JavaScript build of the backend and the pre-built frontend bundle.

## Requirements

- [Docker](https://docs.docker.com/get-docker/)

## Building and Running

### Using npm/yarn scripts

From the root directory, you can use the following scripts:

```sh
# Build the Docker image
yarn docker:build

# Build and run the Docker container
yarn docker:run

# Remove the Docker container
yarn docker:remove
```

### Using Docker Directly

To build the image from the project root directory:

```sh
docker build -t privatefolio -f packages/backend/Dockerfile .
```

To run the container:

```sh
docker run -d -p ${PORT:-5555}:${PORT:-5555} -v privatefolio-data:/app/data --name privatefolio privatefolio
```

To stop the container:

```sh
docker stop privatefolio
```

### Using Pre-built Images from GitHub Container Registry

Pre-built Docker images are available on GitHub Container Registry:

```sh
docker pull ghcr.io/privatefolio/privatefolio:latest
```

To run the pre-built image:

```sh
docker run -d -p ${PORT:-5555}:${PORT:-5555} -v privatefolio-data:/app/data --name privatefolio ghcr.io/privatefolio/privatefolio:latest
```

## Configuration

The backend service is configured with the following environment variables, set during the Docker build process or runtime:

- `PORT`: The port to run the server on (default: 5555)
- `NODE_ENV`: The environment to run in (default: production)
- `DATA_LOCATION`: The directory to store data in (default: /app/data)
- `APP_VERSION`: The application version (set via build arg `APP_VERSION_ARG`)
- `GIT_HASH`: The git commit hash (set via build arg `GIT_HASH_ARG`)
- `GIT_DATE`: The git commit date (set via build arg `GIT_DATE_ARG`)

You can customize `PORT` and `NODE_ENV` at runtime by passing them to the `docker run` command with the `-e` flag:

```sh
docker run -d -p 5000:5000 -v privatefolio-data:/app/data -e PORT=5000 -e NODE_ENV=development --name privatefolio privatefolio
```
Note: `APP_VERSION`, `GIT_HASH`, and `GIT_DATE` are baked into the image during build and typically aren't overridden at runtime.

## Data Persistence

All data is stored in the `/app/data` directory inside the container, which is mounted to a named volume called `privatefolio-data`. This ensures that your data is persisted even if the container is stopped or removed.

To backup your data, you can use the Docker volume commands:

```sh
docker volume inspect privatefolio-data # View volume info
```

## Accessing the API

The backend API will be available at (defaulting to port 5555 if PORT is not set):

- HTTP: `http://localhost:${PORT:-5555}`
- WebSocket: `ws://localhost:${PORT:-5555}`

You can check if the service is running by visiting `http://localhost:${PORT:-5555}` in your browser or using curl:

```sh
curl http://localhost:${PORT:-5555}
```

## Logs

To view logs from the container:

```sh
docker logs privatefolio
```

To follow the logs in real-time:

```sh
docker logs -f privatefolio
```

## Continuous Integration

A GitHub Actions workflow is set up to automatically build and publish Docker images to GitHub Container Registry (GHCR) on each push to the main branch and on tag creation. The workflow file is located in `.github/workflows/docker-publish.yml`. It passes build arguments like version and git info to the Docker build.

Available image tags:
- `latest`: Latest build from the main branch
- `v*.*.*`: Tagged releases (e.g., v2.0.0-alpha.5)
- `sha-******`: Short commit SHA for each build


---

## DOCKER_DEPLOY.md

# Deploying Privatefolio using a Docker image

This document provides instructions on how to deploy Privatefolio using Docker, including examples for direct Docker usage and deployment via Fly.io.

## 1. Docker Deployment

Deploying with Docker utilizes the pre-built container images available on GitHub Container Registry (GHCR). This method encapsulates the application and its dependencies.
Alternatively, you can build the image locally using the [Docker Build documentation](DOCKER_BUILD.md).

### Prerequisites

- Docker installed

### Steps

1.  **Pull the Image:**
    ```sh
    docker pull ghcr.io/privatefolio/privatefolio:latest
    ```

2.  **Run the Container:**
    ```sh
    docker run -d \
      -p ${PORT:-5555}:5555 \
      -v privatefolio-data:/app/data \
      --name privatefolio \
      ghcr.io/privatefolio/privatefolio:latest
    ```
    - `-d`: Run in detached mode.
    - `-p ${PORT:-5555}:5555`: Map the host port (default 5555) to the container port 5555. Adjust the host port if needed.
    - `-v privatefolio-data:/app/data`: Mount a named volume `privatefolio-data` to `/app/data` inside the container for persistent data storage.
    - `--name privatefolio`: Assign a name to the container.

3.  **Configuration:**
    Environment variables like `PORT` and `DATA_LOCATION` can be passed using the `-e` flag in the `docker run` command. Note that `DATA_LOCATION` inside the container defaults to `/app/data`, which is already mapped to the volume.

    ```sh
    docker run -d \
      -p 5000:5000 \
      -e PORT=5000 \
      -v privatefolio-data:/app/data \
      --name privatefolio \
      ghcr.io/privatefolio/privatefolio:latest
    ```

For more detailed information on building the image locally, managing data, and accessing logs, refer to the [Docker Build documentation](DOCKER_BUILD.md).

## 2. Fly.io Deployment

Fly.io allows deploying containerized applications globally. Privatefolio includes a `fly.toml` configuration file for easy deployment on this platform using its Docker image.

### Prerequisites

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- A Fly.io account ([Sign up](https://fly.io/))

### Steps

1.  **Login to Fly.io:**
    ```sh
    fly auth login
    ```

2.  **Launch the App (First Time):**
    Navigate to the root directory of the Privatefolio repository where `fly.toml` is located. Run:
    ```sh
    fly launch --no-deploy
    ```
    - You will be asked if you wish to copy this configuration file to the new app. Answer `y` (yes).
    - This command reads the `fly.toml` file and sets up the application on Fly.io based on the configuration.
    - `--no-deploy`: We skip the initial deploy because we want to ensure the volume is created first.

3.  **Create a Persistent Volume:**
    The `fly.toml` specifies a volume mount for data persistence. Create the volume before the first deploy:
    ```sh
    fly volumes create privatefolio_data --size 1
    ```
    - `--size 1`: Specifies the volume size in GB (1 GB is usually sufficient to start).
    - You will be prompted to choose a region for the volume. Select the same region as your app for optimal performance.

4.  **Deploy the App:**
    ```sh
    fly deploy
    ```
    - This command uses the pre-built image specified in `fly.toml` from GHCR and deploys it to the Fly.io platform.
    - It respects the settings in `fly.toml`, including environment variables (`PORT=5555`), volume mounts (`privatefolio_data` to `/data`), and service configuration (HTTP service on the internal port).

### Subsequent Deployments

To deploy updates, simply run:
```sh
fly deploy
```
Fly.io will pull the latest `:latest` image from GHCR (or rebuild if configured differently) and deploy the new version.

### Accessing the Deployed App

After deployment, `fly deploy` will output the public URL for your application (e.g., `https://privatefolio.fly.dev`). The API will be available at this URL.

### Monitoring and Logs

Use `flyctl` to manage your deployed app:
- **Logs:** `fly logs -a <your-app-name>`
- **Status:** `fly status -a <your-app-name>`


---

## ELECTRON_SETUP.md

# Electron Setup

This document describes the Electron setup for the Privatefolio desktop application.

## Overview

Privatefolio uses Electron to package and distribute the frontend as a desktop application. The Electron setup is located in the `packages/electron` directory and is built using Electron Forge.

## Project Structure

```
packages/electron/
├── build/            # Output directory for compiled TypeScript
├── out/              # Output directory for packaged app
├── src/              # Source code
│   ├── api.ts        # API definitions
│   ├── backend-manager.ts  # Backend process manager
│   ├── ipc-main.ts   # IPC communication setup
│   ├── preload.ts    # Preload script for renderer
│   ├── start.ts      # Main entry point
│   └── utils.ts      # Utility functions
├── forge.config.js   # Electron Forge configuration
├── package.json      # Package configuration
└── tsconfig.json     # TypeScript configuration
```

## Main Components

### Entry Point (`start.ts`)

The main entry point for the Electron app handles:
- Window creation and configuration
- System tray setup
- Development reloading (when not in production)
- Custom title bar configuration
- App lifecycle management
- Starting and stopping the backend server

### Backend Manager (`backend-manager.ts`)

Manages the backend server process:
- Starting the backend server when the app starts
- Keeping the backend running when the app is minimized to tray
- Stopping the backend server when the app is closed
- Provides methods to check if the backend is running
- Handles backend server port management

### IPC Communication (`ipc-main.ts`)

Handles communication between the main and renderer processes:
- Notifications
- Theme mode switching
- Log directory access
- Log reading
- Backend server management (getting URL, checking status, restarting)

### Preload Script (`preload.ts`)

Exposes a secure API to the renderer process via the contextBridge:
- Notification sending
- Log access
- Platform information
- Theme mode switching
- Backend server operations (getting URL, checking status, restarting)

## Build Process

The application uses Electron Forge for packaging and distribution:

1. TypeScript is compiled to JavaScript (`yarn build`)
2. Icons are generated from source images (`yarn gen-icons`)
3. The app is packaged with Electron Forge (`yarn package`)
4. Platform-specific installers are created (`yarn bundle:win`, `yarn bundle:linux`, `yarn bundle:mac`)

## Development

To start the development environment:

```bash
yarn dev
```

This command:
1. Compiles TypeScript in watch mode
2. Starts Electron with hot reloading enabled
3. Starts the backend server automatically

## Production Builds

To create production builds:

```bash
# Build for development
yarn build

# Create production installers
yarn bundle:win
yarn bundle:linux
yarn bundle:mac
```

The build process creates platform-specific installers:

- Windows: Nsis installer (.exe)
- macOS: ZIP archive
- Linux: DEB and RPM packages

## Configuration

The application uses `electron-forge` for building and packaging, with configuration in `forge.config.js`. Key configurations include:

- Custom app icons
- App metadata
- Build targets per platform
- Dependency inclusion rules

## Backend Integration

The Electron app integrates with the Privatefolio backend server:

1. In production, the backend server is started automatically when the app starts
2. In development, the backend server is started separately by lerna, not by the Electron app
3. The backend continues running when the app is minimized to tray
4. The backend is gracefully stopped when the app is closed (in production)
5. The frontend communicates with the backend via HTTP/WebSocket on localhost
6. Different ports are used in development (4001) and production (5555)

### Development Setup

In development mode:
- The backend server is started by lerna through the `yarn dev` command in the root directory
- The Electron app connects to this already-running backend server
- The backend runs on port 4001

### Production Setup

In production mode:
- The backend server is started by the Electron app itself
- The backend process is managed by the BackendManager
- The backend runs on port 5555

### Backend API Access

The frontend can access backend functionality through the Electron preload API:

```typescript
// Get the backend URL (which includes the correct port based on environment)
const backendUrl = window.electron.backend.getUrl();

// Check if the backend is running
const isRunning = window.electron.backend.isRunning();

// Restart the backend if needed (only works in production)
await window.electron.backend.restart();
```


---

## FRONTEND.md

# Privatefolio Frontend

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
- Please read [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md) for guidelines on code style, testing, and workflow.


---

## TESTING.md

# Privatefolio Testing Guide

## Testing Philosophy

Privatefolio's testing approach focuses on maintaining high code quality and reliability through comprehensive test coverage across the monorepo's packages. The project emphasizes functional correctness, particularly in the backend services that handle critical financial data processing. Tests are designed to validate functionality at multiple levels, from unit to integration tests, with a preference for snapshot testing to prevent regressions. The project aims to ensure that all core functionality remains stable across updates and that new features are thoroughly tested before integration.

## Testing Tools & Frameworks

### Core Testing Stack

- **Vitest**: Primary testing framework used across the project, providing a Jest-compatible API with TypeScript support out of the box
- **Bun Test**: Used for specific SQLite compatibility tests that need to run in the Bun runtime
- **Snapshots**: Extensive use of inline snapshots for regression testing
- **CI Integration**: Tests run automatically as part of the GitHub Actions CI workflow

### Package-specific Tools

- **Backend**: 
  - Custom diff visualization configuration in `vitest.diff.ts`
  - Environment flags to enable/disable Bun SQLite testing (`BUN_SQL=true/false`)
- **Frontend**: 
  - Utilizes Vitest within the context of the Vite build system
- **Electron**: 
  - Limited direct testing, relies on the testing of its constituent parts in backend and frontend packages

## Test Types & Organization

### Backend Package

#### Test Directory Structure

The backend package has a well-organized test directory structure:

```
/test
  /__snapshots__/     # Generated snapshot files
  /assets/            # Tests for asset-related functionality
  /backend-relayer/   # Tests for the backend relayer service
  /backup/            # Tests for backup/restore functionality
  /balances/          # Tests for balance tracking
  /bun/               # Bun-specific tests for SQLite compatibility
  /connections/       # Tests for external API connections
  /daily-prices/      # Tests for price history functionality
  /database/          # Database-related tests
  /file-imports/      # Tests for file import functionality
  /files/             # File handling tests
  /networth/          # Net worth calculation tests
  /server-tasks/      # Server task processing tests
  /tags/              # Tag management tests
  /trades/            # Trade tracking tests
  /utils/             # Utility function tests
```

Tests follow a clear naming convention with `.test.ts` suffix for each test file.

#### Test Categories

- **Unit Tests**: Focused on testing individual functions and modules in isolation
- **Integration Tests**: Test the interaction between multiple components
- **SQLite Compatibility Tests**: Special tests that run in the Bun environment to ensure SQLite compatibility
- **API Tests**: Test the backend API endpoints functionality

#### Key Test Fixtures & Mocks

- Random account names generated per test run to ensure test isolation
- Test-specific transaction and audit log IDs
- Snapshot-based assertions for complex data structures

### Frontend Package

The frontend package uses Vitest for testing, though it has less extensive test coverage compared to the backend. Testing focuses primarily on utility functions and critical UI components.

### Electron Package

The Electron package does not have dedicated tests in its own directory. Functionality is primarily tested through the backend and frontend packages that it integrates.

## Running Tests

### Common Commands

To run all tests across the monorepo:

```sh
yarn test
```

For CI-specific test runs (including all test suites):

```sh
yarn test:ci
```

### Package-specific Commands


Or navigate to the specific package directory:

```sh
# For backend tests
cd packages/backend
yarn test                # Run standard tests (without Bun SQLite)
yarn test:bun            # Run Bun-specific SQLite tests
yarn test <test-file>    # Run a specific test file, e.g., yarn test test/tags/tags-api.test.ts
```

### Testing in Watch Mode

When developing, you can run tests in watch mode in the backend package:

```sh
cd packages/backend
yarn test --watch
```

This will rerun the tests automatically when files change.

### Debugging Tests

If tests fail, the output includes detailed error messages and diff comparisons. For snapshot test failures, you can update snapshots with:

```sh
yarn test -u
```

For more complex debugging scenarios:

1. Add `console.log` statements or use the `debug` option in Vitest
2. Run a specific test file to isolate the issue
3. Use `it.only` to run just one test case within a file

## CI/CD Integration

Testing is integrated into the Continuous Integration pipeline via GitHub Actions in the `.github/workflows/continuous-integration.yml` file.

The CI process:
1. Checks out the code
2. Sets up Node.js and Bun
3. Installs dependencies
4. Builds the project
5. Runs linting checks
6. Checks TypeScript types
7. Runs all tests in CI mode

Tests are a critical gate for accepting pull requests and merging code into the main branch.

## Best Practices

### Testing Patterns to Follow

1. **AAA Pattern**: Structure tests using the Arrange-Act-Assert pattern:
   ```typescript
   it("should create and retrieve tags", async () => {
     // arrange
     const tagNames = ["defi", "staking", "trading"]

     // act
     const tags = await upsertTags(accountName, tagNames)
     const allTags = await getTags(accountName)

     // assert
     expect(tags).toMatchInlineSnapshot(`...`)
     expect(allTags).toMatchInlineSnapshot(`...`)
   })
   ```

2. **Isolation**: Ensure tests are isolated by using random identifiers for account names and test data:
   ```typescript
   const accountName = Math.random().toString(36).substring(7)
   const transactionId = "test_transaction_" + Math.random().toString(36).substring(7)
   ```

3. **Descriptive Test Names**: Use descriptive `it()` statements that clearly indicate what's being tested

4. **Snapshots for Complex Data**: Use snapshots for testing complex data structures

### Common Pitfalls to Avoid

1. **Hard-coded Data**: Avoid hard-coded account names or IDs that could lead to test interference
2. **Global State**: Beware of tests that change global state without restoring it
3. **Time Dependencies**: Tests that rely on specific timestamps may be fragile
4. **Incomplete Assertions**: Ensure you're asserting all relevant aspects of the test result

### Guidelines for Writing New Tests

1. Place tests in the appropriate subdirectory based on functionality
2. Follow existing naming conventions: `feature-name.test.ts`
3. Use descriptive test names in the format "should do something"
4. Include tests for both success and failure cases
5. Use snapshots for complex data structures, but be careful not to overuse them
6. When adding new APIs, include tests for all endpoints and edge cases
7. Structure tests using the AAA pattern (Arrange-Act-Assert)
8. Add appropriate comments to explain test setup and assertions


---
