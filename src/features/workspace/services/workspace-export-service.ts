import { save as saveDialog } from "@tauri-apps/plugin-dialog"
import { exportToBlob, exportToSvg, serializeAsJSON } from "@excalidraw/excalidraw"
import { writeFile, writeTextFile } from "@tauri-apps/plugin-fs"

import {
  buildDefaultExportPath,
} from "../model/workspace-path-utils"
import type {
  WorkspaceDocument,
  WorkspaceExportFormat,
} from "../model/workspace-model"
import { formatWorkspaceExportFormat } from "../model/workspace-model"

function getExportAppState(document: WorkspaceDocument) {
  const viewBackgroundColor =
    document.snapshot.appState.viewBackgroundColor ?? "#ffffff"

  return {
    ...document.snapshot.appState,
    exportBackground: true,
    exportScale: document.snapshot.appState.exportScale ?? 1,
    exportEmbedScene: true,
    exportWithDarkMode: false,
    viewBackgroundColor,
  }
}

export async function promptForWorkspaceExportLocation(
  document: WorkspaceDocument,
  format: WorkspaceExportFormat,
) {
  const extension = format === "json" ? "excalidraw" : format
  const defaultPath =
    format === "json"
      ? await buildDefaultExportPath(document, extension, "-export")
      : await buildDefaultExportPath(document, extension)

  return saveDialog({
    title: `Export ${formatWorkspaceExportFormat(format)}`,
    defaultPath,
    filters: [
      {
        name: formatWorkspaceExportFormat(format),
        extensions: format === "json" ? ["excalidraw", "json"] : [extension],
      },
    ],
  })
}

export async function exportWorkspaceDocumentToPath(
  document: WorkspaceDocument,
  format: WorkspaceExportFormat,
  targetPath: string,
) {
  switch (format) {
    case "png": {
      const blob = await exportToBlob({
        elements: document.snapshot.elements,
        appState: getExportAppState(document),
        files: document.snapshot.files,
        mimeType: "image/png",
        exportPadding: 48,
      })

      await writeFile(targetPath, new Uint8Array(await blob.arrayBuffer()))
      return
    }
    case "svg": {
      const svgElement = await exportToSvg({
        elements: document.snapshot.elements,
        appState: getExportAppState(document),
        files: document.snapshot.files,
        exportPadding: 48,
      })

      const serializedSvg = new XMLSerializer().serializeToString(svgElement)
      await writeTextFile(
        targetPath,
        `<?xml version="1.0" encoding="UTF-8"?>\n${serializedSvg}`,
      )
      return
    }
    case "json": {
      const serialized = serializeAsJSON(
        document.snapshot.elements,
        document.snapshot.appState,
        document.snapshot.files,
        "local",
      )

      await writeTextFile(targetPath, serialized)
    }
  }
}
