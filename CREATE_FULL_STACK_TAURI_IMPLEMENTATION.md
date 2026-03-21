# Implementation Design: `create-full-stack-tauri`

## Overview
`create-full-stack-tauri` is a composable project generator similar to `create-vite`.
It asks for stack choices and materializes a ready-to-run Tauri full-stack desktop project.

## High-Level Architecture
- `packages/create-full-stack-tauri` (published npm create package)
- `templates/base` (common Tauri + Vite core)
- `templates/modules/*` (backend/database/ui feature modules)
- `composer` (merges selected modules into output project)
- `post-generate hooks` (install deps, run initial setup tasks)

## CLI Command and Flow
1. User runs `npx create-full-stack-tauri@latest`.
2. CLI prompts for:
   - project name
   - package manager
   - backend mode: `node` or `bun` # https://bun.com/
   - database: `mongodb` | `postgresql` | `mysql`
   - frontend: `react`
   - language: `typescript` | `javascript`
   - styling: `tailwind` yes/no
   - `shadcn/ui` yes/no
3. CLI validates compatibility.
4. CLI composes files and writes final project.
5. CLI installs dependencies and prints next commands.

## Prompt Schema (Suggested)
```ts
interface GeneratorAnswers {
  projectName: string;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  backendMode: 'node' | 'bun';
  database: 'mongodb' | 'postgresql' | 'mysql';
  language: 'ts' | 'js';
  tailwind: boolean;
  shadcn: boolean;
  installDeps: boolean;
}
```

## Template Module Layout (Suggested)
```text
templates/
  base/
  modules/
    backend-node/
    backend-bun/
    db-mongodb/
    db-postgresql/
    db-mysql/
    lang-ts/
    lang-js/
    ui-tailwind/
    ui-shadcn/
```

## Composition Rules
- Always apply `base` first.
- Apply selected modules in deterministic order.
- Merge strategies:
  - `package.json`: deep merge `scripts`, `dependencies`, `devDependencies`
  - text templates: token replacement (`{{PROJECT_NAME}}`, `{{DB_DRIVER}}`)
  - file conflicts: last module wins with explicit warning log
- Maintain generated `stack.config.json` for traceability.

## Backend Mode Details

## `node` mode
- Backend runs as standard Node process in dev/build.
- Tauri in dev points to external backend.
- Simple and easiest for local iteration.

## `bun` mode
- Backend built with bun.
- Produced binary placed in `src-tauri/bin`.
- Tauri release spawns backend sidecar.
- Requires platform-specific binary preparation in build hooks.

## Database Strategy

## MongoDB
- Native sidecar approach is straightforward.
- Similar to current project implementation.

## PostgreSQL/MySQL
- Two realistic strategies:
  - Native sidecar binaries per platform (complex packaging/licensing/ops)
  - Local container strategy for dev + external managed DB for production
- Recommended v1:
  - Support app wiring and drivers immediately.
  - Keep native binary bundling experimental until stabilized.

## Frontend Setup Strategy
- Vite + React scaffold integrated into base template.
- Language module adjusts ts/js files and configs.
- Tailwind module adds config, CSS, and script wiring.
- shadcn module initializes component scaffolding when Tailwind is selected.

## Build Integration
- Generated project should ensure `npx tauri build` calls a full prebuild pipeline:
  - setup binaries/assets
  - build backend if in `bun` mode
  - build frontend
- Keep these in `beforeBuildCommand` to avoid user confusion.

## Testing Strategy
- Unit tests:
  - prompt validation
  - module selection logic
  - `package.json` merge behavior
- Integration tests:
  - generate each supported combination in temp dir
  - run `npm install`
  - run smoke checks (`npm run build`, optional `npx tauri build` on CI-capable runners)

## Release Strategy
- Package name: `create-full-stack-tauri`
- Semver with changelog and migration notes.
- CI publishes on tagged releases.
- Add "supported combinations" table in docs.

## First Deliverable (Recommended)
- v0.1:
  - Backend: `node` + `bun`
  - DB: `mongodb` only fully bundled
  - Frontend: React + TS/JS + Tailwind + optional shadcn
- v0.2:
  - Add PostgreSQL/MySQL app wiring
  - Add experimental binary/database handling per platform

## Non-Goals for v1
- Full cross-platform binary bundling for all DB engines.
- Complex migration tooling.
- Monorepo generator presets.

## Acceptance Criteria
- CLI can generate a project from prompts without manual patching.
- Generated project includes only selected dependencies/scripts.
- Generated app starts in dev and completes production build for supported combinations.
- Docs clearly identify stable vs experimental option sets.
