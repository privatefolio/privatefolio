# AGENTS.md

## Project Overview
Privatefolio is a monorepo investment portfolio manager built with Lerna, featuring a React frontend, Node.js/Bun backend, and Electron desktop app.

## Required Reading
Before making any changes, read these files:
- `README.md` - Project overview and setup
- `CONTRIBUTING.md` - Development guidelines and workflow
- `docs/ARCHITECTURE.md` - System architecture
- `docs/BACKEND.md` - Backend implementation details
- `docs/FRONTEND.md` - Frontend implementation details
- `docs/TESTING.md` - Testing guidelines

## Monorepo Structure
This is a Lerna monorepo with Yarn workspaces:
- `packages/frontend/` - React application (Vite + TypeScript)
- `packages/backend/` - Node.js/Bun API server (Express + SQLite)
- `packages/electron/` - Desktop app wrapper (Electron)

## Development Commands
Always use Lerna for package management:
```bash
# Install dependencies
yarn

# Build all packages
yarn build

# Run tests
yarn test

# Run type checking
yarn check-types

# Run linting
yarn lint

# Fix linting issues
yarn lint:fix
```

## Package-Specific Commands
Use Lerna scoped commands:
```bash
# Run command in specific package
lerna run --scope [package-name] [command]

# Examples:
lerna run --scope privatefolio-frontend dev
lerna run --scope privatefolio-backend test
```

## Code Style & Conventions
- Use TypeScript for all new code
- Follow Prettier configuration in `.prettierrc`
- Run ESLint before committing
- Use conventional commit messages
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable and function names
- Add JSDoc comments for public APIs

## Testing Requirements
- Write tests for all new features
- Maintain test coverage above 80%
- Use Vitest for unit tests
- Test both Node.js and Bun environments for backend
- Run all tests before committing

## Git Workflow
- Create feature branches from `main`
- Use conventional commit format: `type(scope): description`
- Squash commits before merging
- All commits must pass CI checks

## Programmatic Checks
After making any changes, run these validation steps:

1. **Type Check**: `yarn check-types`
2. **Lint**: `yarn lint`
3. **Test**: `yarn test`
4. **Build**: `yarn build`

All checks must pass before considering the work complete.

## Important Notes
- **DO NOT** run `yarn dev` (development script should not be used in automated environments)
- Use `yarn dev:electron` for full development environment
- Database files are in `packages/backend/data/`
- Frontend build outputs to `packages/frontend/build/`
- Backend build outputs to `packages/backend/build/`

## File Locations
- Main package.json: `./package.json`
- Backend source: `packages/backend/src/`
- Frontend source: `packages/frontend/src/`
- Electron main: `packages/electron/src/`
- Documentation: `docs/`
- Scripts: `scripts/`

## Dependencies
- Node.js 20+ required
- Yarn 1.22.22 (specified in packageManager)
- Bun runtime for backend optimization
- Electron for desktop packaging

## PR Message Guidelines
When creating pull requests:
- Use clear, descriptive titles
- Reference any related issues
- Include testing steps
- Mention breaking changes
- Add screenshots for UI changes
- Ensure all programmatic checks pass

## Common Tasks
- **Add new dependency**: Use `yarn workspace [package-name] add [package]`
- **Update version**: Use `yarn new-version` (Lerna versioning)
- **Generate documentation**: Use `yarn generate-llms-txt`
- **Docker operations**: Use `yarn docker:build`, `yarn docker:run`, `yarn docker:remove`

## Troubleshooting
- If Lerna fails, check `lerna.json` configuration
- If TypeScript fails, check `tsconfig.json` in each package
- If tests fail, check test configuration in `packages/*/test/`
- If build fails, ensure all dependencies are installed with `yarn`
