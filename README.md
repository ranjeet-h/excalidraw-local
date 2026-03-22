# Excalidraw Local

Local-first desktop workspace for Excalidraw built with Tauri, React, and Rust.

## What this repo is now

- A local-first desktop shell for Excalidraw with an embedded canvas, tabbed document state, and native app chrome.
- A single-window workspace designed for local files, recovery, and future file-system integration.
- A frontend-first UI layer with Tauri handling native file and window integration as it lands.

## Development

```bash
npm run dev:frontend
npm run dev:tauri
npm run build
npm run build:tauri
npm run build:mac:universal
npm run lint
```

## macOS universal packaging

- `npm run build:mac:universal` bumps the current app patch version, syncs `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`, then builds an unsigned universal macOS `.app` and `.dmg`.
- Final artifacts are copied to `build/macos-universal/<version>/`, and older versioned outputs are pruned so only the latest build remains.
- The script installs the `x86_64-apple-darwin` Rust target automatically if it is missing.

## Notes

- The old Node/Express/Mongo template backend has been removed.
- The current milestone is the embedded editor canvas; local file dialogs, persistence, and export are next.
