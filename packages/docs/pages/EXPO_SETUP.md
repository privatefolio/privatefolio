## Privatefolio Expo (Mobile) Setup

This document explains how to run, build, and publish the Privatefolio mobile app powered by Expo.

### Overview
- The mobile app currently wraps the hosted web app in a React Native `WebView` and provides a native shell for distribution on iOS/Android. Native features can be layered in incrementally.
- Source lives in `packages/expo` and uses Expo SDK 53, React 19, React Native 0.79.

### Project Layout
- `packages/expo/package.json`: scripts and dependencies
- `packages/expo/eas.json`: EAS build/submit profiles
- `packages/expo/app.json`: Expo config (name, icons, Android package, splash, plugin config)
- `packages/expo/app/index.tsx`: App entry using `WebView` pointing to `https://privatefolio.app`

### Prerequisites
- Node.js 20+
- Yarn 1.x (workspaces)
- Expo tooling: you can use `npx expo` without a global install
- For EAS builds: `eas-cli` (`yarn` will install it locally) and an Expo account (`eas login`)

### Install Dependencies
From the repository root:

```bash
yarn
```

### Run in Development
You can run from the workspace root using Yarn workspaces or by `cd` into the package.

Option A (from root, via workspace):
```bash
yarn workspace privatefolio-expo dev
```

Option B (inside the package):
```bash
cd packages/expo
yarn dev            # starts Expo with a tunnel
# or
yarn dev:android    # open Android emulator/device
yarn dev:ios        # open iOS simulator (macOS)
yarn dev:web        # run via web target
```

Notes:
- First run will prompt you to open the app on a device/simulator or a browser.
- If Metro cache causes issues, restart with `npx expo start -c`.

### What the App Does (Today)
`packages/expo/app/index.tsx` renders a `WebView` pointing to `https://privatefolio.app` with sensible defaults (loading spinner, storage enabled, mixed content compatibility for charts, etc.). This enables a fast mobile presence while preserving the web UI. The `app.json` sets the deeplink scheme to `privatefolio` for future use.

### Configuration Reference

- `package.json` (scripts & deps)
  - `dev`, `dev:android`, `dev:ios`, `dev:web`
  - EAS: `build:*`, `submit:*`, `publish`
  - Key deps: `expo`, `expo-router`, `react-native-webview`, `@react-navigation/native`

- `app.json` (Expo config)
  - Name/slug: `Privatefolio` / `privatefolio`
  - Scheme: `privatefolio` (deeplinks like `privatefolio://`)
  - Android: package `xyz.privatefolio.mobile`, edge-to-edge enabled, adaptive icon
  - Web: uses `metro` bundler, static output for previews
  - Plugins: `expo-router`, `expo-splash-screen`

- `eas.json` (EAS profiles)
  - `build.production`: auto-increment version, caching enabled
  - `submit.production.android`: uses `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` for Play Store submission, track `production`

### Building with EAS
Login once (only needed on a new environment):
```bash
npx eas login
```

Build commands (run from repo root or `packages/expo`):
```bash
yarn workspace privatefolio-expo build:android
yarn workspace privatefolio-expo build:ios
```

Artifacts are created on EAS servers; the CLI will provide download/install links.

### Submitting to Stores
Android (requires a Google Cloud service account JSON with Play Console access):
```bash
export GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/absolute/path/to/google-service-account.json
yarn workspace privatefolio-expo submit:android
```

iOS submission requires App Store Connect credentials and an Apple Developer account:
```bash
yarn workspace privatefolio-expo submit:ios
```

You can chain build+submit via:
```bash
yarn workspace privatefolio-expo publish
```

### App Identity and Linking
- Android package: `xyz.privatefolio.mobile`
- Deeplink scheme: `privatefolio://` (reserved for future native navigation/deeplinks)
- If you add native navigation in the future, use `expo-linking` to handle incoming URLs and map them to screens.

### Permissions
The `WebView` enables geolocation and file access. If you add native geolocation or file pickers, declare platform permissions in `app.json` and follow Expo documentation for permissions prompts.

### Troubleshooting
- Clear Metro cache: `npx expo start -c`
- Kill stray Metro processes: close all `expo start` processes and restart
- Android emulator not detected: ensure Android Studio SDK tools and AVD are installed; run `adb devices`
- iOS simulator boot issues: open Xcode once and accept license; run `xcrun simctl list devices`

### Roadmap for Native Enhancements (Optional)
- Add account storage using secure storage modules
- Implement push notifications for balance alerts
- Integrate native share sheets and file import/export
- Use `expo-router` to progressively introduce native screens

### Notes
- This is a Yarn workspaces monorepo; prefer running scripts via `yarn workspace privatefolio-expo <script>` from the repo root.
- Do not run long-lived `start` scripts in CI; use EAS for cloud builds and local devices for development.
