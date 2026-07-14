# Testing Guidelines

## Purpose

This document defines the testing principles and required conventions for the TODO application. The goal is to keep tests reliable, maintainable, and aligned with the project structure across the frontend, backend, and end-to-end layers.

## Core Principles

1. All new features should include appropriate tests.
2. Tests should validate user-facing behavior and important business logic, not just implementation details.
3. Tests must be maintainable, readable, and easy to update as the application evolves.
4. Tests must be isolated and independent so they can run in any order.
5. Test suites must succeed consistently across repeated runs in local and CI environments.

## Unit Tests

1. Unit tests must use Jest.
2. Unit tests should verify individual functions and React components in isolation.
3. Unit test files must use the naming convention `*.test.js` or `*.test.ts`.
4. Backend unit tests must be placed in `packages/backend/__tests__/`.
5. Frontend unit tests must be placed in `packages/frontend/src/__tests__/`.
6. Unit test file names should match the code under test when practical.
7. A file such as `app.js` should typically have a corresponding test file named `app.test.js`.

## Integration Tests

1. Integration tests must use Jest and Supertest.
2. Integration tests should verify backend API endpoints through real HTTP requests.
3. Integration tests must be placed in `packages/backend/__tests__/integration/`.
4. Integration test files must use the naming convention `*.test.js` or `*.test.ts`.
5. Integration test names should describe the API behavior or resource being tested.
6. A TODO API test file may be named `todos-api.test.js`.

## End-to-End Tests

1. End-to-end tests must use Playwright.
2. End-to-end tests should validate complete UI workflows through browser automation.
3. End-to-end tests must be placed in `tests/e2e/`.
4. End-to-end test files must use the naming convention `*.spec.js` or `*.spec.ts`.
5. End-to-end test file names should describe the user journey being tested.
6. A task workflow test file may be named `todo-workflow.spec.js`.
7. Playwright tests must use one browser only.
8. Playwright tests must use the Page Object Model (POM) pattern.
9. End-to-end coverage should be limited to 5-8 critical user journeys.
10. End-to-end tests should focus on happy paths and key edge cases rather than exhaustive UI coverage.

## Test Placement Summary

1. Backend unit tests belong in `packages/backend/__tests__/`.
2. Backend integration tests belong in `packages/backend/__tests__/integration/`.
3. Frontend unit tests belong in `packages/frontend/src/__tests__/`.
4. End-to-end tests belong in `tests/e2e/`.

## Port Configuration

1. Application ports must be configurable through environment variables.
2. Port configuration must use sensible defaults so local development works without extra setup.
3. Backend services should follow this pattern: `const PORT = process.env.PORT || 3030;`.
4. The frontend should default to React's standard development port `3000` unless overridden by the `PORT` environment variable.
5. Test and CI workflows should rely on environment-based port configuration rather than hard-coded assumptions where possible.
6. Port configurability must support CI and automated test environments that assign ports dynamically.

## Isolation and Lifecycle Rules

1. Every test must create or arrange its own required data.
2. No test may depend on execution order or state created by another test.
3. Setup and teardown hooks are required where state, servers, or test data must be initialized and cleaned up.
4. Tests must clean up any persisted data, mocks, timers, or processes they create.
5. Shared test utilities may be used, but they must not introduce hidden coupling between tests.

## Maintainability Rules

1. Tests should use clear names that describe the expected behavior.
2. Test helpers and fixtures should be reused when they reduce duplication without hiding intent.
3. Assertions should be specific enough to explain failures clearly.
4. Overly brittle assertions on markup structure, CSS classes, or incidental implementation details should be avoided unless they are the behavior under test.
5. Page Object Model abstractions for Playwright should keep selectors and interaction logic centralized.

## Feature Delivery Expectations

1. Backend feature work should include unit or integration coverage as appropriate.
2. Frontend feature work should include unit coverage for component behavior where appropriate.
3. User journeys that are critical to the product should be covered by end-to-end tests when they provide value beyond lower-level tests.
4. Bug fixes should include a test when the failure can be reproduced in an automated way.

## Acceptance Intent

A testing implementation should be considered complete only if:

1. The relevant behavior is covered at the appropriate test level.
2. Test files follow the required naming and placement conventions.
3. Tests are isolated, repeatable, and safe to run multiple times.
4. Playwright tests follow the one-browser and Page Object Model requirements.
5. Port configuration works in both local and CI environments.