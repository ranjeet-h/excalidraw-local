import { convertToExcalidrawElements } from "@excalidraw/excalidraw"
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw"

import {
  createEmptySnapshot,
  createMermaidDiagramTitle,
  type WorkspaceSnapshot,
} from "../model/workspace-model"

export const DEFAULT_MERMAID_SNIPPET = `flowchart TD
  A[Start] --> B{Need a new diagram?}
  B -->|Yes| C[Create a Mermaid tab]
  B -->|No| D[Keep drawing]
  C --> E[Export or save when ready]`

export interface WorkspaceMermaidPreview {
  definition: string
  snapshot: WorkspaceSnapshot
  elementCount: number
  fileCount: number
}

export class WorkspaceMermaidImportError extends Error {
  summary: string
  details: string

  constructor(summary: string, details: string) {
    super(summary)
    this.name = "WorkspaceMermaidImportError"
    this.summary = summary
    this.details = details
  }
}

function createMermaidImportError(error: unknown) {
  const details = error instanceof Error ? error.message : String(error)

  return new WorkspaceMermaidImportError(
    "The Mermaid diagram could not be converted.",
    details,
  )
}

export async function createMermaidWorkspacePreview(
  definition: string,
): Promise<WorkspaceMermaidPreview> {
  const text = definition.trim()

  if (!text) {
    throw new WorkspaceMermaidImportError(
      "Paste Mermaid text before previewing the diagram.",
      "The Mermaid input is empty.",
    )
  }

  try {
    const parsedDiagram = await parseMermaidToExcalidraw(text)
    const elements = convertToExcalidrawElements(parsedDiagram.elements, {
      regenerateIds: true,
    })
    const files = parsedDiagram.files ?? {}
    const snapshot = createEmptySnapshot()

    return {
      definition: text,
      snapshot: {
        ...snapshot,
        elements,
        files,
      },
      elementCount: elements.length,
      fileCount: Object.keys(files).length,
    }
  } catch (error) {
    throw createMermaidImportError(error)
  }
}

export async function createMermaidWorkspaceSnapshot(
  definition: string,
): Promise<WorkspaceSnapshot> {
  const preview = await createMermaidWorkspacePreview(definition)
  return preview.snapshot
}

export function createMermaidWorkspaceTitle(index: number) {
  return createMermaidDiagramTitle(index)
}
