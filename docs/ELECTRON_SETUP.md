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
4. Platform-specific installers are created (`yarn build-bin:win`, `yarn build-bin:linux`, `yarn build-bin:mac`)

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
yarn build-bin:win
yarn build-bin:linux
yarn build-bin:mac
```

The build process creates platform-specific installers:
- Windows: Squirrel installer (.exe)
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
