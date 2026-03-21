# Excalidraw Local Implementation Plan

## Product goal
Build a local-first desktop drawing app that feels like Excalidraw, runs fully offline, opens and saves local files, and manages multiple documents in browser-like tabs.

## Product principles
- Use the official Excalidraw package as the editor core, not a custom canvas.
- Keep the app local-first and private.
- Make file handling feel native, safe, and familiar.
- Prioritize fast tab switching, autosave, and recovery.
- Treat Mermaid import as a first-class creation workflow.
- Keep v1 focused on a single-window tabbed experience.

## UI and platform constraints
- Use the existing `src/components/ui` shadcn component set for all app chrome, menus, tabs, dialogs, toolbars, and empty states.
- Do not introduce a new generic component library while the repo already has reusable UI primitives.
- Keep the default theme white/light for v1. Build the tokens and structure so dark mode can be added later without a rewrite.
- Treat the root `package.json` as the shared dependency and script source for both the Tauri app and the frontend.
- Keep the Rust/Tauri layer thin and native-focused. Put editor state and document logic in TypeScript whenever possible.
- Optimize the app for fast startup and clean packaging on macOS first, while keeping Windows and Linux compatibility in the architecture.

## Core user journeys
- Create a new blank drawing.
- Open one or more local `.excalidraw` files.
- Switch between multiple open tabs.
- Edit and save changes safely.
- Use Save As to duplicate or rename a file.
- Reopen recent work after restart.
- Convert Mermaid text into diagram shapes.
- Export drawings for sharing.

## Scope decisions to lock before coding
- [ ] Confirm the app ships as local-only and offline in v1, with no required cloud sign-in.
- [ ] Confirm the editor core comes from `@excalidraw/excalidraw` rather than a custom canvas implementation.
- [ ] Confirm the initial window model is one desktop window with tabs, not multiple separate windows.
- [ ] Confirm the primary save format is `.excalidraw` JSON on the local filesystem.
- [ ] Confirm the existing Node/Mongo template code is removed from the main runtime path or kept only as a future optional module.
- [ ] Confirm the first release does not include collaboration or sync accounts.

## Phase 1 - Turn the template into an editor shell
- [ ] Replace the current template screen in `src/App.tsx` with a document workspace.
- [ ] Build a full-height desktop shell with top bar, tab strip, editor canvas, and status bar.
- [ ] Add a welcome state for first launch and no-open-document scenarios.
- [ ] Make the shell responsive, dark-mode aware, and keyboard accessible.
- [ ] Create a clean product name, title, and UI copy for the final app.
- [ ] Remove or quarantine placeholder template components that are no longer needed.

**Important details:** Compose the shell from the existing shadcn components already in `src/components/ui` instead of creating new base UI components. Keep the visual theme light/white for now, but structure spacing, tokens, and layout so dark mode can be added later without refactoring the shell.

## Phase 2 - Integrate the Excalidraw editor
- [ ] Install and wire `@excalidraw/excalidraw` into the React app.
- [ ] Load the editor inside a dedicated workspace component with proper sizing and styling.
- [ ] Connect editor `onChange` events to app state so the current tab always knows if it is dirty.
- [ ] Preserve Excalidraw app state such as zoom, selected tool, view mode, and theme per tab.
- [ ] Verify undo, redo, clipboard, zoom, pan, keyboard shortcuts, and text editing work inside Tauri.
- [ ] Add any peer dependencies or CSS adjustments required by the official package.
- [ ] Define a safe wrapper around the editor so file logic stays outside the canvas component.

**Important details:** Treat the Excalidraw canvas as the only heavy custom surface. Everything around it should remain thin and reusable, with the existing shadcn primitives handling the surrounding UI, command surfaces, and file actions.

## Phase 3 - Define the local document model
- [ ] Design a document schema with `id`, `title`, `filePath`, `elements`, `appState`, `files`, `version`, `dirty`, `lastSavedAt`, and `lastOpenedAt`.
- [ ] Add a separate tab state model so each open file can keep its own editor state and save status.
- [ ] Create serialization and deserialization helpers for reading and writing Excalidraw files.
- [ ] Add version checks and a migration strategy for future schema changes.
- [ ] Make new untitled docs predictable, with stable default names like `Untitled-1`.
- [ ] Ensure a failed parse or partial file read does not destroy the current in-memory document.

