import { useState } from "react"

import { cva } from "class-variance-authority"
import { FilePlus2Icon, PencilLineIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type { WorkspaceState } from "../model/workspace-model"

interface WorkspaceTabsProps {
  documents: WorkspaceState["documents"]
  activeDocumentId: string | null
  onCreateDocument: () => void
  onActivateDocument: (documentId: string) => void
  onCloseDocument: (documentId: string) => void
  onRenameDocument: (documentId: string, nextTitle: string) => boolean
}

const workspaceTabsListClassName =
  "flex h-10 items-center gap-1 overflow-x-auto rounded-xl border border-border/70 bg-muted/70 px-1 py-1 shadow-sm backdrop-blur"

const workspaceTabItemVariants = cva(
  "group relative flex h-8 shrink-0 items-center rounded-lg text-sm transition-all",
  {
    variants: {
      active: {
        true: "border border-border bg-background text-foreground shadow-sm",
        false:
          "border border-transparent bg-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
)

const workspaceTabActionClassName =
  "rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"

export function WorkspaceTabs({
  documents,
  activeDocumentId,
  onCreateDocument,
  onActivateDocument,
  onCloseDocument,
  onRenameDocument,
}: WorkspaceTabsProps) {
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")

  const cancelRename = () => {
    setEditingDocumentId(null)
    setRenameDraft("")
  }

  const commitRename = () => {
    if (!editingDocumentId) {
      return
    }

    const renamed = onRenameDocument(editingDocumentId, renameDraft)

    if (renamed) {
      cancelRename()
    }
  }

  return (
    <div className="absolute top-3 left-3 right-16 z-30">
      <div className={workspaceTabsListClassName}>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {documents.map((document) => {
            const isActive = document.id === activeDocumentId
            const isEditing = document.id === editingDocumentId

            const beginRename = () => {
              onActivateDocument(document.id)
              setEditingDocumentId(document.id)
              setRenameDraft(document.title)
            }

            return (
              <div
                key={document.id}
                data-active={isActive}
                className={cn(workspaceTabItemVariants({ active: isActive }))}
              >
                {isEditing ? (
                  <div className="flex min-w-0 items-center gap-2 px-2.5">
                    <span
                      aria-hidden
                      className={`size-2 shrink-0 rounded-full ${
                        document.dirty ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                    <Input
                      autoFocus
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          commitRename()
                        }

                        if (event.key === "Escape") {
                          event.preventDefault()
                          cancelRename()
                        }
                      }}
                      className="h-6 w-32 rounded-md text-sm"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex h-full min-w-0 items-center gap-2 rounded-lg px-2.5 pr-20 text-left"
                    onClick={() => onActivateDocument(document.id)}
                  >
                    <span
                      aria-hidden
                      className={`size-2 shrink-0 rounded-full ${
                        document.dirty ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                    <span
                      className={cn(
                        "max-w-28 truncate text-[0.92rem] font-medium",
                        isActive ? "text-foreground" : "text-foreground/65",
                      )}
                    >
                      {document.title}
                    </span>
                    {document.recovered ? (
                      <Badge
                        variant="secondary"
                        className="pointer-events-none h-5 rounded-md px-1.5 text-[0.66rem] font-medium"
                      >
                        Recovered
                      </Badge>
                    ) : null}
                  </button>
                )}

                {!isEditing ? (
                  <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
                    <button
                      type="button"
                      className={workspaceTabActionClassName}
                      aria-label={`Rename ${document.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        beginRename()
                      }}
                    >
                      <PencilLineIcon className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      className={workspaceTabActionClassName}
                      aria-label={`Close ${document.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onCloseDocument(document.id)
                      }}
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="h-8 w-8 shrink-0 rounded-lg"
          onClick={onCreateDocument}
        >
          <FilePlus2Icon className="size-4" />
          <span className="sr-only">New tab</span>
        </Button>
      </div>
    </div>
  )
}
