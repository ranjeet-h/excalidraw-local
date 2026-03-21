import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"

export type WorkspaceExportFormat = "png" | "svg" | "json"

export interface WorkspaceSnapshot {
  elements: readonly ExcalidrawElement[]
  appState: Partial<AppState>
  files: BinaryFiles
  version: number
}

export interface WorkspaceDocument {
  id: string
  title: string
  filePath: string | null
  snapshot: WorkspaceSnapshot
  dirty: boolean
  recovered: boolean
  lastSavedAt: string | null
  lastOpenedAt: string
}

export interface WorkspaceDocumentDraft {
  id?: string
  title?: string
  filePath?: string | null
  snapshot?: WorkspaceSnapshot
  dirty?: boolean
  recovered?: boolean
  lastSavedAt?: string | null
  lastOpenedAt?: string | null
}

export interface WorkspaceRecentFile {
  filePath: string
  title: string
  lastTouchedAt: string
}

export interface WorkspaceState {
  documents: WorkspaceDocument[]
  activeDocumentId: string | null
  nextUntitledIndex: number
  recentFiles: WorkspaceRecentFile[]
}

type WorkspaceCollaborators = AppState["collaborators"]

function normalizeWorkspaceCollaborators(
  collaborators: unknown,
): WorkspaceCollaborators {
  if (collaborators instanceof Map) {
    return new Map(collaborators) as WorkspaceCollaborators
  }

  if (Array.isArray(collaborators)) {
    return new Map(
      collaborators.filter(
        (entry): entry is [string, WorkspaceCollaborators extends Map<string, infer T> ? T : never] =>
          Array.isArray(entry) && typeof entry[0] === "string" && entry.length === 2,
      ),
    ) as WorkspaceCollaborators
  }

  if (typeof collaborators === "object" && collaborators !== null) {
    return new Map(
      Object.entries(collaborators).filter(
        (entry): entry is [string, WorkspaceCollaborators extends Map<string, infer T> ? T : never] =>
          typeof entry[0] === "string",
      ),
    ) as WorkspaceCollaborators
  }

  return new Map() as WorkspaceCollaborators
}

export function normalizeWorkspaceAppState(
  appState: Partial<AppState> = {},
): Partial<AppState> {
  return {
    ...appState,
    collaborators: normalizeWorkspaceCollaborators(appState.collaborators),
  }
}

export function createEmptySnapshot(): WorkspaceSnapshot {
  return {
    elements: [],
    appState: normalizeWorkspaceAppState(),
    files: {},
    version: 1,
  }
}

export function cloneWorkspaceSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    elements: [...snapshot.elements],
    appState: normalizeWorkspaceAppState(snapshot.appState),
    files: { ...snapshot.files },
    version: snapshot.version,
  }
}

export function createWorkspaceState(): WorkspaceState {
  return {
    documents: [],
    activeDocumentId: null,
    nextUntitledIndex: 1,
    recentFiles: [],
  }
}

function createDocumentId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  return `doc-${Math.random().toString(36).slice(2, 10)}`
}

export function createUntitledTitle(index: number) {
  return `Untitled-${index}`
}

export function createMermaidDiagramTitle(index: number) {
  return `Mermaid-${index}`
}

export function createDuplicateTitle(title: string) {
  return title.startsWith("Untitled-") ? `${title} copy` : `Copy of ${title}`
}

export function deriveNextUntitledIndex(documents: Pick<WorkspaceDocument, "title">[]) {
  const usedUntitledIndexes = new Set<number>()

  documents.forEach((document) => {
    const match = /^Untitled-(\d+)$/i.exec(document.title)

    if (!match) {
      return
    }

    usedUntitledIndexes.add(Number(match[1]))
  })

  let nextIndex = 1

  while (usedUntitledIndexes.has(nextIndex)) {
    nextIndex += 1
  }

  return nextIndex
}

export function formatWorkspaceExportFormat(format: WorkspaceExportFormat) {
  switch (format) {
    case "png":
      return "PNG"
    case "svg":
      return "SVG"
    case "json":
      return "Excalidraw JSON"
  }
}

export function createWorkspaceDocument(
  draft: WorkspaceDocumentDraft = {},
  index = 1,
): WorkspaceDocument {
  const timestamp = new Date().toISOString()
  const snapshot = draft.snapshot ?? createEmptySnapshot()

  return {
    id: draft.id ?? createDocumentId(),
    title: draft.title ?? createUntitledTitle(index),
    filePath: draft.filePath ?? null,
    snapshot: cloneWorkspaceSnapshot(snapshot),
    dirty: draft.dirty ?? false,
    recovered: draft.recovered ?? false,
    lastSavedAt: draft.lastSavedAt ?? null,
    lastOpenedAt: draft.lastOpenedAt ?? timestamp,
  }
}

export function createUntitledDocument(index: number) {
  return createWorkspaceDocument({ title: createUntitledTitle(index) }, index)
}

export function duplicateWorkspaceDocument(source: WorkspaceDocument) {
  return createWorkspaceDocument(
    {
      title: createDuplicateTitle(source.title),
      filePath: null,
      snapshot: cloneWorkspaceSnapshot(source.snapshot),
      dirty: true,
      recovered: false,
      lastSavedAt: null,
    },
    1,
  )
}

export function formatWorkspaceLocation(filePath: string | null) {
  return filePath ?? "Unsaved local document"
}

export function formatWorkspaceTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Never"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp))
}

export function upsertRecentFile(
  recentFiles: WorkspaceRecentFile[],
  nextRecentFile: WorkspaceRecentFile,
) {
  const deduped = recentFiles.filter(
    (recentFile) => recentFile.filePath !== nextRecentFile.filePath,
  )

  return [nextRecentFile, ...deduped]
    .sort(
      (left, right) =>
        new Date(right.lastTouchedAt).getTime() -
        new Date(left.lastTouchedAt).getTime(),
    )
    .slice(0, 8)
}
