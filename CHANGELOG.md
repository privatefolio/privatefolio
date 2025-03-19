# Changelog

Changes to this project will be documented in this file.
Versioning is based on [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
