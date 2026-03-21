import { useEffect } from "react"

import { getCurrentWebview } from "@tauri-apps/api/webview"

export interface WorkspaceFileDropOptions {
  onDropFiles: (filePaths: string[]) => void | Promise<void>
  onDragStateChange: (active: boolean) => void
}

export function useWorkspaceFileDrop({
  onDropFiles,
  onDragStateChange,
}: WorkspaceFileDropOptions) {
  useEffect(() => {
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

    void getCurrentWebview()
      .onDragDropEvent((event) => {
        if (!isMounted) {
          return
        }

        switch (event.payload.type) {
          case "enter":
          case "over":
            onDragStateChange(true)
            return
          case "drop":
            onDragStateChange(false)
            void onDropFiles(event.payload.paths)
            return
          case "leave":
            onDragStateChange(false)
        }
      })
      .then((dispose) => {
        unlisten = dispose

        if (!isMounted) {
          safeDispose()
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
      onDragStateChange(false)
      safeDispose()
    }
  }, [onDragStateChange, onDropFiles])
}
