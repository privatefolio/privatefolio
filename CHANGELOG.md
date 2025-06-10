# Changelog

Changes to this project will be documented in this file.
Versioning is based on [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v2.0.0-beta.1 - 2025/06/10

This release has breaking changes and is not compatiable with the previous `alpha` versions! 🚨🚨🚨

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
