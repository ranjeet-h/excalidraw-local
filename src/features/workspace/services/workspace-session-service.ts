import { appDataDir, join } from "@tauri-apps/api/path"
import {
  copyFile,
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs"

import {
  createUntitledTitle,
  createWorkspaceDocument,
  deriveNextUntitledIndex,
  normalizeWorkspaceAppState,
  type WorkspaceDocument,
  type WorkspaceDocumentDraft,
  type WorkspaceRecentFile,
  type WorkspaceSnapshot,
  type WorkspaceState,
} from "../model/workspace-model"

const WORKSPACE_SESSION_FILE_NAME = "workspace-session.json"
const WORKSPACE_SESSION_BACKUP_FILE_NAME = "workspace-session.backup.json"
const WORKSPACE_SESSION_TEMP_PREFIX = `${WORKSPACE_SESSION_FILE_NAME}.tmp-`

interface WorkspaceSessionRecord {
  version: number
  activeDocumentId: string | null
  nextUntitledIndex: number
  documents: WorkspaceDocumentDraft[]
  recentFiles: WorkspaceRecentFile[]
}

interface WorkspaceSessionRecordLike {
  version?: unknown
  activeDocumentId?: unknown
  nextUntitledIndex?: unknown
  documents?: unknown
  recentFiles?: unknown
}

export interface WorkspaceSessionLoadResult {
  workspace: WorkspaceState
  recoveredDocumentCount: number
  skippedDocumentCount: number
  restoredFromBackup: boolean
}

export interface WorkspaceSessionSaveResult {
  backupUpdated: boolean
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || isString(value)
}

function parseWorkspaceSnapshot(value: unknown): WorkspaceSnapshot | null {
  if (
    !isObjectLike(value) ||
    !Array.isArray(value.elements) ||
    !isObjectLike(value.appState) ||
    !isObjectLike(value.files)
  ) {
    return null
  }

  return {
    elements: value.elements as WorkspaceSnapshot["elements"],
    appState: normalizeWorkspaceAppState(
      value.appState as WorkspaceSnapshot["appState"],
    ),
    files: value.files as WorkspaceSnapshot["files"],
    version: typeof value.version === "number" ? value.version : 1,
  }
}

function parseWorkspaceDocumentDraft(
  value: unknown,
): WorkspaceDocumentDraft | null {
  if (!isObjectLike(value)) {
    return null
  }

  const snapshot = parseWorkspaceSnapshot(value.snapshot)

  if (!snapshot) {
    return null
  }

  return {
    id: isString(value.id) ? value.id : undefined,
    title: isString(value.title) ? value.title : undefined,
    filePath: isStringOrNull(value.filePath) ? value.filePath : undefined,
    snapshot,
    dirty: typeof value.dirty === "boolean" ? value.dirty : undefined,
    recovered: typeof value.recovered === "boolean" ? value.recovered : undefined,
    lastSavedAt: isStringOrNull(value.lastSavedAt)
      ? value.lastSavedAt
      : undefined,
    lastOpenedAt: isStringOrNull(value.lastOpenedAt)
      ? value.lastOpenedAt
      : undefined,
  }
}

function parseRecentFile(value: unknown): WorkspaceRecentFile | null {
  if (!isObjectLike(value)) {
    return null
  }

  if (
    !isString(value.filePath) ||
    !isString(value.title) ||
    !isString(value.lastTouchedAt)
  ) {
    return null
  }

  return {
    filePath: value.filePath,
    title: value.title,
    lastTouchedAt: value.lastTouchedAt,
  }
}

function normalizeRestoredUntitledTitles(
  documents: WorkspaceDocument[],
): WorkspaceDocument[] {
  let nextUntitledIndex = 1

  return documents.map((document) => {
    if (
      document.filePath ||
      !/^Untitled-(\d+)$/i.test(document.title)
    ) {
      return document
    }

    const normalizedTitle = createUntitledTitle(nextUntitledIndex)
    nextUntitledIndex += 1

    if (document.title === normalizedTitle) {
      return document
    }

    return {
      ...document,
      title: normalizedTitle,
    }
  })
}

async function getWorkspaceSessionPath() {
  const dataDir = await appDataDir()
  return join(dataDir, WORKSPACE_SESSION_FILE_NAME)
}

async function getWorkspaceSessionBackupPath() {
  const dataDir = await appDataDir()
  return join(dataDir, WORKSPACE_SESSION_BACKUP_FILE_NAME)
}

async function ensureWorkspaceSessionDirectory() {
  const dataDir = await appDataDir()
  await mkdir(dataDir, { recursive: true })
}

async function cleanupWorkspaceSessionArtifacts() {
  const dataDir = await appDataDir()
  const entries = await readDir(dataDir)
  const removals: Promise<unknown>[] = []

  for (const entry of entries) {
    if (!entry.name || !entry.name.startsWith(WORKSPACE_SESSION_TEMP_PREFIX)) {
      continue
    }

    const tempPath = await join(dataDir, entry.name)
    removals.push(remove(tempPath).catch(() => undefined))
  }

  await Promise.all(removals)
}

async function writeTextFileAtomic(filePath: string, contents: string) {
  const tempPath = `${filePath}.tmp-${Date.now()}`
  await writeTextFile(tempPath, contents)

  try {
    await rename(tempPath, filePath)
  } catch (error) {
    await remove(tempPath).catch(() => undefined)
    throw error
  }
}

async function readWorkspaceSessionRecord(
  filePath: string,
  restoredFromBackup: boolean,
): Promise<WorkspaceSessionLoadResult> {
  const raw = await readTextFile(filePath)
  let parsed: WorkspaceSessionRecordLike

  try {
    parsed = JSON.parse(raw) as WorkspaceSessionRecordLike
  } catch (error) {
    throw new Error(
      `Could not parse the workspace session: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  if (!isObjectLike(parsed)) {
    throw new Error("The workspace session file is malformed.")
  }

  const version = typeof parsed.version === "number" ? parsed.version : 1

  if (version !== 1) {
    throw new Error(`Unsupported workspace session version: ${version}.`)
  }

  const documents: WorkspaceDocument[] = []
  let skippedDocumentCount = 0

  if (Array.isArray(parsed.documents)) {
    parsed.documents.forEach((value, index) => {
      const draft = parseWorkspaceDocumentDraft(value)

      if (!draft) {
        skippedDocumentCount += 1
        return
      }

      const recovered =
        Boolean(draft.recovered) || !draft.filePath || Boolean(draft.dirty)

      documents.push(
        createWorkspaceDocument(
          {
            ...draft,
            recovered,
          },
          index + 1,
        ),
      )
    })
  }

  const recentFiles: WorkspaceRecentFile[] = []

  if (Array.isArray(parsed.recentFiles)) {
    parsed.recentFiles.forEach((value) => {
      const recentFile = parseRecentFile(value)

      if (!recentFile) {
        skippedDocumentCount += 1
        return
      }

      recentFiles.push(recentFile)
    })
  }

  const normalizedDocuments = normalizeRestoredUntitledTitles(documents)
  const recoveredDocumentCount = normalizedDocuments.filter(
    (document) => document.recovered,
  ).length
  const activeDocumentId =
    isString(parsed.activeDocumentId) &&
    normalizedDocuments.some((document) => document.id === parsed.activeDocumentId)
      ? parsed.activeDocumentId
      : normalizedDocuments[0]?.id ?? null

  const nextUntitledIndex = deriveNextUntitledIndex(normalizedDocuments)

  return {
    workspace: {
      documents: normalizedDocuments,
      activeDocumentId,
      nextUntitledIndex,
      recentFiles,
    },
    recoveredDocumentCount,
    skippedDocumentCount,
    restoredFromBackup,
  }
}

export async function loadWorkspaceSession(): Promise<WorkspaceSessionLoadResult | null> {
  await ensureWorkspaceSessionDirectory()
  await cleanupWorkspaceSessionArtifacts()

  const filePath = await getWorkspaceSessionPath()
  const backupPath = await getWorkspaceSessionBackupPath()
  const primaryExists = await exists(filePath)
  const backupExists = await exists(backupPath)

  if (!primaryExists && !backupExists) {
    return null
  }

  if (primaryExists) {
    try {
      return await readWorkspaceSessionRecord(filePath, false)
    } catch (primaryError) {
      if (!backupExists) {
        throw primaryError
      }

      try {
        return await readWorkspaceSessionRecord(backupPath, true)
      } catch (backupError) {
        throw new Error(
          `Could not restore the workspace session: ${
            primaryError instanceof Error
              ? primaryError.message
              : String(primaryError)
          }. Backup recovery also failed: ${
            backupError instanceof Error ? backupError.message : String(backupError)
          }`,
        )
      }
    }
  }

  return readWorkspaceSessionRecord(backupPath, true)
}

export async function saveWorkspaceSession(
  workspace: WorkspaceState,
): Promise<WorkspaceSessionSaveResult> {
  const filePath = await getWorkspaceSessionPath()
  const backupPath = await getWorkspaceSessionBackupPath()
  await ensureWorkspaceSessionDirectory()

  const record: WorkspaceSessionRecord = {
    version: 1,
    activeDocumentId: workspace.activeDocumentId,
    nextUntitledIndex: deriveNextUntitledIndex(workspace.documents),
    documents: workspace.documents.map((document) => ({
      ...document,
      snapshot: {
        ...document.snapshot,
        appState: normalizeWorkspaceAppState({
          ...document.snapshot.appState,
          collaborators: new Map(),
        }),
      },
    })),
    recentFiles: workspace.recentFiles.map((recentFile) => ({ ...recentFile })),
  }

  await writeTextFileAtomic(filePath, JSON.stringify(record, null, 2))
  let backupUpdated = true

  try {
    await copyFile(filePath, backupPath)
  } catch {
    backupUpdated = false
  }

  await cleanupWorkspaceSessionArtifacts()

  return {
    backupUpdated,
  }
}
