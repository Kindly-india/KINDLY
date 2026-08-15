"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Building2, Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api, AdminOrganization } from "@/lib/api"
import { CreateEventPage } from "@/components/create-event-page"

const PAGE_SIZE = 20

export default function AdminCreateEventPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectOrgId = searchParams?.get("org") ?? null
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [orgs, setOrgs] = useState<AdminOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null)

  // Deep-linked from an org's admin detail page (?org=<id>) — skip the
  // picker step and go straight to the create-event form.
  useEffect(() => {
    if (!preselectOrgId) return
    api.adminGetOrganization(preselectOrgId)
      .then((res) => setSelectedOrg({ id: res.organization.id, name: res.organization.name }))
      .catch(() => toast.error("Couldn't load that organization."))
  }, [preselectOrgId])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchOrgs = useCallback(async () => {
    try {
      setLoading(true)
      // Only approved orgs can have events created for them (mirrors the
      // approval-status guard the backend enforces in adminCreateEvent).
      const res = await api.getAdminOrganizations({
        status: "approved",
        search: debouncedSearch || undefined,
        page: 1,
        pageSize: PAGE_SIZE,
      })
      setOrgs(res.organizations)
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      toast.error("Couldn't load organizations.")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, router])

  useEffect(() => {
    fetchOrgs()
  }, [fetchOrgs])

  if (selectedOrg) {
    return <CreateEventPage adminOrg={selectedOrg} />
  }

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-4">
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">Create Event</h1>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
          Step 1 — pick an organization
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search approved organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto opacity-20 mb-3" />
          <p className="text-sm font-bold uppercase tracking-widest">No approved organizations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => setSelectedOrg({ id: org.id, name: org.name })}
              className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border shadow-sm p-4 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[14px] font-bold text-foreground truncate">{org.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{org.email}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
