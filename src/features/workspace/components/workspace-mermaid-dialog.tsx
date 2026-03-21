import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
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
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CopyIcon,
  SparklesIcon,
} from "lucide-react"

import {
  DEFAULT_MERMAID_SNIPPET,
  type WorkspaceMermaidPreview,
} from "../services/workspace-mermaid-service"

export interface WorkspaceMermaidDialogProps {
  open: boolean
  value: string
  preview: WorkspaceMermaidPreview | null
  errorSummary: string | null
  errorDetails: string | null
  isPreviewing: boolean
  isCreating: boolean
  onOpenChange: (open: boolean) => void
  onValueChange: (value: string) => void
  onPreviewDiagram: () => void
  onCreateDiagram: () => void
  onCopyErrorDetails: () => void
}

export function WorkspaceMermaidDialog({
  open,
  value,
  preview,
  errorSummary,
  errorDetails,
  isPreviewing,
  isCreating,
  onOpenChange,
  onValueChange,
  onPreviewDiagram,
  onCreateDiagram,
  onCopyErrorDetails,
}: WorkspaceMermaidDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Mermaid</Badge>
            <Badge variant="outline">Creates a new tab</Badge>
            {preview ? <Badge variant="outline">Preview ready</Badge> : null}
          </div>
          <DialogTitle>Import Mermaid</DialogTitle>
          <DialogDescription>
            Paste Mermaid text, preview the conversion, then create a new
            Excalidraw tab without replacing the current canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Textarea
            autoFocus
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={DEFAULT_MERMAID_SNIPPET}
            className="min-h-56 font-mono text-sm"
          />

          {preview ? (
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-950">
                <CheckCircle2Icon className="size-4 text-emerald-700" />
                Preview ready
              </div>
              <p className="mt-2 text-sm text-emerald-900/80">
                This import will open in a new tab and leave the current drawing
                unchanged.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200/80 bg-white/80 px-3 py-2">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-800/70">
                    Shapes
                  </div>
                  <div className="mt-1 text-lg font-semibold text-emerald-950">
                    {preview.elementCount}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200/80 bg-white/80 px-3 py-2">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-800/70">
                    Embedded files
                  </div>
                  <div className="mt-1 text-lg font-semibold text-emerald-950">
                    {preview.fileCount}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {errorSummary && errorDetails ? (
            <div className="grid gap-3">
              <Alert
                variant="destructive"
                className="rounded-2xl border-destructive/30 bg-destructive/5 px-4 py-4"
              >
                <AlertTriangleIcon className="size-4" />
                <AlertTitle>{errorSummary}</AlertTitle>
                <AlertDescription>
                  Fix the Mermaid text and preview again. The parser details below
                  are copyable for debugging.
                </AlertDescription>
                <AlertAction>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8"
                    onClick={onCopyErrorDetails}
                  >
                    <CopyIcon />
                    Copy details
                  </Button>
                </AlertAction>
              </Alert>

              <div className="rounded-2xl border border-destructive/20 bg-background px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Error details
                </div>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-foreground">
                  {errorDetails}
                </pre>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <SparklesIcon className="size-4 text-primary" />
              Sample snippet
            </div>
            <pre className="mt-3 overflow-hidden whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
              {DEFAULT_MERMAID_SNIPPET}
            </pre>
            <Button
              type="button"
              variant="ghost"
              className="mt-3"
              onClick={() => onValueChange(DEFAULT_MERMAID_SNIPPET)}
            >
              Load sample
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onPreviewDiagram}
            disabled={isPreviewing || isCreating || !value.trim()}
          >
            {isPreviewing ? "Previewing..." : preview ? "Refresh preview" : "Preview"}
          </Button>
          <Button
            onClick={onCreateDiagram}
            disabled={isCreating || isPreviewing || !preview}
          >
            {isCreating ? "Creating..." : "Create tab"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
