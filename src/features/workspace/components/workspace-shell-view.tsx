import {
  CopyIcon,
  FilePlus2Icon,
  FileUpIcon,
  FolderSearchIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  MoreHorizontalIcon,
  SaveIcon,
  SparklesIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"

import { WorkspaceEditor } from "./workspace-editor"
import { WorkspaceMermaidDialog } from "./workspace-mermaid-dialog"
import { WorkspaceSidebarSheet } from "./workspace-sidebar-sheet"
import { WorkspaceTabs } from "./workspace-tabs"
import type {
  WorkspaceDocument,
  WorkspaceExportFormat,
  WorkspaceSnapshot,
  WorkspaceState,
} from "../model/workspace-model"
import type { WorkspaceMermaidPreview } from "../services/workspace-mermaid-service"

export interface WorkspaceShellViewProps {
  workspace: WorkspaceState
  activeDocument: WorkspaceDocument | null
  fileDropActive: boolean
  sidebarOpen: boolean
  onSidebarOpenChange: (open: boolean) => void
  onCreateDocument: () => void
  onDuplicateDocument: () => void
  onCloseDocument: (documentId: string) => void
  onActivateDocument: (documentId: string) => void
  onRenameDocument: (documentId: string, nextTitle: string) => boolean
  onOpenFiles: () => Promise<void>
  onOpenRecentFile: (filePath: string) => Promise<void>
  onSaveActiveDocument: () => Promise<void>
  onSaveActiveDocumentAs: () => Promise<void>
  onRevealActiveDocumentInFolder: () => Promise<void>
  onExportDocument: (format: WorkspaceExportFormat) => Promise<void>
  onSwitchDocument: (direction: 1 | -1) => void
  onOpenMermaidImport: () => void
  renameDialogOpen: boolean
  renameDraft: string
  onRenameDraftChange: (value: string) => void
  onRenameDialogOpenChange: (open: boolean) => void
  onConfirmRename: () => void
  onOpenRenameDialog: () => void
  onUpdateDocumentSnapshot: (
    documentId: string,
    snapshot: WorkspaceSnapshot,
  ) => void
  mermaidDialogOpen: boolean
  mermaidDraft: string
  mermaidPreview: WorkspaceMermaidPreview | null
  mermaidErrorSummary: string | null
  mermaidErrorDetails: string | null
  mermaidPreviewing: boolean
  mermaidImporting: boolean
  onMermaidDraftChange: (value: string) => void
  onMermaidDialogOpenChange: (open: boolean) => void
  onPreviewMermaidImport: () => void
  onConfirmMermaidImport: () => void
  onCopyMermaidErrorDetails: () => void
}

function WorkspaceQuickMenu({
  activeDocument,
  tabCount,
  sidebarOpen,
  onSidebarOpenChange,
  onCreateDocument,
  onDuplicateDocument,
  onOpenFiles,
  onSaveActiveDocument,
  onSaveActiveDocumentAs,
  onRevealActiveDocumentInFolder,
  onExportDocument,
  onSwitchDocument,
  onOpenMermaidImport,
  onOpenRenameDialog,
}: {
  activeDocument: WorkspaceDocument | null
  tabCount: number
  sidebarOpen: boolean
  onSidebarOpenChange: (open: boolean) => void
  onCreateDocument: () => void
  onDuplicateDocument: () => void
  onOpenFiles: () => Promise<void>
  onSaveActiveDocument: () => Promise<void>
  onSaveActiveDocumentAs: () => Promise<void>
  onRevealActiveDocumentInFolder: () => Promise<void>
  onExportDocument: (format: WorkspaceExportFormat) => Promise<void>
  onSwitchDocument: (direction: 1 | -1) => void
  onOpenMermaidImport: () => void
  onOpenRenameDialog: () => void
}) {
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-30">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="pointer-events-auto h-10 w-10 rounded-full border border-border/70 bg-background/90 shadow-sm backdrop-blur"
          >
            <MoreHorizontalIcon />
            <span className="sr-only">Workspace actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onCreateDocument}>
            <FilePlus2Icon />
            New drawing
            <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void onOpenFiles()}>
            <FolderOpenIcon />
            Open file
            <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => void onSaveActiveDocument()}
            disabled={!activeDocument}
          >
            <SaveIcon />
            Save
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => void onSaveActiveDocumentAs()}
            disabled={!activeDocument}
          >
            Save As
            <DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => void onRevealActiveDocumentInFolder()}
            disabled={!activeDocument?.filePath}
          >
            <FolderSearchIcon />
            Reveal in folder
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!activeDocument}>
              Export
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem onSelect={() => void onExportDocument("png")}>
                PNG
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void onExportDocument("svg")}>
                SVG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void onExportDocument("json")}>
                Excalidraw JSON copy
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={onOpenMermaidImport}>
            <SparklesIcon />
            Import Mermaid
            <DropdownMenuShortcut>⌘M</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onOpenRenameDialog}
            disabled={!activeDocument}
          >
            Rename tab
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDuplicateDocument}
            disabled={!activeDocument}
          >
            <CopyIcon />
            Duplicate tab
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => onSwitchDocument(-1)}
            disabled={tabCount < 2}
          >
            Previous tab
            <DropdownMenuShortcut>⌘⌥←</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onSwitchDocument(1)}
            disabled={tabCount < 2}
          >
            Next tab
            <DropdownMenuShortcut>⌘⌥→</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onSidebarOpenChange(!sidebarOpen)}>
            <LayoutDashboardIcon />
            {sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function WorkspaceEmptyState({
  recentFiles,
  onCreateDocument,
  onOpenFiles,
  onOpenRecentFile,
  onOpenMermaidImport,
}: {
  recentFiles: WorkspaceState["recentFiles"]
  onCreateDocument: () => void
  onOpenFiles: () => Promise<void>
  onOpenRecentFile: (filePath: string) => Promise<void>
  onOpenMermaidImport: () => void
}) {
  const quickRecentFiles = recentFiles.slice(0, 3)

  return (
    <Empty className="h-full border border-dashed border-border/70 bg-card/75">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SparklesIcon className="size-4" />
        </EmptyMedia>
        <EmptyTitle>Start a new drawing</EmptyTitle>
        <EmptyDescription>
          Create a blank tab, open a local drawing, or import Mermaid text into a
          fresh canvas.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="grid gap-3 sm:grid-cols-3">
        <Button onClick={onCreateDocument}>
          <FilePlus2Icon />
          New drawing
        </Button>
        <Button variant="outline" onClick={() => void onOpenFiles()}>
          <FolderOpenIcon />
          Open file
        </Button>
        <Button variant="ghost" onClick={onOpenMermaidImport}>
          <SparklesIcon />
          Import Mermaid
        </Button>
      </EmptyContent>

      {quickRecentFiles.length > 0 ? (
        <div className="mx-auto mt-8 w-full max-w-2xl rounded-3xl border border-border/70 bg-background/85 p-4 text-left shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">Recent files</div>
              <div className="text-xs text-muted-foreground">
                Jump back into recent local drawings without browsing for them.
              </div>
            </div>
            <Badge variant="outline">{quickRecentFiles.length} quick picks</Badge>
          </div>
          <div className="mt-3 grid gap-2">
            {quickRecentFiles.map((recentFile) => (
              <Button
                key={recentFile.filePath}
                type="button"
                variant="ghost"
                className="h-auto justify-start rounded-2xl border border-border/70 px-3 py-3 text-left"
                onClick={() => void onOpenRecentFile(recentFile.filePath)}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {recentFile.title}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {recentFile.filePath}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </Empty>
  )
}

function WorkspaceFileDropOverlay({ active }: { active: boolean }) {
  if (!active) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-[2rem] border-2 border-dashed border-primary/50 bg-background/78 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-border/70 bg-background px-6 py-5 text-center shadow-lg">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileUpIcon className="size-6" />
        </div>
        <div>
          <div className="text-base font-semibold text-foreground">
            Drop drawing files to open them
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Excalidraw JSON files will open in new tabs and keep the current
            workspace intact.
          </div>
        </div>
      </div>
    </div>
  )
}

export function WorkspaceShellView({
  workspace,
  activeDocument,
  fileDropActive,
  sidebarOpen,
  onSidebarOpenChange,
  onCreateDocument,
  onDuplicateDocument,
  onCloseDocument,
  onActivateDocument,
  onRenameDocument,
  onOpenFiles,
  onOpenRecentFile,
  onSaveActiveDocument,
  onSaveActiveDocumentAs,
  onRevealActiveDocumentInFolder,
  onExportDocument,
  onSwitchDocument,
  onOpenMermaidImport,
  renameDialogOpen,
  renameDraft,
  onRenameDraftChange,
  onRenameDialogOpenChange,
  onConfirmRename,
  onOpenRenameDialog,
  onUpdateDocumentSnapshot,
  mermaidDialogOpen,
  mermaidDraft,
  mermaidPreview,
  mermaidErrorSummary,
  mermaidErrorDetails,
  mermaidPreviewing,
  mermaidImporting,
  onMermaidDraftChange,
  onMermaidDialogOpenChange,
  onPreviewMermaidImport,
  onConfirmMermaidImport,
  onCopyMermaidErrorDetails,
}: WorkspaceShellViewProps) {
  const tabCount = workspace.documents.length

  return (
    <div className="relative isolate h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.08),_transparent_30%),linear-gradient(to_bottom,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] text-foreground">
      <main className="absolute inset-0 p-3">
        {activeDocument ? (
          <WorkspaceEditor
            key={activeDocument.id}
            document={activeDocument}
            className="h-full w-full pt-[4.75rem]"
            onChange={onUpdateDocumentSnapshot}
          />
        ) : (
          <WorkspaceEmptyState
            recentFiles={workspace.recentFiles}
            onCreateDocument={onCreateDocument}
            onOpenFiles={onOpenFiles}
            onOpenRecentFile={onOpenRecentFile}
            onOpenMermaidImport={onOpenMermaidImport}
          />
        )}
      </main>

      <WorkspaceFileDropOverlay active={fileDropActive} />

      <WorkspaceTabs
        documents={workspace.documents}
        activeDocumentId={workspace.activeDocumentId}
        onCreateDocument={onCreateDocument}
        onActivateDocument={onActivateDocument}
        onCloseDocument={onCloseDocument}
        onRenameDocument={onRenameDocument}
      />

      <WorkspaceQuickMenu
        activeDocument={activeDocument}
        tabCount={tabCount}
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={onSidebarOpenChange}
        onCreateDocument={onCreateDocument}
        onDuplicateDocument={onDuplicateDocument}
        onOpenFiles={onOpenFiles}
        onSaveActiveDocument={onSaveActiveDocument}
        onSaveActiveDocumentAs={onSaveActiveDocumentAs}
        onRevealActiveDocumentInFolder={onRevealActiveDocumentInFolder}
        onExportDocument={onExportDocument}
        onSwitchDocument={onSwitchDocument}
        onOpenMermaidImport={onOpenMermaidImport}
        onOpenRenameDialog={onOpenRenameDialog}
      />

      {/* <WorkspaceStatusPill
        flashMessage={flashMessage}
        activeDocument={activeDocument}
        tabCount={tabCount}
      /> */}

      <WorkspaceSidebarSheet
        open={sidebarOpen}
        onOpenChange={onSidebarOpenChange}
        workspace={workspace}
        activeDocument={activeDocument}
        onActivateDocument={onActivateDocument}
        onCloseDocument={onCloseDocument}
        onOpenRecentFile={onOpenRecentFile}
        onRevealActiveDocumentInFolder={onRevealActiveDocumentInFolder}
      />

      <WorkspaceMermaidDialog
        open={mermaidDialogOpen}
        value={mermaidDraft}
        preview={mermaidPreview}
        errorSummary={mermaidErrorSummary}
        errorDetails={mermaidErrorDetails}
        isPreviewing={mermaidPreviewing}
        isCreating={mermaidImporting}
        onOpenChange={onMermaidDialogOpenChange}
        onValueChange={onMermaidDraftChange}
        onPreviewDiagram={onPreviewMermaidImport}
        onCreateDiagram={onConfirmMermaidImport}
        onCopyErrorDetails={onCopyMermaidErrorDetails}
      />

      <Dialog open={renameDialogOpen} onOpenChange={onRenameDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename tab</DialogTitle>
            <DialogDescription>
              Give the active document a clearer title so the tab stays easy to find.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            value={renameDraft}
            onChange={(event) => onRenameDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onConfirmRename()
              }
            }}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => onRenameDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirmRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
