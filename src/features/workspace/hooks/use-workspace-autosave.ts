import { useEffect } from "react"

import type { WorkspaceDocument } from "../model/workspace-model"

export interface WorkspaceAutosaveOptions {
  documents: WorkspaceDocument[]
  isEnabled: boolean
  saveDocument: (documentId: string) => Promise<Pick<WorkspaceDocument, "title"> | null>
}

export function useWorkspaceAutosave({
  documents,
  isEnabled,
  saveDocument,
}: WorkspaceAutosaveOptions) {
  useEffect(() => {
    if (!isEnabled) {
      return
    }

    const timeoutIds = documents
      .filter((document) => document.filePath && document.dirty)
      .map((document) =>
        window.setTimeout(() => {
          void saveDocument(document.id)
        }, 900),
      )

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [documents, isEnabled, saveDocument])
}
