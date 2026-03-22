import { Excalidraw } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import {
  normalizeWorkspaceAppState,
  type WorkspaceDocument,
  type WorkspaceSnapshot,
} from "../model/workspace-model"

interface WorkspaceEditorProps {
  document: WorkspaceDocument
  className?: string
  onChange: (documentId: string, snapshot: WorkspaceSnapshot) => void
}

const SNAPSHOT_FLUSH_DELAY_MS = 120
const IMAGE_EXPORT_TOAST_ID = "workspace-image-export-feedback"

function WorkspaceEditorImpl({
  document,
  className,
  onChange,
}: WorkspaceEditorProps) {
  const onChangeRef = useRef(onChange)
  const pendingSnapshotRef = useRef<{
    documentId: string
    snapshot: WorkspaceSnapshot
  } | null>(null)
  const flushTimeoutRef = useRef<number | null>(null)
  const [initialData] = useState<{
    elements: WorkspaceSnapshot["elements"]
    appState: WorkspaceSnapshot["appState"] & {
      showWelcomeScreen: boolean
      theme: string
    }
    files: WorkspaceSnapshot["files"]
  }>(() => ({
      elements: document.snapshot.elements,
      appState: normalizeWorkspaceAppState({
        ...document.snapshot.appState,
        showWelcomeScreen: false,
        theme: document.snapshot.appState.theme ?? "light",
      }) as WorkspaceSnapshot["appState"] & {
        showWelcomeScreen: boolean
        theme: string
      },
      files: document.snapshot.files,
    }))

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const button = target.closest("button")

      if (!button?.closest(".ImageExportModal__settings__buttons")) {
        return
      }

      const label = button.textContent?.replace(/\s+/g, "").toUpperCase()

      if (label !== "PNG" && label !== "SVG") {
        return
      }

      window.setTimeout(() => {
        toast.success(`${label} downloaded`, {
          id: IMAGE_EXPORT_TOAST_ID,
          duration: 2400,
        })
      }, 0)
    }

    window.document.addEventListener("click", handleDocumentClick, true)

    return () => {
      window.document.removeEventListener("click", handleDocumentClick, true)
    }
  }, [])

  const flushPendingSnapshot = useCallback(() => {
    if (flushTimeoutRef.current !== null) {
      window.clearTimeout(flushTimeoutRef.current)
      flushTimeoutRef.current = null
    }

    const pendingSnapshot = pendingSnapshotRef.current

    if (!pendingSnapshot) {
      return
    }

    pendingSnapshotRef.current = null
    onChangeRef.current(pendingSnapshot.documentId, pendingSnapshot.snapshot)
  }, [])

  useEffect(() => {
    return () => {
      flushPendingSnapshot()
    }
  }, [document.id, flushPendingSnapshot])

  const handleChange = useCallback(
    (
      elements: WorkspaceSnapshot["elements"],
      appState: WorkspaceSnapshot["appState"],
      files: WorkspaceSnapshot["files"],
    ) => {
      pendingSnapshotRef.current = {
        documentId: document.id,
        snapshot: {
          elements,
          appState: normalizeWorkspaceAppState(appState),
          files,
          version: document.snapshot.version,
        },
      }

      if (flushTimeoutRef.current !== null) {
        return
      }

      flushTimeoutRef.current = window.setTimeout(() => {
        flushPendingSnapshot()
      }, SNAPSHOT_FLUSH_DELAY_MS)
    },
    [document.id, document.snapshot.version, flushPendingSnapshot],
  )

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full overflow-hidden bg-background",
        className,
      )}
    >
      <Excalidraw
        autoFocus
        handleKeyboardGlobally={false}
        initialData={initialData}
        name={document.title}
        theme={document.snapshot.appState.theme ?? "light"}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: {
              saveFileToDisk: true,
            },
            loadScene: true,
            saveToActiveFile: true,
            toggleTheme: true,
            saveAsImage: true,
          },
        }}
        onChange={handleChange}
        onPointerUp={flushPendingSnapshot}
      />
    </div>
  )
}

function areWorkspaceEditorPropsEqual(
  previousProps: WorkspaceEditorProps,
  nextProps: WorkspaceEditorProps,
) {
  if (
    previousProps.className !== nextProps.className ||
    previousProps.onChange !== nextProps.onChange
  ) {
    return false
  }

  return (
    previousProps.document.id === nextProps.document.id &&
    previousProps.document.title === nextProps.document.title &&
    previousProps.document.filePath === nextProps.document.filePath &&
    (previousProps.document.snapshot.appState.theme ?? "light") ===
      (nextProps.document.snapshot.appState.theme ?? "light")
  )
}

export const WorkspaceEditor = memo(
  WorkspaceEditorImpl,
  areWorkspaceEditorPropsEqual,
)
