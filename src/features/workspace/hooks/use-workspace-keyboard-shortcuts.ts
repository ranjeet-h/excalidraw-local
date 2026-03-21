import { useEffect, useRef } from "react"

import type { WorkspaceDocument } from "../model/workspace-model"

export interface WorkspaceKeyboardShortcutActions {
  activeDocument: WorkspaceDocument | null
  createDocument: () => void
  closeDocument: (documentId: string) => void
  switchDocument: (direction: 1 | -1) => void
  handleOpenFiles: () => Promise<void>
  handleSaveActiveDocument: () => Promise<void>
  handleSaveActiveDocumentAs: () => Promise<void>
  handleExportActiveDocument: () => Promise<void>
  openMermaidImport: () => void
}

export function useWorkspaceKeyboardShortcuts(
  actions: WorkspaceKeyboardShortcutActions,
) {
  const actionsRef = useRef(actions)

  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey

      if (!isMod) {
        return
      }

      const target = event.target

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            "input, textarea, select, [role='textbox'], [contenteditable='true']",
          ) !== null)
      ) {
        return
      }

      const currentActions = actionsRef.current
      const key = event.key.toLowerCase()

      if (key === "n") {
        event.preventDefault()
        currentActions.createDocument()
        return
      }

      if (key === "w") {
        event.preventDefault()
        if (currentActions.activeDocument) {
          currentActions.closeDocument(currentActions.activeDocument.id)
        }
        return
      }

      if (key === "tab") {
        event.preventDefault()
        currentActions.switchDocument(event.shiftKey ? -1 : 1)
        return
      }

      if (key === "o") {
        event.preventDefault()
        void currentActions.handleOpenFiles()
        return
      }

      if (key === "s" && event.shiftKey) {
        event.preventDefault()
        void currentActions.handleSaveActiveDocumentAs()
        return
      }

      if (key === "s") {
        event.preventDefault()
        void currentActions.handleSaveActiveDocument()
        return
      }

      if (key === "m") {
        event.preventDefault()
        currentActions.openMermaidImport()
        return
      }

      if (key === "e") {
        event.preventDefault()
        void currentActions.handleExportActiveDocument()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
