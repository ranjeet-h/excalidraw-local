import { useEffect, useEffectEvent } from "react"

import type { WorkspaceDocument } from "../model/workspace-model"

export interface WorkspaceKeyboardShortcutActions {
  activeDocument: WorkspaceDocument | null
  createDocument: () => void
  duplicateDocument: () => void
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
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
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

    const key = event.key.toLowerCase()

    if (key === "n") {
      event.preventDefault()
      actions.createDocument()
      return
    }

    if (key === "w") {
      event.preventDefault()
      if (actions.activeDocument) {
        actions.closeDocument(actions.activeDocument.id)
      }
      return
    }

    if (key === "d") {
      event.preventDefault()
      actions.duplicateDocument()
      return
    }

    if (event.altKey && key === "arrowleft") {
      event.preventDefault()
      actions.switchDocument(-1)
      return
    }

    if (event.altKey && key === "arrowright") {
      event.preventDefault()
      actions.switchDocument(1)
      return
    }

    if (key === "o") {
      event.preventDefault()
      void actions.handleOpenFiles()
      return
    }

    if (key === "s" && event.shiftKey) {
      event.preventDefault()
      void actions.handleSaveActiveDocumentAs()
      return
    }

    if (key === "s") {
      event.preventDefault()
      void actions.handleSaveActiveDocument()
      return
    }

    if (key === "m") {
      event.preventDefault()
      actions.openMermaidImport()
      return
    }

    if (key === "e") {
      event.preventDefault()
      void actions.handleExportActiveDocument()
    }
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown(event)
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [])
}