**Important details:** Keep document state and migrations in frontend TypeScript so file format changes stay easy to reason about. Rust should only deal with native file access and not own the editor data model.

## Phase 4 - Build file actions: New, Open, Save, Save As
- [ ] Implement New Document so users can create a blank tab without losing the current one.
- [ ] Implement Open File using a native file picker and support opening one or many files at once.
- [ ] Implement Save for tabs that already have a file path.
- [ ] Implement Save As to choose a new name and location, then bind the tab to that new path.
- [ ] Add Save Copy As if you want a duplicate file without changing the current tab path.
- [ ] Add clear failure handling for permission errors, invalid paths, and disk write errors.
- [ ] Show save progress and success or failure feedback in the UI.
- [ ] Prompt before closing a dirty tab, opening a new file over a dirty tab, or quitting the app.

**Important details:** File operations must be local-first and atomic. Save As should rebind the active tab to the new file path without losing undo history, and prompts should always prevent silent data loss.

## Phase 5 - Create browser-like tab management
- [ ] Build a tab manager that can open, close, activate, and reorder multiple documents.
- [ ] Keep tab state independent so switching tabs feels instant and no work is lost.
- [ ] Show unsaved indicators, file icons, and loading or saving states on each tab.
- [ ] Support middle-click or close-button tab closing if it matches the desktop UX target.
- [ ] Add Duplicate Tab or Duplicate Document if it helps users branch ideas quickly.
- [ ] Add reopen-closed-tab behavior if it fits the browser-like model.
- [ ] Restore the last session's tabs on app launch, including unsaved recovery tabs.

**Important details:** The product should feel browser-like in tab behavior but stay a single-window workspace for v1. Do not remount or reset the Excalidraw editor when switching tabs unless the tab itself is changing.

## Phase 6 - Add local persistence and crash recovery
- [ ] Store app settings, UI preferences, and recent files in the Tauri app data directory.
- [ ] Save recovery snapshots for unsaved tabs so a crash or forced quit does not lose work.
- [ ] Restore recovery snapshots on launch and clearly label recovered content.
- [ ] Add optional autosave for saved files with a debounce so writes do not happen on every keystroke.
- [ ] Keep a lightweight backup or shadow-copy strategy for safer local writes.
- [ ] Clean up old recovery files and backups using a predictable retention policy.
- [ ] Detect when a file changed on disk outside the app and ask the user how to resolve the conflict.

**Important details:** Recent files, recovery data, and layout preferences should live in app data, not in the project tree. Autosave should be debounce-based and recovery-first so crash protection never blocks normal editing.

## Phase 7 - Support Mermaid-to-Excalidraw workflows
- [ ] Add a Mermaid import entry point from menu, toolbar, or command palette.
- [ ] Support paste-to-convert for Mermaid text when the user explicitly chooses the action.
- [ ] Use `@excalidraw/mermaid-to-excalidraw` to generate elements from Mermaid source.
- [ ] Decide whether Mermaid content opens in a new tab or inserts into the current tab by default.
- [ ] Provide a preview or confirmation step before replacing existing canvas content.
- [ ] Show conversion errors in a human-friendly way with a copyable error-detail block.
- [ ] Add sample Mermaid snippets to help users discover the feature.

**Important details:** Mermaid conversion should always be explicit user intent, not automatic parsing. Keep the insertion path predictable so a user can preview or target a new tab before anything replaces the canvas.

## Phase 8 - Add export, import, and sharing tools
- [ ] Support export to PNG for easy sharing.
- [ ] Support export to SVG for vector workflows.
- [ ] Support export back to native Excalidraw JSON.
- [ ] Decide whether PDF export is part of v1 or a follow-up feature.
- [ ] Import existing Excalidraw files and image assets cleanly.
- [ ] Add clipboard actions for copy as image, copy as SVG, or copy selected content.
- [ ] Add reveal-in-folder or show-in-finder actions for the active document.

