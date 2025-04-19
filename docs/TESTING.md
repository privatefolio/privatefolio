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

You can run package-specific tests from the root directory using Lerna:

```sh
# Run backend tests from root directory
yarn lerna run test --scope privatefolio-backend
yarn lerna test <test-file> --scope privatefolio-backend
```

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
