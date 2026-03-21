import { useEffect } from "react"

import type { WorkspaceDocument } from "../model/workspace-model"

export interface WorkspaceAutosaveOptions {
  documents: WorkspaceDocument[]
  isEnabled: boolean
  saveDocument: (
    document: WorkspaceDocument,
  ) => Promise<Pick<WorkspaceDocument, "title"> | null>
  showMessage: (message: string) => void
}

export function useWorkspaceAutosave({
  documents,
  isEnabled,
  saveDocument,
  showMessage,
}: WorkspaceAutosaveOptions) {
  useEffect(() => {
    if (!isEnabled) {
      return
    }

    const timeoutIds = documents
      .filter((document) => document.filePath && document.dirty)
      .map((document) =>
        window.setTimeout(() => {
          void saveDocument(document).then((savedDocument) => {
            if (savedDocument) {
              showMessage(`Autosaved ${savedDocument.title}`)
            }
          })
        }, 900),
      )

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [documents, isEnabled, saveDocument, showMessage])
}