**Important details:** Export fidelity matters more than fancy options. Preserve embedded assets correctly, and keep the share/export flows simple enough that they can be used from the existing app chrome.

## Phase 9 - Native desktop integration in Tauri
- [ ] Add Tauri commands for file dialogs, atomic reads and writes, and folder reveal actions.
- [ ] Wire the app to handle OS-level open-file events so double-clicking a `.excalidraw` file opens the right tab.
- [ ] Add drag-and-drop open support for files dropped onto the window.
- [ ] Configure file associations for macOS, Windows, and Linux.
- [ ] Review Tauri capabilities, CSP, and permissions required for file-system access.
- [ ] Keep the Rust layer thin and focused on native capabilities rather than business logic.
- [ ] Remove unused sidecar or runtime pieces from the current template if they are not part of the final product.

**Important details:** Rust should own native app concerns such as dialogs, file paths, and OS events, but not document state or UI logic. Keep the implementation fast to compile on macOS and structured so Windows and Linux support can be added without reworking the architecture.

## Phase 10 - Product UX polish
- [ ] Add a strong empty state with New, Open, and Recent Files actions.
- [ ] Add a recent files panel so users can continue quickly.
- [ ] Add a command palette or menu structure for power users.
- [ ] Add keyboard shortcuts for New, Open, Save, Save As, Close Tab, Switch Tab, Export, and Mermaid Import.
- [ ] Add theme toggle and system theme sync.
- [ ] Add clear error toasts for save failures, parse failures, and recovery events.
- [ ] Polish spacing, typography, and tab affordances so the app feels native rather than templated.
- [ ] Make the app title, icons, and menu labels match the final product identity.

**Important details:** Use the existing shadcn-based UI patterns for polish and keep the first release visually clean, white, and calm. The app should feel like a desktop product even before dark mode or advanced customization arrives.

## Phase 11 - Quality checks and release readiness
- [ ] Add unit tests for document serialization, dirty-state detection, and tab switching.
- [ ] Add tests for open, save, Save As, and recovery flows where the codebase supports them.
- [ ] Manually test the main platforms: macOS, Windows, and Linux.
- [ ] Verify offline mode works with no backend, no external services, and no network dependency.
- [ ] Verify Mermaid conversion, export, reopen, and restore after restart.
- [ ] Run lint and build checks before each milestone is marked complete.
- [ ] Bundle a release candidate only after the app can open, edit, save, and recover real local files reliably.

**Important details:** Treat macOS packaging and startup speed as the first release gate, then verify the same architecture on Windows and Linux. Keep the checks focused on native app reliability, not backend availability.

## Phase 12 - Release packaging and launch prep
- [ ] Set the final app identity: product name, bundle identifier, icon set, and versioning policy.
- [ ] Build and smoke test a packaged macOS release on a clean machine or clean user profile.
- [ ] Verify Windows and Linux packaging paths still work, even if those platforms ship later.
- [ ] Confirm file associations, open-file handling, and drag-and-drop still work in the packaged build.
- [ ] Validate the release build launches offline, opens files, saves, restores, exports, and closes without dev-only dependencies.
- [ ] Prepare release notes, install guidance, and a short user-facing getting-started flow.
- [ ] Remove any debug-only UI, logs, or developer shortcuts before shipping.
- [ ] Check startup time, bundle size, and basic memory usage on the packaged app.

**Important details:** Packaging and launch prep should happen on the built desktop app, not only in dev mode. macOS signing and notarization should be part of the first release path, with Windows/Linux packaging validation kept in scope so cross-platform support does not drift.

## Suggested delivery order
- [ ] Lock product decisions and scope.
- [ ] Build the editor shell and Excalidraw integration.
- [ ] Add document serialization and save/open flows.
- [ ] Add tabs and session restore.
- [ ] Add recovery and autosave.
- [ ] Add Mermaid import and export tools.
- [ ] Add Tauri desktop integration and file associations.
- [ ] Polish UX and validate on all target platforms.
- [ ] Package, smoke test, and prep the release build.

## Definition of done
A user can create a new drawing, open multiple local files in tabs, edit them, save, save as, and recover after restart. The app works offline and feels like a native desktop product instead of a template.
