import { invoke } from "@tauri-apps/api/core"

export async function revealWorkspaceFileInFolder(filePath: string) {
  return invoke("reveal_in_folder", { path: filePath })
}
