# Architecture

## Overview

The application has two main components: `@privatefolio/backend` and `@privatefolio/frontend`.
These two components are bundled together as a Docker image, or as a desktop app using Electron.

The frontend is a React application, and the backend is a Node.js/Bun server that uses REST and WebSocket APIs to communicate with the frontend.

## Project structure

Privatefolio is structured as a monorepo, using Lerna for orchestration and Yarn for package management.

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
