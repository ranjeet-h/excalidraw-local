import { useCallback, useEffect, useMemo, useState } from "react"

import {
  createMermaidDiagramTitle,
  createUntitledDocument,
  createWorkspaceDocument,
  createWorkspaceState,
  deriveNextUntitledIndex,
  duplicateWorkspaceDocument,
  formatWorkspaceExportFormat,
  upsertRecentFile,
  type WorkspaceDocument,
  type WorkspaceDocumentDraft,
  type WorkspaceExportFormat,
  type WorkspaceSnapshot,
  type WorkspaceState,
} from "./model/workspace-model"
import {
  confirmDiscardChanges,
  loadWorkspaceDocumentDraft,
  promptForSaveLocation,
  promptForWorkspaceFiles,
  WorkspaceFileConflictError,
  saveWorkspaceDocumentToPath,
  showFileError,
} from "./services/document-file-service"
import {
  exportWorkspaceDocumentToPath,
  promptForWorkspaceExportLocation,
} from "./services/workspace-export-service"
import { revealWorkspaceFileInFolder } from "./services/workspace-native-shell-service"
import {
  DEFAULT_MERMAID_SNIPPET,
  WorkspaceMermaidImportError,
  createMermaidWorkspacePreview,
  type WorkspaceMermaidPreview,
} from "./services/workspace-mermaid-service"
import { useWorkspaceAutosave } from "./hooks/use-workspace-autosave"
import { useWorkspaceFileDrop } from "./hooks/use-workspace-file-drop"
import { useWorkspaceOpenFileEvents } from "./hooks/use-workspace-open-file-events"
import { useWorkspaceSessionPersistence } from "./hooks/use-workspace-session-persistence"
import { useWorkspaceKeyboardShortcuts } from "./hooks/use-workspace-keyboard-shortcuts"
import { WorkspaceShellView } from "./components/workspace-shell-view"

