"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Calendar, MapPin, Users, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { api, AdminEvent } from "@/lib/api"
import { cn } from "@/lib/utils"

const TABS = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
]

const PAGE_SIZE = 20

const STATUS_STYLES: Record<string, string> = {
  published: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15",
  pending: "text-amber-700 bg-amber-50 dark:bg-amber-500/15",
  cancelled: "text-red-700 bg-red-50 dark:bg-red-500/15",
  completed: "text-blue-700 bg-blue-50 dark:bg-blue-500/15",
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleTabChange = (value: string) => {
    setStatus(value)
    setPage(1)
  }

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getAdminEvents({
        status: status || undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setEvents(res.events)
      setTotal(res.total)
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      toast.error("Couldn't load events.")
    } finally {
      setLoading(false)
    }
  }, [status, debouncedSearch, page, router])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-4">
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">Events</h1>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
          {total} total
        </p>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap",
              status === tab.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto opacity-20 mb-3" />
          <p className="text-sm font-bold uppercase tracking-widest">No events found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/admin/events/${event.id}`}
              className="flex items-center gap-3 bg-card rounded-2xl border border-border shadow-sm p-4 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-bold text-foreground truncate">{event.title}</h2>
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                      STATUS_STYLES[event.status] ?? "text-muted-foreground bg-muted"
                    )}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                  {event.organization_profiles && <span>{event.organization_profiles.name}</span>}
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{event.event_date}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.registered_count}{event.total_slots != null ? `/${event.total_slots}` : ""}
                  </span>
                </div>
              </div>
            </Link>
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
