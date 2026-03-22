import { confirm, message, open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog"
import {
  exists,
  readTextFile,
  stat,
  writeTextFile,
} from "@tauri-apps/plugin-fs"
import type { ImportedDataState } from "@excalidraw/excalidraw/data/types"

import type {
  WorkspaceDocument,
  WorkspaceDocumentDraft,
} from "../model/workspace-model"
import {
  buildDefaultSavePath,
  deriveDocumentTitleFromPath,
} from "../model/workspace-path-utils"
import { normalizeWorkspaceAppState } from "../model/workspace-model"

async function loadWorkspaceDocumentCodecs() {
  const { restore, serializeAsJSON } = await import("@excalidraw/excalidraw")

  return {
    restore,
    serializeAsJSON,
  }
}

function normalizeSelectedPaths(selection: string | string[] | null) {
  if (!selection) {
    return []
  }

  return Array.isArray(selection) ? selection : [selection]
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isImportedExcalidrawData(data: unknown): data is ImportedDataState {
  if (!isObjectLike(data)) {
    return false
  }

  return Array.isArray(data.elements) && isObjectLike(data.appState)
}

export async function promptForWorkspaceFiles() {
  const selection = await openDialog({
    multiple: true,
    directory: false,
    title: "Open Excalidraw files",
    filters: [
      {
        name: "Excalidraw",
        extensions: ["excalidraw", "json"],
      },
    ],
  })

  return normalizeSelectedPaths(selection)
}

export async function promptForSaveLocation(document: WorkspaceDocument) {
  return saveDialog({
    title: "Save Excalidraw file",
    defaultPath: await buildDefaultSavePath(document),
    filters: [
      {
        name: "Excalidraw",
        extensions: ["excalidraw"],
      },
    ],
  })
}

export async function confirmDiscardChanges(messageText: string) {
  return confirm(messageText, {
    title: "Excalidraw Local",
    kind: "warning",
  })
}

export async function showFileError(messageText: string) {
  await message(messageText, {
    title: "File operation failed",
    kind: "error",
  })
}

export class WorkspaceFileConflictError extends Error {
  constructor(messageText: string) {
    super(messageText)
    this.name = "WorkspaceFileConflictError"
  }
}

interface SaveWorkspaceDocumentOptions {
  interactive?: boolean
}

export async function loadWorkspaceDocumentDraft(
  filePath: string,
): Promise<WorkspaceDocumentDraft> {
  const contents = await readTextFile(filePath)
  let parsed: unknown

  try {
    parsed = JSON.parse(contents)
  } catch (error) {
    throw new Error(
      `Could not parse "${filePath}" as Excalidraw JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  if (!isImportedExcalidrawData(parsed)) {
    throw new Error(`"${filePath}" is not a valid Excalidraw document.`)
  }

  const { restore } = await loadWorkspaceDocumentCodecs()
  const restored = restore(parsed, null, null)
  const metadata = await stat(filePath)

  return {
    title: deriveDocumentTitleFromPath(filePath),
    filePath,
    snapshot: {
      elements: restored.elements,
      appState: normalizeWorkspaceAppState({
        ...restored.appState,
        showWelcomeScreen: false,
      }),
      files: restored.files,
      version: typeof parsed.version === "number" ? parsed.version : 1,
    },
    dirty: false,
    lastSavedAt: metadata.mtime ? metadata.mtime.toISOString() : null,
    lastOpenedAt: new Date().toISOString(),
  }
}

function normalizeWorkspaceSavePath(filePath: string) {
  const trimmedPath = filePath.trim()

  if (!trimmedPath) {
    return trimmedPath
  }

  return `${trimmedPath.replace(/\.[^./\\]+$/u, "")}.excalidraw`
}

async function promptBeforeOverwritingChangedFile(
  document: WorkspaceDocument,
  filePath: string,
  options: SaveWorkspaceDocumentOptions = {},
) {
  const { interactive = true } = options

  if (document.filePath !== filePath) {
    const fileExists = await exists(filePath)

    if (!fileExists) {
      return
    }

    if (!interactive) {
      throw new WorkspaceFileConflictError(
        `Skipped saving "${document.title}" because the destination file already exists.`,
      )
    }

    const confirmed = await confirm(
      `"${deriveDocumentTitleFromPath(filePath)}" already exists. Replace it with "${document.title}"?`,
      {
        title: "Excalidraw Local",
        kind: "warning",
      },
    )

    if (!confirmed) {
      throw new WorkspaceFileConflictError(
        `Skipped saving "${document.title}" because the destination file already exists.`,
      )
    }

    return
  }

  if (!document.lastSavedAt) {
    return
  }

  const fileExists = await exists(filePath)

  if (!fileExists) {
    if (!interactive) {
      throw new WorkspaceFileConflictError(
        `Skipped saving "${document.title}" because the file was removed on disk.`,
      )
    }

    const confirmed = await confirm(
      `"${document.title}" no longer exists on disk. Recreate it here?`,
      {
        title: "Excalidraw Local",
        kind: "warning",
      },
    )

    if (!confirmed) {
      throw new WorkspaceFileConflictError(
        `Skipped saving "${document.title}" because the file was removed on disk.`,
      )
    }

    return
  }

  const metadata = await stat(filePath)
  const currentModifiedAt = metadata.mtime?.toISOString() ?? null

  if (!currentModifiedAt || currentModifiedAt === document.lastSavedAt) {
    return
  }

  if (!interactive) {
    throw new WorkspaceFileConflictError(
      `Skipped saving "${document.title}" because the file changed on disk.`,
    )
  }

  const confirmed = await confirm(
    `"${document.title}" changed on disk after it was opened or saved. Overwrite those changes?`,
    {
      title: "Excalidraw Local",
      kind: "warning",
    },
  )

  if (!confirmed) {
    throw new WorkspaceFileConflictError(
      `Skipped saving "${document.title}" because the file changed on disk.`,
    )
  }
}

export async function saveWorkspaceDocumentToPath(
  document: WorkspaceDocument,
  filePath: string,
  options: SaveWorkspaceDocumentOptions = {},
) {
  const normalizedTargetPath =
    document.filePath === filePath
      ? filePath
      : normalizeWorkspaceSavePath(filePath)

  await promptBeforeOverwritingChangedFile(
    document,
    normalizedTargetPath,
    options,
  )

  const { serializeAsJSON } = await loadWorkspaceDocumentCodecs()
  const serialized = serializeAsJSON(
    document.snapshot.elements,
    document.snapshot.appState,
    document.snapshot.files,
    "local",
  )

  await writeTextFile(normalizedTargetPath, serialized)
  const metadata = await stat(normalizedTargetPath)
  const isSavingToExistingPath = document.filePath === normalizedTargetPath

  return {
    title: isSavingToExistingPath
      ? document.title
      : deriveDocumentTitleFromPath(normalizedTargetPath),
    filePath: normalizedTargetPath,
    dirty: false,
    lastSavedAt: metadata.mtime ? metadata.mtime.toISOString() : new Date().toISOString(),
  }
}
