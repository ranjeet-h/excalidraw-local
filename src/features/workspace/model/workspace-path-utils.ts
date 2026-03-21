import { basename, dirname, join } from "@tauri-apps/api/path"

import type { WorkspaceDocument } from "./workspace-model"

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]+/g, "-")
}

export function stripExcalidrawExtension(fileName: string) {
  return fileName.replace(/\.(excalidraw|json)$/i, "")
}

export function deriveDocumentTitleFromPath(filePath: string) {
  const segments = filePath.split(/[\\/]/)
  const lastSegment = segments.at(-1) ?? filePath
  return stripExcalidrawExtension(lastSegment) || "Untitled"
}

function normalizeExtension(extension: string) {
  return extension.replace(/^\./, "")
}

export async function buildDefaultSavePath(
  document: Pick<WorkspaceDocument, "title" | "filePath">,
) {
  return buildDefaultExportPath(document, "excalidraw")
}

export async function buildDefaultExportPath(
  document: Pick<WorkspaceDocument, "title" | "filePath">,
  extension: string,
  suffix = "",
) {
  const normalizedExtension = normalizeExtension(extension)
  const titleBaseName = stripExcalidrawExtension(document.title).trim()

  if (document.filePath) {
    const directory = await dirname(document.filePath)
    const baseName = stripExcalidrawExtension(await basename(document.filePath))
    const preferredBaseName = titleBaseName || baseName
    const safeName =
      sanitizeFileName(`${preferredBaseName}${suffix}`) || "Untitled"

    return join(directory, `${safeName}.${normalizedExtension}`)
  }

  const safeName =
    sanitizeFileName(`${titleBaseName}${suffix}`) || "Untitled"

  return `${safeName}.${normalizedExtension}`
}
