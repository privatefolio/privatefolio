Search the monorepo for testing-related files (e.g., test directories, test configuration files, CI workflows, package.json test scripts) to extract key testing information. Then create a comprehensive [TESTING.MD](../../docs/TESTING.md) — delivering actionable testing insights in a clear, organized manner. It should have the following structure:

# Privatefolio Testing Guide

## Testing Philosophy
- A concise paragraph explaining the project's testing approach, coverage goals, and quality standards.

## Testing Tools & Frameworks
- **Core Testing Stack:** Overview of primary testing frameworks, assertion libraries, and mocking tools used.
- **Package-specific Tools:** Any specialized testing tools used in specific packages.

## Test Types & Organization
For each major package (Frontend, Backend, Electron):
- **Test Directory Structure:** How tests are organized and what pattern they follow.
- **Test Categories:** Types of tests implemented (unit, integration, e2e, etc.) with brief descriptions.
- **Key Test Fixtures & Mocks:** Overview of important test data, fixtures, and common mocks.

## Running Tests
- **Common Commands:** Step-by-step instructions for running different types of tests.
- **Package-specific Commands:** Any specialized commands needed for specific packages.
- **Testing in Watch Mode:** Instructions for development-time testing.
- **Debugging Tests:** Tips for troubleshooting and debugging failing tests.

## CI/CD Integration
- How testing is integrated into the CI/CD pipeline.
- Required coverage thresholds (if applicable).
- Performance benchmarks and requirements.

## Best Practices
- Testing patterns developers should follow when contributing.
- Common pitfalls to avoid.
- Guidelines for writing effective tests in this codebase.

Focus on providing practical, actionable guidance with concrete examples from the codebase.
