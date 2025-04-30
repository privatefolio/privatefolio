Find the backend project inside the monorepo at `./packages/backend` and read its related files (e.g., package.json, README.md, config files and source code) to extract key details. Then write or rewrite [BACKEND.MD](../../docs/BACKEND.md) — delivering the most important insights in a compact manner. It should have the following structure:

# Privatefolio Backend

## Overview
- A brief paragraph summarizing the project’s purpose and its tech stack.

## Architecture
- A concise diagram or description of the backend’s architecture, including major modules and how they interact (API server, relayer, database, utilities).

## Directory Structure
- Outline the key folders and files under `packages/backend`, explaining their roles (e.g., `src/api`, `src/utils`, `test`).

## Core Components
- **API Server**: Entry point (`start.ts`), routing, controllers, and middleware.
- **Backend Relayer**: Scheduled tasks and data aggregation logic (`backend-relayer.ts`).
- **Database**: SQLite setup, schema management, and data access layers (`sqlite/`, `interfaces.ts`).
- **Utilities**: Helper modules for config, process management, and communication (`utils/`, `backend-comms.ts`).
- **Configuration**: Environment variables and settings (`server-env.ts`, `settings.ts`).

## API Endpoints
- List and briefly describe the main HTTP and WebSocket endpoints provided by the backend.

## Database
- Explain the use of SQLite for persistent storage, location of database files, and any migration or initialization logic.

## Configuration
- Document the required environment variables and configuration files, including defaults and overrides.

## Development
- Prerequisites (Node.js, Bun), installation (`yarn`, `yarn build`), and running in development mode (`yarn dev`).

## Testing
- How to run backend tests (`yarn test`, `yarn test:bun`), directory structure of tests, and any CI-specific test commands.

## Deployment
- Instructions for building and running the backend in production, including Docker commands and environment setup.

## Contributing
- Reference `CONTRIBUTING.md` and `ARCHITECTURE.md` for guidelines on contributing, code style, and project conventions.
