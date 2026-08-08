"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ScrollText, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { api, AdminAuditLogEntry } from "@/lib/api"

const PAGE_SIZE = 30

function timeAgo(dateString: string): string {
  const secs = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (secs < 60) return "Just now"
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function actionLabel(action: string): string {
  return action.replace(/[._]/g, " ")
}

export default function AdminAuditLogPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<AdminAuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchLog = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getAdminAuditLog({ page, pageSize: PAGE_SIZE })
      setEntries(res.entries)
      setTotal(res.total)
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      toast.error("Couldn't load the audit log.")
    } finally {
      setLoading(false)
    }
  }, [page, router])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-4">
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">Audit Log</h1>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
          {total} recorded actions
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ScrollText className="w-10 h-10 mx-auto opacity-20 mb-3" />
          <p className="text-sm font-bold uppercase tracking-widest">No actions recorded yet</p>
          <p className="text-xs mt-1">Org/event approvals and mark-paid actions will show up here.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
          {entries.map((entry) => (
            <div key={entry.id} className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <ScrollText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-foreground capitalize">
                  {actionLabel(entry.action)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {entry.actor_email ?? "Unknown admin"} · {entry.target_type}
                  {entry.target_id ? ` #${entry.target_id.slice(0, 8)}` : ""}
                </p>
                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {Object.entries(entry.metadata)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                {timeAgo(entry.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg bg-card border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[12px] text-muted-foreground font-semibold">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg bg-card border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </main>
  )
}
