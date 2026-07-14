# Coding Guidelines

## Purpose

This document defines the project's coding style and quality principles for the TODO application. The goal is to keep the codebase consistent, readable, and easy to maintain as the frontend and backend evolve.

## General Philosophy

Code should be written for the next person who has to read, debug, or extend it. That means favoring clarity over cleverness, small focused units over large multi-purpose blocks, and predictable patterns over personal style preferences. Every change should make the codebase easier to understand or, at minimum, not make it harder.

The project should follow a pragmatic style: use established patterns from the existing codebase, avoid unnecessary abstractions, and solve the problem at the appropriate level of complexity. When there is a tradeoff between short-term speed and long-term maintainability, prefer the option that keeps the code easier to change safely.

## Formatting and Readability

Code should use consistent formatting throughout the repository. Spacing, indentation, brace placement, line breaks, and quote usage should remain consistent within each file and follow the conventions already established by the codebase and formatter configuration.

Functions, components, and modules should be easy to scan. Long blocks of logic should be split into smaller named units when doing so improves clarity. Deep nesting should be minimized where possible by using guard clauses, early returns, or well-named helper functions.

Names should be explicit and descriptive. Variable, function, and component names should communicate intent clearly enough that most code can be understood without extra comments. One-letter names and vague names such as `data`, `temp`, or `value` should be avoided unless the scope is extremely small and the meaning is obvious.

Comments should be used sparingly and intentionally. Prefer code that explains itself through good structure and naming. Comments are appropriate when they explain non-obvious business rules, architectural constraints, or reasoning that would not be clear from the code alone.

## Import Organization

Imports should be organized consistently and kept tidy. External dependencies should be grouped separately from internal modules when practical. Related imports should be grouped together, and unused imports should be removed promptly.

Import statements should reflect actual ownership and responsibility in the code. Avoid creating tangled dependencies between modules. If a file has too many imports from too many places, that is often a sign that the file is taking on too many responsibilities and should be simplified.

Prefer explicit imports over patterns that make dependencies harder to trace. Module boundaries should remain easy to understand, especially between shared code, frontend code, and backend code.

## Structure and Reuse

The codebase should follow the DRY principle, but DRY should be applied carefully. Reuse is valuable when it removes real duplication and creates clearer shared behavior. Duplication should not be eliminated by introducing abstractions that are harder to understand than the repeated code.

Shared logic should be extracted when the duplication is meaningful, stable, and likely to be reused. Premature abstractions should be avoided. Two similar pieces of code do not always need a shared helper if combining them would make both cases harder to read.

Each module should have a clear responsibility. Components should focus on rendering and interaction concerns. Backend modules should separate routing, request handling, and business logic where practical. Utility functions should stay small and narrowly scoped.

## Linting and Static Quality Checks

Linting is a required part of code quality, not an optional cleanup step. New code should satisfy the project's linter rules before it is considered complete. Warnings and errors should be addressed directly rather than ignored unless there is a strong, documented reason.

Developers should use ESLint consistently to catch common issues such as unused variables, accidental globals, inconsistent patterns, or risky constructs. If a lint rule becomes a recurring obstacle, the rule should be reviewed deliberately rather than bypassed casually in individual files.

Formatting and linting tools should work with the codebase, not against it. When automated tooling exists, developers should let the tools enforce consistency instead of hand-formatting code inconsistently from file to file.

## Frontend Quality Principles

React components should be kept focused and readable. Presentation concerns, state management, and side effects should be separated when doing so improves clarity. Components that become too large or handle too many responsibilities should be split into smaller components or helpers.

UI code should prioritize predictable state updates and accessible interaction patterns. Derived state should not be duplicated unnecessarily. Form logic, conditional rendering, and user feedback flows should remain easy to reason about.

Styling should remain consistent with the documented UI guidelines. Repeated UI patterns should be implemented in reusable ways when that improves consistency and reduces maintenance overhead.

## Backend Quality Principles

Backend code should prioritize clear request handling, explicit validation, and predictable error behavior. Route handlers should remain small enough that the control flow is easy to follow. Where logic grows, it should be extracted into well-named helpers or service-level functions.

Input validation should happen close to the application boundary. Error handling should be deliberate and consistent so failures are understandable during development and testing. Hidden side effects and implicit behavior should be minimized.

Configuration should be explicit and environment-driven where appropriate. Hard-coded values that may vary across environments, such as ports or service URLs, should be configurable.

## Maintainability Expectations

Every change should leave the surrounding code at least as understandable as it was before. When touching a confusing area, improve it if the improvement is small and directly related to the work being done. Avoid broad refactors that increase risk unless they are necessary for correctness or maintainability.

Code reviews should look for readability, correctness, consistency, and unnecessary complexity. A solution is not complete just because it works once. It should also be understandable, testable, and aligned with the rest of the codebase.

When introducing a new pattern, make sure it is justified and repeatable. The repository should not accumulate multiple competing approaches to the same problem without a strong reason.

## Relationship to Testing

Good code and good tests support each other. Code should be structured so it can be tested without excessive setup, hidden dependencies, or fragile mocks. Business logic should be easy to exercise in unit and integration tests, and user workflows should remain automatable in end-to-end tests.

If a design makes testing unusually difficult, that should be treated as a signal that the design may need to be simplified or responsibilities may need to be separated more clearly.

## Acceptance Intent

Code should be considered aligned with these guidelines only if it:

1. Is readable and consistent with surrounding code.
2. Uses clear naming and appropriate structure.
3. Avoids unnecessary duplication and unnecessary abstraction.
4. Passes linting and follows established quality checks.
5. Supports maintainable testing and future changes.