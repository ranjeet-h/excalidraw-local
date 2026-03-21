import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

const WORKSPACE_OPEN_FILES_EVENT = "workspace://open-files"

export async function consumePendingWorkspaceOpenFiles() {
  return invoke<string[]>("consume_pending_open_files")
}

export async function listenForWorkspaceOpenFiles(
  onOpenFiles: (filePaths: string[]) => void | Promise<void>,
) {
  return listen<string[]>(WORKSPACE_OPEN_FILES_EVENT, (event) => {
    void onOpenFiles(event.payload)
  })
}
