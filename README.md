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
npm run lint
```

## Notes

- The old Node/Express/Mongo template backend has been removed.
- The current milestone is the embedded editor canvas; local file dialogs, persistence, and export are next.
