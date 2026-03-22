import { memo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { FileTextIcon, FolderSearchIcon, XIcon } from "lucide-react"

import { formatWorkspaceTimestamp } from "../model/workspace-model"
import type {
  WorkspaceDocument,
  WorkspaceState,
} from "../model/workspace-model"

function SidebarStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function SidebarShortcut({
  label,
  keys,
}: {
  label: string
  keys: string[]
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={`${label}-${key}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <span className="text-muted-foreground">+</span> : null}
            <Kbd>{key}</Kbd>
          </span>
        ))}
      </div>
    </div>
  )
}

function RecentFileItem({
  filePath,
  title,
  lastTouchedAt,
  onOpen,
}: {
  filePath: string
  title: string
  lastTouchedAt: string
  onOpen: (filePath: string) => Promise<void>
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full justify-start rounded-xl border border-border/70 bg-background px-3 py-3 text-left"
      onClick={() => void onOpen(filePath)}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="truncate text-sm font-medium text-foreground">{title}</div>
          <div className="truncate text-xs text-muted-foreground">{filePath}</div>
        </div>
        <div className="shrink-0 text-right text-[11px] text-muted-foreground">
          <div className="uppercase tracking-[0.16em]">Updated</div>
          <div className="mt-1">{formatWorkspaceTimestamp(lastTouchedAt)}</div>
        </div>
      </div>
    </Button>
  )
}

export interface WorkspaceSidebarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: WorkspaceState
  activeDocument: WorkspaceDocument | null
  onActivateDocument: (documentId: string) => void
  onCloseDocument: (documentId: string) => void
  onOpenRecentFile: (filePath: string) => Promise<void>
  onRevealActiveDocumentInFolder: () => Promise<void>
}

function WorkspaceSidebarSheetImpl({
  open,
  onOpenChange,
  workspace,
  activeDocument,
  onActivateDocument,
  onCloseDocument,
  onOpenRecentFile,
  onRevealActiveDocumentInFolder,
}: WorkspaceSidebarSheetProps) {
  const recentFiles = workspace.recentFiles.slice(0, 4)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[min(24rem,calc(100vw-1rem))] p-0"
        showCloseButton={false}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-border/70 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Workspace panel
                </div>
                <SheetTitle>History, tabs, and shortcuts</SheetTitle>
                <SheetDescription className="max-w-[18rem]">
                  Keep recent files and recovery details close without crowding the
                  canvas.
                </SheetDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-full"
                aria-label="Close workspace panel"
                onClick={() => onOpenChange(false)}
              >
                <XIcon />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SidebarStat
                label="Tabs open"
                value={`${workspace.documents.length} ${
                  workspace.documents.length === 1 ? "tab" : "tabs"
                }`}
              />
              <SidebarStat
                label="Active document"
                value={activeDocument ? activeDocument.title : "None"}
              />
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={!activeDocument?.filePath}
                onClick={() => void onRevealActiveDocumentInFolder()}
              >
                <FolderSearchIcon />
                Reveal active file in folder
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Open tabs</h3>
                <Badge variant="outline">
                  {activeDocument ? activeDocument.title : "None active"}
                </Badge>
              </div>

              {workspace.documents.length > 0 ? (
                <div className="grid gap-2">
                  {workspace.documents.map((document) => (
                    <div
                      key={document.id}
                      role="button"
                      tabIndex={0}
                      className={`flex h-auto w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors hover:bg-muted/40 ${
                        document.id === activeDocument?.id
                          ? "border-primary bg-secondary/30"
                          : "border-border/70 bg-background"
                      }`}
                      onClick={() => onActivateDocument(document.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          onActivateDocument(document.id)
                        }
                      }}
                    >
                      <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileTextIcon className="size-4 shrink-0 text-primary" />
                          <span className="truncate text-sm font-medium text-foreground">
                            {document.title}
                          </span>
                          {document.recovered ? (
                            <Badge variant="secondary" className="shrink-0">
                              Recovered
                            </Badge>
                          ) : null}
                          {document.dirty ? (
                            <span
                              aria-label="Unsaved changes"
                              className="size-1.5 rounded-full bg-primary"
                            />
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Close ${document.title}`}
                          className="shrink-0"
                          onClick={(event) => {
                            event.stopPropagation()
                            onCloseDocument(document.id)
                          }}
                        >
                          <XIcon />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  No tabs are open right now.
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Recent files</h3>
                <Badge variant="outline">
                  {workspace.recentFiles.length > 0
                    ? `${workspace.recentFiles.length} files`
                    : "Empty"}
                </Badge>
              </div>

              {recentFiles.length > 0 ? (
                <div className="grid gap-2">
                  {recentFiles.map((recentFile) => (
                    <RecentFileItem
                      key={recentFile.filePath}
                      filePath={recentFile.filePath}
                      title={recentFile.title}
                      lastTouchedAt={recentFile.lastTouchedAt}
                      onOpen={onOpenRecentFile}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Open or save a file to build a recent-files list.
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Shortcuts</h3>
                <Badge variant="secondary">Mac-first</Badge>
              </div>

              <div className="grid gap-2">
                <SidebarShortcut label="New drawing" keys={["⌘", "N"]} />
                <SidebarShortcut label="Open file" keys={["⌘", "O"]} />
                <SidebarShortcut label="Save" keys={["⌘", "S"]} />
                <SidebarShortcut label="Save As" keys={["⇧", "⌘", "S"]} />
                <SidebarShortcut label="Close tab" keys={["⌘", "W"]} />
              </div>
              <div className="px-1 text-xs text-muted-foreground">
                Export, Mermaid import, and tab switching live in the top-right menu.
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function areWorkspaceSidebarSheetPropsEqual(
  previousProps: WorkspaceSidebarSheetProps,
  nextProps: WorkspaceSidebarSheetProps,
) {
  if (
    previousProps.open !== nextProps.open ||
    previousProps.onOpenChange !== nextProps.onOpenChange ||
    previousProps.onActivateDocument !== nextProps.onActivateDocument ||
    previousProps.onCloseDocument !== nextProps.onCloseDocument ||
    previousProps.onOpenRecentFile !== nextProps.onOpenRecentFile ||
    previousProps.onRevealActiveDocumentInFolder !==
      nextProps.onRevealActiveDocumentInFolder ||
    previousProps.activeDocument?.id !== nextProps.activeDocument?.id ||
    previousProps.activeDocument?.title !== nextProps.activeDocument?.title ||
    previousProps.activeDocument?.filePath !== nextProps.activeDocument?.filePath ||
    previousProps.workspace.documents.length !== nextProps.workspace.documents.length ||
    previousProps.workspace.recentFiles.length !==
      nextProps.workspace.recentFiles.length
  ) {
    return false
  }

  const documentsMatch = previousProps.workspace.documents.every(
    (document, index) => {
      const nextDocument = nextProps.workspace.documents[index]

      return (
        document.id === nextDocument?.id &&
        document.title === nextDocument.title &&
        document.dirty === nextDocument.dirty &&
        document.recovered === nextDocument.recovered &&
        document.filePath === nextDocument.filePath
      )
    },
  )

  if (!documentsMatch) {
    return false
  }

  return previousProps.workspace.recentFiles.every((recentFile, index) => {
    const nextRecentFile = nextProps.workspace.recentFiles[index]

    return (
      recentFile.filePath === nextRecentFile?.filePath &&
      recentFile.title === nextRecentFile.title &&
      recentFile.lastTouchedAt === nextRecentFile.lastTouchedAt
    )
  })
}

export const WorkspaceSidebarSheet = memo(
  WorkspaceSidebarSheetImpl,
  areWorkspaceSidebarSheetPropsEqual,
)
