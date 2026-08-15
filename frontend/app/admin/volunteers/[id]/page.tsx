"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Phone, MapPin, Globe, Loader2, ShieldOff, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api, AdminVolunteerDetail } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { TypedConfirmDialog } from "@/components/ui/typed-confirm-dialog"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  )
}

export default function AdminVolunteerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const volunteerId = params?.id as string

  const [vol, setVol] = useState<AdminVolunteerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [acting, setActing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const fetchVolunteer = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.adminGetVolunteer(volunteerId)
      setVol(res.volunteer)
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      toast.error("Couldn't load volunteer.")
    } finally {
      setLoading(false)
    }
  }, [volunteerId, router])

  useEffect(() => {
    if (volunteerId) fetchVolunteer()
  }, [volunteerId, fetchVolunteer])

  // Hard-delete is superadmin-only (P2-20) — hide the whole Danger Zone for
  // a regular admin rather than showing a button that would just 403.
  useEffect(() => {
    api.getAdminMe().then((res) => setIsSuperAdmin(res.isSuperAdmin)).catch(() => {})
  }, [])

  const handleSuspensionToggle = async () => {
    if (!vol) return
    try {
      setActing(true)
      await api.adminSetVolunteerSuspension(vol.id, !vol.suspended_at, vol.suspended_at ? undefined : reason || undefined)
      toast.success(vol.suspended_at ? "Volunteer reactivated" : "Volunteer suspended")
      setConfirmOpen(false)
      setReason("")
      await fetchVolunteer()
    } catch (err: any) {
      toast.error(err.message || "Failed to update suspension")
    } finally {
      setActing(false)
    }
  }

  const handleDelete = async () => {
    if (!vol) return
    try {
      setDeleting(true)
      await api.adminDeleteVolunteer(vol.id, vol.full_name)
      toast.success("Volunteer permanently deleted")
      router.push("/admin/volunteers")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete volunteer")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!vol) return null

  const isSuspended = !!vol.suspended_at

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-foreground leading-tight">{vol.full_name}</h1>
            {vol.is_verified && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15">
                Verified
              </span>
            )}
            {isSuspended && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 text-red-700 bg-red-50 dark:bg-red-500/15">
                Suspended
              </span>
            )}
          </div>
          {vol.headline && <p className="text-[12px] text-muted-foreground mt-1">{vol.headline}</p>}
        </div>
        <Link
          href={`/volunteers/${vol.user_id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-border text-foreground text-[12px] font-semibold shrink-0 transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          Public Profile
        </Link>
      </div>

      {isSuspended && (
        <div className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-2xl p-4">
          <p className="text-[12px] font-bold text-red-700 uppercase tracking-wide mb-1">Suspended</p>
          {vol.suspended_reason && <p className="text-sm text-red-800 dark:text-red-300">{vol.suspended_reason}</p>}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" value={vol.email && <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{vol.email}</span>} />
        <Field label="Phone" value={vol.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{vol.phone}</span>} />
        <Field label="City" value={vol.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{vol.city}</span>} />
        <Field label="Website" value={vol.website && <a href={vol.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline"><Globe className="w-3.5 h-3.5" />{vol.website}</a>} />
        <Field label="Total Hours" value={vol.total_hours} />
        <Field label="Privacy" value={vol.is_private ? "Private profile" : "Public profile"} />
        <Field label="Joined" value={new Date(vol.created_at).toLocaleDateString()} />
        <Field label="Skills" value={vol.skills && vol.skills.length > 0 ? vol.skills.join(", ") : null} />
      </div>

      {vol.bio && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Bio</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{vol.bio}</p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Account Access</p>
        {isSuspended ? (
          <button
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Reactivate Volunteer
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Reason (optional, shown to future admins)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/30"
            />
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors"
            >
              <ShieldOff className="w-4 h-4" />
              Suspend Volunteer
            </button>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <div className="bg-card rounded-2xl border border-red-200 dark:border-red-500/30 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">Danger Zone</p>
          <p className="text-[12px] text-muted-foreground mb-3">
            Permanently deletes this volunteer's account and everything tied to it (posts, certificates, registrations).
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Volunteer Permanently
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isSuspended ? "Reactivate this volunteer?" : "Suspend this volunteer?"}
        description={
          isSuspended
            ? `${vol.full_name} will regain login access.`
            : `${vol.full_name} will lose login access immediately (existing sessions are cut off too). This is reversible.`
        }
        confirmLabel={isSuspended ? "Reactivate" : "Suspend"}
        onConfirm={handleSuspensionToggle}
        loading={acting}
        destructive={!isSuspended}
      />

      <TypedConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Permanently delete this volunteer?"
        description="This cannot be undone. Their posts, certificates, registrations, and gallery photos will all be permanently removed."
        targetName={vol.full_name}
        confirmLabel="Delete Permanently"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </main>
  )
}