export function WorkspaceShell() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(() =>
    createWorkspaceState(),
  )
  const [flashMessage, setFlashMessage] = useState("")
  const [fileDropActive, setFileDropActive] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameDraft, setRenameDraft] = useState("")
  const [mermaidDialogOpen, setMermaidDialogOpen] = useState(false)
  const [mermaidDraft, setMermaidDraft] = useState(DEFAULT_MERMAID_SNIPPET)
  const [mermaidPreview, setMermaidPreview] =
    useState<WorkspaceMermaidPreview | null>(null)
  const [mermaidPreviewing, setMermaidPreviewing] = useState(false)
  const [mermaidImporting, setMermaidImporting] = useState(false)
  const [mermaidImportError, setMermaidImportError] =
    useState<WorkspaceMermaidImportError | null>(null)

  const resolveMermaidImportError = useCallback((error: unknown) => {
    if (error instanceof WorkspaceMermaidImportError) {
      return error
    }

    return new WorkspaceMermaidImportError(
      "The Mermaid diagram could not be converted.",
      error instanceof Error ? error.message : String(error),
    )
  }, [])

  const activeDocument = useMemo<WorkspaceDocument | null>(() => {
    if (!workspace.activeDocumentId) {
      return null
    }

    return (
      workspace.documents.find(
        (document) => document.id === workspace.activeDocumentId,
      ) ?? null
    )
  }, [workspace.activeDocumentId, workspace.documents])

  useEffect(() => {
    document.title = activeDocument
      ? `${activeDocument.title} — Excalidraw Local`
      : "Excalidraw Local"
  }, [activeDocument])

  useEffect(() => {
    if (!flashMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setFlashMessage("")
    }, 2400)

    return () => window.clearTimeout(timeout)
  }, [flashMessage])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!workspace.documents.some((document) => document.dirty)) {
        return
      }

      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [workspace.documents])

  const showMessage = useCallback((message: string) => {
    setFlashMessage(message)
  }, [])

  const isHydrated = useWorkspaceSessionPersistence({
    workspace,
    setWorkspace,
    showMessage,
  })

  const activateDocument = useCallback((documentId: string) => {
    setWorkspace((current) => ({
      ...current,
      activeDocumentId: documentId,
    }))
  }, [])

  const renameDocument = useCallback(
    (documentId: string, nextTitle: string) => {
      const trimmedTitle = nextTitle.trim()

      if (!trimmedTitle) {
        showMessage("Tab title cannot be empty")
        return false
      }

      let renamedTitle = ""

      setWorkspace((current) => {
        const targetDocument = current.documents.find(
          (document) => document.id === documentId,
        )

        if (!targetDocument) {
          return current
        }

        renamedTitle = trimmedTitle
        const documents = current.documents.map((document) =>
          document.id === documentId
            ? {
                ...document,
                title: trimmedTitle,
              }
            : document,
        )

        return {
          ...current,
          documents,
          nextUntitledIndex: deriveNextUntitledIndex(documents),
          recentFiles: targetDocument.filePath
            ? current.recentFiles.map((recentFile) =>
                recentFile.filePath === targetDocument.filePath
                  ? {
                      ...recentFile,
                      title: trimmedTitle,
                    }
                  : recentFile,
              )
            : current.recentFiles,
        }
      })

      if (renamedTitle) {
        showMessage(`Renamed to ${renamedTitle}`)
        return true
      }

      return false
    },
    [showMessage],
  )

  const createDocument = useCallback(() => {
    setWorkspace((current) => {
      const nextUntitledIndex = deriveNextUntitledIndex(current.documents)
      const document = createUntitledDocument(nextUntitledIndex)
      const documents = [...current.documents, document]

      return {
        ...current,
        documents,
        activeDocumentId: document.id,
        nextUntitledIndex: deriveNextUntitledIndex(documents),
      }
    })

    showMessage("New drawing created")
  }, [showMessage])

  const duplicateDocument = useCallback(() => {
    if (!activeDocument) {
      showMessage("Open a drawing before duplicating it")
      return
    }

    setWorkspace((current) => {
      const source = current.documents.find(
        (document) => document.id === current.activeDocumentId,
      )

      if (!source) {
        return current
      }

      const duplicate = duplicateWorkspaceDocument(source)

      return {
        ...current,
        documents: [...current.documents, duplicate],
        activeDocumentId: duplicate.id,
      }
    })

    showMessage(`Duplicated ${activeDocument.title}`)
  }, [activeDocument, showMessage])

  const openRenameDialog = useCallback(() => {
    if (!activeDocument) {
      showMessage("Open a tab before renaming it")
      return
    }

    setRenameDraft(activeDocument.title)
    setRenameDialogOpen(true)
  }, [activeDocument, showMessage])

  const openMermaidImportDialog = useCallback(() => {
    if (!mermaidDraft.trim()) {
      setMermaidDraft(DEFAULT_MERMAID_SNIPPET)
    }

    setMermaidPreview(null)
    setMermaidImportError(null)
    setMermaidDialogOpen(true)
  }, [mermaidDraft])

  const handleMermaidDraftChange = useCallback((value: string) => {
    setMermaidDraft(value)
    setMermaidPreview(null)
    setMermaidImportError(null)
  }, [])

  const handleMermaidDialogOpenChange = useCallback((open: boolean) => {
    setMermaidDialogOpen(open)

    if (!open) {
      setMermaidPreview(null)
      setMermaidImportError(null)
      setMermaidPreviewing(false)
    }
  }, [])

  const openWorkspaceFiles = useCallback(
    async (filePaths: string[]) => {
      const uniquePaths = Array.from(
        new Set(filePaths.map((filePath) => filePath.trim()).filter(Boolean)),
      )

      if (uniquePaths.length === 0) {
        return
      }

      const existingDocuments = new Map(
        workspace.documents
          .filter((document) => document.filePath)
          .map((document) => [document.filePath!, document] as const),
      )

      const draftsByPath = new Map<string, WorkspaceDocumentDraft>()
      const failures: string[] = []

      for (const filePath of uniquePaths) {
        if (existingDocuments.has(filePath)) {
          continue
        }

        try {
          draftsByPath.set(filePath, await loadWorkspaceDocumentDraft(filePath))
        } catch (error) {
          failures.push(
            `${filePath}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      if (draftsByPath.size === 0 && failures.length > 0) {
        await showFileError(failures[0] ?? "Could not open the selected file.")
        return
      }

      setWorkspace((current) => {
        let documents = [...current.documents]
        let recentFiles = current.recentFiles
        let activeDocumentId = current.activeDocumentId
        const currentDocuments = new Map(
          documents
            .filter((document) => document.filePath)
            .map((document) => [document.filePath!, document] as const),
        )

        for (const filePath of uniquePaths) {
          const existingDocument = currentDocuments.get(filePath)

          if (existingDocument) {
            activeDocumentId = existingDocument.id
            recentFiles = upsertRecentFile(recentFiles, {
              filePath,
              title: existingDocument.title,
              lastTouchedAt: new Date().toISOString(),
            })
            continue
          }

          const loadedDraft = draftsByPath.get(filePath)

          if (!loadedDraft) {
            continue
          }

          const document = createWorkspaceDocument(
            {
              ...loadedDraft,
              filePath,
              dirty: false,
              recovered: false,
            },
            current.nextUntitledIndex,
          )

          documents = [...documents, document]
          activeDocumentId = document.id
          recentFiles = upsertRecentFile(recentFiles, {
            filePath,
            title: document.title,
            lastTouchedAt: loadedDraft.lastOpenedAt ?? new Date().toISOString(),
          })
        }

        return {
          ...current,
          documents,
          activeDocumentId,
          nextUntitledIndex: deriveNextUntitledIndex(documents),
          recentFiles,
        }
      })

      if (failures.length > 0) {
        showMessage(`Opened ${draftsByPath.size} file(s), skipped ${failures.length}.`)
        return
      }

      showMessage(
        uniquePaths.length === 1
          ? "File opened"
          : `${uniquePaths.length} files opened`,
      )
    },
    [showMessage, workspace.documents],
  )

  const handleOpenFiles = useCallback(async () => {
    const selectedFiles = await promptForWorkspaceFiles()

    if (selectedFiles.length === 0) {
      return
    }

    await openWorkspaceFiles(selectedFiles)
  }, [openWorkspaceFiles])

  const handleOpenRecentFile = useCallback(
    async (filePath: string) => {
      await openWorkspaceFiles([filePath])
    },
    [openWorkspaceFiles],
  )

  const persistDocumentToPath = useCallback(
    async (document: WorkspaceDocument, targetPath: string) => {
      try {
        const savedDocument = await saveWorkspaceDocumentToPath(document, targetPath)

        setWorkspace((current) => {
          const documents = current.documents.map((currentDocument) =>
            currentDocument.id === document.id
              ? {
                  ...currentDocument,
                  ...savedDocument,
                  filePath: targetPath,
                  recovered: false,
                }
              : currentDocument,
          )

          return {
            ...current,
            documents,
            nextUntitledIndex: deriveNextUntitledIndex(documents),
            recentFiles: upsertRecentFile(current.recentFiles, {
              filePath: targetPath,
              title: savedDocument.title,
              lastTouchedAt:
                savedDocument.lastSavedAt ?? new Date().toISOString(),
            }),
          }
        })

        return savedDocument
      } catch (error) {
        if (error instanceof WorkspaceFileConflictError) {
          showMessage(error.message)
          return null
        }

        await showFileError(
          `Could not save "${document.title}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        )

        return null
      }
    },
    [showMessage],
  )

  const saveDocumentToPath = useCallback(
    async (document: WorkspaceDocument, targetPath: string) => {
      const savedDocument = await persistDocumentToPath(document, targetPath)

      if (savedDocument) {
        showMessage(`Saved ${savedDocument.title}`)
      }

      return savedDocument
    },
    [persistDocumentToPath, showMessage],
  )

  const autosaveDocument = useCallback(
    async (document: WorkspaceDocument) => {
      if (!document.filePath) {
        return null
      }

      return persistDocumentToPath(document, document.filePath)
    },
    [persistDocumentToPath],
  )

  const handleSaveActiveDocumentAs = useCallback(async () => {
    if (!activeDocument) {
      showMessage("Open a tab before using Save As")
      return
    }

    const targetPath = await promptForSaveLocation(activeDocument)

    if (!targetPath) {
      showMessage("Save As cancelled")
      return
    }

    await saveDocumentToPath(activeDocument, targetPath)
  }, [activeDocument, saveDocumentToPath, showMessage])

  const handleSaveActiveDocument = useCallback(async () => {
    if (!activeDocument) {
      showMessage("Open a tab before saving")
      return
    }

    if (!activeDocument.filePath) {
      await handleSaveActiveDocumentAs()
      return
    }

    await saveDocumentToPath(activeDocument, activeDocument.filePath)
  }, [activeDocument, handleSaveActiveDocumentAs, saveDocumentToPath, showMessage])

  const exportDocument = useCallback(
    async (format: WorkspaceExportFormat) => {
      if (!activeDocument) {
        showMessage("Open a tab before exporting")
        return
      }

      const targetPath = await promptForWorkspaceExportLocation(
        activeDocument,
        format,
      )

      if (!targetPath) {
        showMessage("Export cancelled")
        return
      }

      try {
        await exportWorkspaceDocumentToPath(activeDocument, format, targetPath)
        showMessage(`Exported ${formatWorkspaceExportFormat(format)}`)
      } catch (error) {
        await showFileError(
          `Could not export "${activeDocument.title}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
    },
    [activeDocument, showMessage],
  )

  const handleExportActiveDocument = useCallback(() => {
    return exportDocument("png")
  }, [exportDocument])

  const handleRevealActiveDocumentInFolder = useCallback(async () => {
    if (!activeDocument) {
      showMessage("Open a tab before revealing it in a folder")
      return
    }

    if (!activeDocument.filePath) {
      showMessage("Save the active document before revealing it in a folder")
      return
    }

    try {
      await revealWorkspaceFileInFolder(activeDocument.filePath)
      showMessage(`Revealed ${activeDocument.title}`)
    } catch (error) {
      await showFileError(
        `Could not reveal "${activeDocument.title}" in its folder: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }, [activeDocument, showMessage])

  const updateDocumentSnapshot = useCallback(
    (documentId: string, snapshot: WorkspaceSnapshot) => {
      setWorkspace((current) => ({
        ...current,
        documents: current.documents.map((document) =>
          document.id === documentId
            ? {
                ...document,
                snapshot,
                dirty: true,
              }
            : document,
        ),
      }))
    },
    [],
  )

  const confirmRenameActiveDocument = useCallback(() => {
    if (!activeDocument) {
      setRenameDialogOpen(false)
      return
    }

    const renamed = renameDocument(activeDocument.id, renameDraft)

    if (renamed) {
      setRenameDialogOpen(false)
    }
  }, [activeDocument, renameDocument, renameDraft])

  const closeDocument = useCallback(
    async (documentId: string) => {
      const targetDocument = workspace.documents.find(
        (document) => document.id === documentId,
      )

      if (!targetDocument) {
        return
      }

      if (targetDocument.dirty) {
        const confirmed = await confirmDiscardChanges(
          `"${targetDocument.title}" has unsaved changes. Close it anyway?`,
        )

        if (!confirmed) {
          return
        }
      }

      setWorkspace((current) => {
        const closingIndex = current.documents.findIndex(
          (document) => document.id === documentId,
        )

        if (closingIndex === -1) {
          return current
        }

        const nextDocuments = current.documents.filter(
          (document) => document.id !== documentId,
        )
        const isActive = current.activeDocumentId === documentId
        const nextActiveDocument = isActive
          ? nextDocuments[closingIndex] ?? nextDocuments[closingIndex - 1] ?? null
          : current.documents.find(
              (document) => document.id === current.activeDocumentId,
            ) ?? null

        return {
          ...current,
          documents: nextDocuments,
          activeDocumentId: nextActiveDocument?.id ?? null,
          nextUntitledIndex: deriveNextUntitledIndex(nextDocuments),
        }
      })

      showMessage(`Closed ${targetDocument.title}`)
    },
    [showMessage, workspace.documents],
  )

  const switchDocument = useCallback((direction: 1 | -1) => {
    setWorkspace((current) => {
      if (current.documents.length === 0) {
        return current
      }

      const activeIndex = current.activeDocumentId
        ? current.documents.findIndex(
            (document) => document.id === current.activeDocumentId,
          )
        : 0
      const normalizedIndex =
        activeIndex === -1
          ? 0
          : (activeIndex + direction + current.documents.length) %
            current.documents.length

      return {
        ...current,
        activeDocumentId: current.documents[normalizedIndex]?.id ?? null,
      }
    })
  }, [])

  const previewMermaidImport = useCallback(async () => {
    setMermaidPreviewing(true)

    try {
      const preview = await createMermaidWorkspacePreview(mermaidDraft)

      setMermaidPreview(preview)
      setMermaidImportError(null)
      showMessage(
        `Preview ready: ${preview.elementCount} ${
          preview.elementCount === 1 ? "shape" : "shapes"
        }`,
      )
    } catch (error) {
      setMermaidPreview(null)
      setMermaidImportError(resolveMermaidImportError(error))
    } finally {
      setMermaidPreviewing(false)
    }
  }, [mermaidDraft, resolveMermaidImportError, showMessage])

  const confirmMermaidImport = useCallback(async () => {
    if (!mermaidDraft.trim()) {
      showMessage("Paste Mermaid text before creating a diagram")
      return
    }

    setMermaidImporting(true)

    try {
      const nextPreview =
        mermaidPreview?.definition === mermaidDraft.trim()
          ? mermaidPreview
          : await createMermaidWorkspacePreview(mermaidDraft)
      let createdTitle = ""

      setWorkspace((current) => {
        createdTitle = createMermaidDiagramTitle(current.nextUntitledIndex)
        const document = createWorkspaceDocument(
          {
            title: createdTitle,
            snapshot: nextPreview.snapshot,
            dirty: true,
            recovered: false,
          },
          current.nextUntitledIndex,
        )

        return {
          ...current,
          documents: [...current.documents, document],
          activeDocumentId: document.id,
          nextUntitledIndex: current.nextUntitledIndex + 1,
        }
      })

      setMermaidDraft(DEFAULT_MERMAID_SNIPPET)
      setMermaidPreview(null)
      setMermaidImportError(null)
      setMermaidDialogOpen(false)
      showMessage(`Created ${createdTitle || "a Mermaid"} tab`)
    } catch (error) {
      setMermaidPreview(null)
      setMermaidImportError(resolveMermaidImportError(error))
    } finally {
      setMermaidImporting(false)
    }
  }, [mermaidDraft, mermaidPreview, resolveMermaidImportError, showMessage])

  const copyMermaidErrorDetails = useCallback(async () => {
    if (!mermaidImportError) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        `${mermaidImportError.summary}\n\n${mermaidImportError.details}`,
      )
      showMessage("Copied Mermaid error details")
    } catch (error) {
      await showFileError(
        `Could not copy Mermaid error details: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }, [mermaidImportError, showMessage])

  const openMermaidImport = useCallback(() => {
    openMermaidImportDialog()
  }, [openMermaidImportDialog])

  useWorkspaceKeyboardShortcuts({
    activeDocument,
    createDocument,
    closeDocument,
    switchDocument,
    handleOpenFiles,
    handleSaveActiveDocument,
    handleSaveActiveDocumentAs,
    handleExportActiveDocument,
    openMermaidImport,
  })

  useWorkspaceAutosave({
    documents: workspace.documents,
    isEnabled: isHydrated,
    saveDocument: autosaveDocument,
    showMessage,
  })

  useWorkspaceFileDrop({
    onDropFiles: openWorkspaceFiles,
    onDragStateChange: setFileDropActive,
  })

  useWorkspaceOpenFileEvents({
    enabled: isHydrated,
    onOpenFiles: openWorkspaceFiles,
  })

  return (
    <WorkspaceShellView
      workspace={workspace}
      activeDocument={activeDocument}
      fileDropActive={fileDropActive}
      sidebarOpen={sidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
      onCreateDocument={createDocument}
      onDuplicateDocument={duplicateDocument}
      onCloseDocument={closeDocument}
      onActivateDocument={activateDocument}
      onRenameDocument={renameDocument}
      onOpenFiles={handleOpenFiles}
      onOpenRecentFile={handleOpenRecentFile}
      onSaveActiveDocument={handleSaveActiveDocument}
      onSaveActiveDocumentAs={handleSaveActiveDocumentAs}
      onRevealActiveDocumentInFolder={handleRevealActiveDocumentInFolder}
      onExportDocument={exportDocument}
      onSwitchDocument={switchDocument}
      onOpenMermaidImport={openMermaidImportDialog}
      renameDialogOpen={renameDialogOpen}
      renameDraft={renameDraft}
      onRenameDraftChange={setRenameDraft}
      onRenameDialogOpenChange={setRenameDialogOpen}
      onConfirmRename={confirmRenameActiveDocument}
      onOpenRenameDialog={openRenameDialog}
      onUpdateDocumentSnapshot={updateDocumentSnapshot}
      mermaidDialogOpen={mermaidDialogOpen}
      mermaidDraft={mermaidDraft}
      mermaidPreview={mermaidPreview}
      mermaidErrorSummary={mermaidImportError?.summary ?? null}
      mermaidErrorDetails={mermaidImportError?.details ?? null}
      mermaidPreviewing={mermaidPreviewing}
      mermaidImporting={mermaidImporting}
      onMermaidDraftChange={handleMermaidDraftChange}
      onMermaidDialogOpenChange={handleMermaidDialogOpenChange}
      onPreviewMermaidImport={previewMermaidImport}
      onConfirmMermaidImport={confirmMermaidImport}
      onCopyMermaidErrorDetails={copyMermaidErrorDetails}
    />
  )
}
