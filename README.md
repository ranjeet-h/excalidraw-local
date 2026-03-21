# Excalidraw Local

Local-first desktop workspace for Excalidraw built with Tauri, React, and Rust.

## What this repo is now

- A desktop app shell for opening, editing, and saving local Excalidraw files.
- A single-window, tabbed local workspace.
- A frontend-first UI layer with Tauri handling native file and window integration.

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
- Future work will focus on the Excalidraw editor, local file actions, tabs, and recovery.
