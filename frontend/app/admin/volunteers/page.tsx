"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, User, Mail, Phone, MapPin, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { api, AdminVolunteer } from "@/lib/api"
import { cn } from "@/lib/utils"

const TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
]

const PAGE_SIZE = 20

export default function AdminVolunteersPage() {
  const router = useRouter()
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [volunteers, setVolunteers] = useState<AdminVolunteer[]>([])
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

  const fetchVolunteers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getAdminVolunteers({
        status: status || undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setVolunteers(res.volunteers)
      setTotal(res.total)
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      toast.error("Couldn't load volunteers.")
    } finally {
      setLoading(false)
    }
  }, [status, debouncedSearch, page, router])

  useEffect(() => {
    fetchVolunteers()
  }, [fetchVolunteers])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-4">
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">Volunteers</h1>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
          {total} total
        </p>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors",
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
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : volunteers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <User className="w-10 h-10 mx-auto opacity-20 mb-3" />
          <p className="text-sm font-bold uppercase tracking-widest">No volunteers found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {volunteers.map((vol) => (
            <Link
              key={vol.id}
              href={`/admin/volunteers/${vol.id}`}
              className="flex items-center gap-3 bg-card rounded-2xl border border-border shadow-sm p-4 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-bold text-foreground truncate">{vol.full_name}</h2>
                  {vol.suspended_at && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 text-red-700 bg-red-50 dark:bg-red-500/15">
                      Suspended
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                  {vol.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{vol.email}</span>}
                  {vol.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{vol.phone}</span>}
                  {vol.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{vol.city}</span>}
                  <span>{vol.total_hours} hrs</span>
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
