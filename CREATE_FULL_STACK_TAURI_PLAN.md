# Plan: `npx create-full-stack-tauri`

## Goal
Build a scaffolding CLI that generates a full desktop app template by asking users to choose:
- Backend mode: `node` (script runtime) or `bun` # https://bun.com/
- Database: `mongodb`, `postgresql`, or `mysql`
- Frontend stack: Vite + React + TS/JS + optional Tailwind + optional shadcn/ui

The generator should output a runnable Tauri project with selected options pre-configured.

## Product Scope
- Command: `npx create-full-stack-tauri@latest`
- Modes:
  - Interactive prompts (default)
  - Non-interactive flags (`--backend`, `--db`, `--frontend`, `--yes`)
- Output:
  - Working project structure
  - Correct dependencies and scripts
  - `.env.example` with selected DB defaults
  - README instructions for selected stack

## Phase Plan

## Phase 1: Foundation (MVP)
- Create npm package for generator CLI.
- Add prompt system for:
  - Project name
  - Package manager
  - Backend mode (`node` | `bun`)
  - Database (`mongodb` | `postgresql`)
  - Frontend (`react-ts` only for MVP)
  - Styling (`tailwind` on/off)
- Template composition with these variants:
  - `backend/node`
  - `backend/bun`
  - `db/mongodb`
  - `db/postgresql`
  - `ui/tailwind`
- Generate project and run install.

## Phase 2: Expand Choices
- Add `mysql` database option.
- Add frontend language choices (`ts` | `js`).
- Add shadcn/ui option (auto setup when Tailwind is enabled).
- Add compatibility checks (for example, disallow invalid combos).

## Phase 3: Binary Automation Hardening
- Download/setup binary assets based on user choices and platform:
  - Backend binary flow (SEA build scripts)
  - DB binaries per triplet (Mongo/Postgres/MySQL strategy)
- Ensure `npx tauri build` path runs all required pre-build steps.
- Add per-platform fallbacks and clear warnings when binaries are unavailable.

## Phase 4: Quality + Distribution
- Add e2e smoke tests for generated projects.
- Add matrix CI validation for supported OS and combinations.
- Publish `create-full-stack-tauri` package and versioning policy.
- Add telemetry opt-in (optional) for template option usage.

## Core Workstreams

## 1) CLI UX
- Prompt flow and defaults.
- Validation and retry.
- Summary screen before generation.

## 2) Template Composition Engine
- Merge base template + feature modules.
- Resolve package scripts/dependencies conflicts.
- Render config files with token replacement (`{{projectName}}`, `{{dbType}}`).

## 3) Runtime Modes
- Node backend mode:
  - plain Node/tsx dev workflow.
- Bun mode:
  - Bun build scripts + sidecar integration.

## 4) Database Modules
- MongoDB sidecar module.
- PostgreSQL local sidecar/container strategy.
- MySQL local sidecar/container strategy.
- Shared DB abstraction in backend starter.

## 5) Docs + Onboarding
- Generated README customized by chosen options.
- Troubleshooting section per OS.
- Commands for dev/build/release.

## Risks and Decisions
- DB binary distribution for PostgreSQL/MySQL is harder than MongoDB; may need container strategy as fallback.
- Bun binary and native DB sidecars increase platform complexity and build time.
- Need strict compatibility matrix to avoid broken generated projects.

## Success Criteria
- User can run one command and generate project with chosen options.
- Generated project runs with `npm run dev` and builds with `npx tauri build`.
- At least 90% of documented option combinations pass CI smoke tests.

## Immediate Next Milestones
1. Finalize option matrix and supported combinations for v1.
2. Build generator package scaffold and prompt flow.
3. Implement template composition for backend mode + MongoDB first.
4. Add PostgreSQL/MySQL modules with explicit support policy.
