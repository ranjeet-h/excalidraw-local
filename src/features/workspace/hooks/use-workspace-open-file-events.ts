import { useEffect } from "react"

import {
  consumePendingWorkspaceOpenFiles,
  listenForWorkspaceOpenFiles,
} from "../services/workspace-open-file-event-service"

export interface WorkspaceOpenFileEventsOptions {
  enabled: boolean
  onOpenFiles: (filePaths: string[]) => void | Promise<void>
}

export function useWorkspaceOpenFileEvents({
  enabled,
  onOpenFiles,
}: WorkspaceOpenFileEventsOptions) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    let isMounted = true
    let disposed = false
    let unlisten: (() => void) | null = null

    const safeDispose = () => {
      if (disposed || !unlisten) {
        return
      }

      disposed = true

      try {
        unlisten()
      } catch {
        // Tauri may already have dropped the listener during a fast remount.
      }
    }

    void consumePendingWorkspaceOpenFiles()
      .then((filePaths) => {
        if (!isMounted || filePaths.length === 0) {
          return
        }

        void onOpenFiles(filePaths)
      })
      .catch(() => undefined)

    void listenForWorkspaceOpenFiles((filePaths) => {
      if (!isMounted || filePaths.length === 0) {
        return
      }

      return onOpenFiles(filePaths)
    }).then((dispose) => {
      unlisten = dispose

      if (!isMounted) {
        safeDispose()
      }
    }).catch(() => undefined)

    return () => {
      isMounted = false
      safeDispose()
    }
  }, [enabled, onOpenFiles])
}
