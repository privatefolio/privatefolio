---
description: Release history and version changes for Privatefolio
---

# Changelog

This file documents project changes that are of interest to users and developers.
Versioning is based on [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v2.0.0-beta.46 - 2025/09/09

### 🐛 Bug Fixes

- Fix bug in desktop app deployment workflow
- Fix bug in mobile app deployment workflow

## v2.0.0-beta.45 - 2025/09/09

### 💡 Feature updates

- Add a [new docs website](https://docs.privatefolio.app) for users & developers
- Deploy first version of the Android app

## v2.0.0-beta.44 - 2025/08/25

### 💡 Feature updates

- Add support for PrivateCloud™ AI Gateway

### 🐛 Bug Fixes

- Fix bug in coinstats file import

## v2.0.0-beta.43 - 2025/08/21

### 🐛 Bug Fixes

- Fix bug in coinstats file import
- Fix UI bug with the app header

### Other updates

- Improve error handling on the frontend

## v2.0.0-beta.42 - 2025/08/20

### 💡 Feature updates

- Improve server status visibility

### 🐛 Bug Fixes

- Fix issue in the Mac app for x64 architecture

## v2.0.0-beta.41 - 2025/08/14

### 🐛 Bug Fixes

- Fix bug with service worker registration (push notifications)

## v2.0.0-beta.40 - 2025/08/14

### 💡 Feature updates

- Add coinstats extensions
- Improve `Server logs` page
- Add `Server health` page

### Other updates

- Track and report errors through telemetry
- Improve error logging
- Improve backend bundle
- Fix bug in help sections
- Improve number formatting
- Extract common logic in the `commons` and `commons-node` libraries (packages)

## v2.0.0-beta.37 - 2025/08/04

### 🐛 Bug Fixes

- Fix bug with `AppLink`

## v2.0.0-beta.36 - 2025/08/04

### 🐛 Bug Fixes

- Fix bug with `randomUUID()`

## v2.0.0-beta.35 - 2025/07/28

### 🐛 Bug Fixes

- Fix bug in assets sql table

## v2.0.0-beta.34 - 2025/07/23

### 💡 Feature updates

- Soft-launch the Binance connection

## v2.0.0-beta.33 - 2025/07/21

### 💡 Feature updates

- Add Import data wizard
- Improve PlatformPage

## v2.0.0-beta.32 - 2025/07/17

### 💡 Feature updates

- Improve experience for adding manual transactions

### Other updates

- New `WalletInput`, `PlatformInput` and `AssetInput` components for extension developers

## v2.0.0-beta.31 - 2025/07/15

### 🐛 Bug Fixes

- Fix window buttons in the Mac app
- Fix copy & paste in the Mac app
- Fix tray icon in the Mac app

## v2.0.0-beta.30 - 2025/07/13

### 🐛 Bug Fixes

- Fix start-up issue in the Mac app

## v2.0.0-beta.29 - 2025/07/13

### 🐛 Bug Fixes

- Fix an issue with Reset Account

## v2.0.0-beta.28 - 2025/07/13

### 🐛 Bug Fixes

- Fix an issue with Delete Account

### Other updates

- Improve documentation for developers and AI agents

## v2.0.0-beta.27 - 2025/07/12

### 🐛 Bug Fixes

- Fix start-up issue in desktop apps

## v2.0.0-beta.25 - 2025/07/12

### 💡 Feature updates

- Notarization for the macOS app
- Improve `fetchDailyPrices` to not go into the past further than needed
- Add support for snap packages on Linux

### 🐛 Bug Fixes

- Fix binance file imports
- Fix trade calculation for binance data
- Fix bug with authorization in `/download` and `/upload` endpoints

## v2.0.0-beta.19 - 2025/07/09

### 💡 Feature updates

- Code-signing for the macOS app

## v2.0.0-beta.18 - 2025/07/08

### 💡 Feature updates

- Improve UI UX across the app, in particular for the desktop apps
- Add new chart intervals: 3D (3 days), M (1 month)
- Add new tooltip for candlestick charts
- Add support for Claude 4 Opus, Claude 4 Sonnet, Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Haiku

## v2.0.0-beta.15 - 2025/07/06

### 🐛 Bug Fixes

- Fix issue with `kioskMode` introduced in `v2.0.0-beta.14`

## v2.0.0-beta.14 - 2025/07/06

### 💡 Feature updates

- Give tools (like reading user balances) to the AI Assistant, alongside Reasoning and Web search
- Add Anthropic and Perplexity as AI providers, alongside OpenAI

### 🐛 Bug Fixes

- Fix bug in cursor invalidations
- Fix bug in self hosted deployments regarding the port

### Other updates

- Better error message when the server is unreachable
- Add new `readSql` method, useful in kiosk mode

## v2.0.0-beta.11 - 2025/07/03

### 💡 Feature updates

- Auto-updates for the Windows and Linux apps

## v2.0.0-beta.8 - 2025/07/01

### 💡 Feature updates

- Add support for 26 more blockchains with the Etherscan extension
- Add a mini nav menu for tablets and laptops
- Improve user experience around connections: new `All platforms` option
- Add a new action `Verify balances` which checks if the on-chain data reflects the app data
- Allow adding of manual transactions
- Add `Recent` section in search bar
- Add a checkmark for the exchanges and blockchains supported by our extensions

### 🐛 Bug Fixes

- Fix truncation on `AmountBlock`
- Fix refresh trades

### Other updates

- Speed up daily price retrieval with database indexes
- Add platform categories to avoid conflicts on unique coingecko ids
- Add a new page to chat with OpenAI models (next step is to give them tools)

## v2.0.0-beta.7 - 2025/06/22

### 🐛 Bug Fixes

- Fix a bug in telemetry

## v2.0.0-beta.6 - 2025/06/20

### 💡 Feature updates

- Improve UI UX for mobile devices.

### 🐛 Bug Fixes

- Fix bug when time traveling through trades

## v2.0.0-beta.5 - 2025/06/20

### 💡 Feature updates

- Split app bundle into multiple files to improve loading performance.

### 🐛 Bug Fixes

- Fix bug in `ExtensionPage` where the help (How to use) section was not rendering at all.

## v2.0.0-beta.4 - 2025/06/20

### 💡 Feature updates

- New `Pro Chart` feature, allowing users to use advanced tradingview features like drawing tools, indicators, etc.
- New `Deposits` feature, allowing users to view their historical deposits and withdrawals.
- Improve search bar to highlight assets and platforms from the user's portfolio.
- Improve mobile UI/UX and responsiveness across the app.

## v2.0.0-beta.3 - 2025/06/18

### 💡 Feature updates

- New `Kiosk` setting, to make your portfolio public in a read-only fashion.
- New `Trades` feature, allowing users to view their trades (including their cost basis, deposits, withdrawals, etc)
- New `PnL` (profit & loss) feature, allowing users to view historical PnL on trades and on their whole account.
- Shortcuts for navigating between pages

### 🐛 Bug Fixes

- Fix app routing for accounts (local & cloud)

## v2.0.0-beta.2 - 2025/06/11

### 💡 Feature updates

- Added Alchemy price API extension for better price data coverage
- Added kiosk mode for public portfolio displays
- Added support for searching assets by contract address
- Added a data source selector to the asset price history chart

### 🐛 Bug Fixes

- Fixed critical bugs in Alchemy & Coinbase price APIs
- Fixed bug in refreshing prices
- Fixed bug reading non-existent files
- Fixed UI glitch when deleting the last account
- Fixed bug in asset table: changing the price api back to auto failed

## v2.0.0-beta.1 - 2025/06/10

This release has breaking changes and is not compatible with the previous `alpha` versions! 🚨🚨🚨

### 💡 Feature updates

- New `Extensions` page, allowing developers and users to discover extensions.
- New `Platforms` page, allowing users to discover exchanges and blockchains.
- Rewritten Coingecko integration, supporting all their assets, exchanges and blockchains in a seamless way.

## v2.0.0-alpha.30 - 2025/05/23

This release concludes the alpha phase of the v2.0.0 release cycle, marking a significant milestone in the development of the application.

### 💡 Feature updates

- You can now crete cloud account through PrivateCloud™.
- Payments are now live for the premium plan of the cloud service.
- New `Logs` tab in the Server page, allowing users to view server logs directly in the application.
- New `Settings` tab in the Server page, allowing users to configure server settings directly in the application.
- Automatic updates for the Windows app, allowing users to stay up-to-date without manually installing new versions.

### 🐛 Bug Fixes

- Fix the start on login feature on Linux.
- Reading from the database happens on a separate thread now, improving performance and responsiveness when there is a write operation in the background.
- Backup & restore functionality been rewritten to be more robust and user-friendly.

### Other updates

- Comprehensive project documentation for developers and AI agents.
- Improved developer experience for Linux and Windows developers.
- Using the app now requires a one-time password setup. This protects user data from unauthorized access, especially in cloud or self-hosting deployments.

## v2.0.0-alpha.0 - 2025/03/19

### 💡 Feature updates

- Migrate database engine from no-sql (PouchDB) to sql (SQLite).
- Implement client-server architecture (prerequisite for Cloud deployments), unfortunately this breaks full in-browser support (for the time being).
- Package the app & server as a desktop application that can run in the background (Windows, Linux & macOS).

## v0.2.0 - 2024/03/10

### 💡 Feature updates

- Better mobile support for Navigation and Settings.
- Improved UI/UX for data tables (especially loading)

---

## v0.1.0 - 2024/03/02

### 💡 Feature updates

- Parallelize Price API requests in `daily-prices-api` to improve performance 4-6 times.
- Add a new historical prices provider: [Redstone](https://redstone.finance/).
- Show the USD value of amounts in `TransactionDrawer` and `AuditLogDrawer`.

### 🐛 Bug Fixes

- Fix `TaskDetailsDialog` to show the previous progress percentage for updates that have the format
  `[undefined, string]`, indicating that the progress remained the same, but a new.
