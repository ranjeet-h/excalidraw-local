import { Excalidraw } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { useCallback, useState } from "react"

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

export function WorkspaceEditor({
  document,
  className,
  onChange,
}: WorkspaceEditorProps) {
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

  const handleChange = useCallback(
    (
      elements: WorkspaceSnapshot["elements"],
      appState: WorkspaceSnapshot["appState"],
      files: WorkspaceSnapshot["files"],
    ) => {
      onChange(document.id, {
        elements,
        appState: normalizeWorkspaceAppState(appState),
        files,
        version: document.snapshot.version,
      })
    },
    [document.id, document.snapshot.version, onChange],
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
            loadScene: false,
            saveToActiveFile: false,
            saveAsImage: false,
            export: false,
            toggleTheme: false,
          },
        }}
        onChange={handleChange}
      />
    </div>
  )
}
