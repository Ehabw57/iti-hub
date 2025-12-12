# ITI Hub Constitution

This constitution establishes the engineering principles, workflow, and quality gates for the ITI Hub project. It is intended to keep the codebase readable, secure, and easy to maintain while favoring simplicity over heavy tooling.

## Core Principles

### I. Readable & Self-Explanatory Code
- Code is written for humans first. Prefer clear naming, small functions, and explicit control flow.
- Prefer a few well-documented files over many indirection layers.
- Inline comments only to explain "why" — not "what".

### II. Clarity & Consistency
- Strive for clarity in APIs, function names, and data shapes. Keep naming consistent across the codebase.
- Follow a shared style and lint rules so that code reads the same way across contributors.

### III. Modularity & Separation of Concerns
- Structure code so that responsibilities are separated (controllers, services, models, utilities).
- Prefer composing small modules rather than large monoliths; keep public interfaces minimal and stable.

### IV. Tests (Test-First & Safety Nets)
- Write unit tests for business logic and integration tests for HTTP boundaries (Jasmine + Supertest recommended per project).
- Maintain a minimal set of fast-running core tests that run locally and on CI. Tests should be deterministic and isolated.

### V. Efficiency, Scalability & Maintainability
- Design for efficient common-case performance, but optimize only where profiling shows need.
- Keep code maintainable: prefer simple, well-tested solutions that are easy to reason about and modify.

### VI. Simplicity over Tooling
- Prefer small focused libraries and native APIs over introducing heavy frameworks unless justified.
- Add tooling only when it improves developer velocity or production reliability measurably.

## Development Standards & Practices

1. Project structure
- Keep a predictable layout: `server/controllers`, `server/services`, `server/models`, `server/middlewares`, `server/routes`, `tests`.

6. Configuration & Secrets
- Use environment variables for configuration. Validate required env at startup (fail-fast if critical secrets like `JWT_SECRET` missing).

7. Dependencies
- Keep dependencies minimal and actively reviewed. Prefer well-maintained and widely-used libraries. Run `npm audit` regularly.


---