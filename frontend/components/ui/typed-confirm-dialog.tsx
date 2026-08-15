"use client"

import { useEffect, useState } from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TypedConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  // The exact string the user must type (case-sensitive) to enable the
  // destructive action — e.g. the org/volunteer's display name. Stronger
  // than ConfirmDialog's single click, for genuinely irreversible actions
  // (P2-20): a misclick can't trigger this, only a deliberate retype.
  targetName: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  loading?: boolean
}

export function TypedConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  targetName,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
}: TypedConfirmDialogProps) {
  const [typed, setTyped] = useState("")

  // Reset the input whenever the dialog is reopened (or opened for a
  // different target) — a stale match from a previous target must never
  // silently enable the button for a new one.
  useEffect(() => {
    if (open) setTyped("")
  }, [open, targetName])

  const matches = typed === targetName

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content className="fixed z-[100] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-card rounded-3xl border border-border shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <AlertDialogPrimitive.Title className="text-[15px] font-bold text-foreground">
                {title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                {description}
              </AlertDialogPrimitive.Description>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
              Type <span className="font-bold text-foreground">{targetName}</span> to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={loading}
              autoFocus
              className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
              placeholder={targetName}
            />
          </div>

          <div className="flex items-center gap-2 mt-6">
            <AlertDialogPrimitive.Cancel asChild>
              <button
                className="flex-1 h-10 rounded-xl font-bold text-sm border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {cancelLabel}
              </button>
            </AlertDialogPrimitive.Cancel>
            <button
              onClick={onConfirm}
              disabled={loading || !matches}
              className={cn(
                "flex-1 h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors",
                "bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-600"
              )}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
