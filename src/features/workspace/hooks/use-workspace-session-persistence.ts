import { useEffect, useState } from "react"
import type { Dispatch, SetStateAction } from "react"

import { showFileError } from "../services/document-file-service"
import {
  loadWorkspaceSession,
  saveWorkspaceSession,
} from "../services/workspace-session-service"
import type { WorkspaceState } from "../model/workspace-model"

export interface WorkspaceSessionPersistenceOptions {
  workspace: WorkspaceState
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>
  showMessage: (message: string) => void
}

function formatRestoreMessage(
  recoveredDocumentCount: number,
  restoredDocumentCount: number,
  skippedDocumentCount: number,
  restoredFromBackup: boolean,
) {
  const recoveredLabel =
    recoveredDocumentCount === 1 ? "tab" : "tabs"
  const restoredLabel = restoredDocumentCount === 1 ? "tab" : "tabs"
  const skippedLabel = skippedDocumentCount === 1 ? "entry" : "entries"
  const backupLabel = restoredFromBackup ? " from the session backup" : ""

  if (recoveredDocumentCount > 0) {
    return skippedDocumentCount > 0
      ? `Recovered ${recoveredDocumentCount} ${recoveredLabel}${backupLabel} and skipped ${skippedDocumentCount} damaged ${skippedLabel}.`
      : `Recovered ${recoveredDocumentCount} ${recoveredLabel}${backupLabel}.`
  }

  if (restoredDocumentCount > 0) {
    return skippedDocumentCount > 0
      ? `Restored ${restoredDocumentCount} ${restoredLabel}${backupLabel} and skipped ${skippedDocumentCount} damaged ${skippedLabel}.`
      : `Restored ${restoredDocumentCount} ${restoredLabel}${backupLabel}.`
  }

  return skippedDocumentCount > 0
    ? `Skipped ${skippedDocumentCount} damaged ${skippedLabel} while restoring the previous session.`
    : ""
}

export function useWorkspaceSessionPersistence({
  workspace,
  setWorkspace,
  showMessage,
}: WorkspaceSessionPersistenceOptions) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false

    const restoreWorkspace = async () => {
      try {
        const session = await loadWorkspaceSession()

        if (cancelled) {
          return
        }

        if (session) {
          setWorkspace(session.workspace)

          const restoreMessage = formatRestoreMessage(
            session.recoveredDocumentCount,
            session.workspace.documents.length,
            session.skippedDocumentCount,
            session.restoredFromBackup,
          )

          if (restoreMessage) {
            showMessage(restoreMessage)
          }
        }
      } catch (error) {
        if (!cancelled) {
          await showFileError(
            `Could not restore the previous session: ${
              error instanceof Error ? error.message : String(error)
            }`,
          )
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true)
        }
      }
    }

    void restoreWorkspace()

    return () => {
      cancelled = true
    }
  }, [setWorkspace, showMessage])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const timeout = window.setTimeout(() => {
      void saveWorkspaceSession(workspace)
        .then((result) => {
          if (!result.backupUpdated) {
            showMessage(
              "Saved the workspace session, but the recovery backup could not be refreshed.",
            )
          }
        })
        .catch((error) => {
          void showFileError(
            `Could not save the workspace session: ${
              error instanceof Error ? error.message : String(error)
            }`,
          )
        })
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [isHydrated, showMessage, workspace])

  return isHydrated
}
