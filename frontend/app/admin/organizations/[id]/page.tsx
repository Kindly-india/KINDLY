"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Mail, Phone, MapPin, Globe, Loader2, ShieldOff, ShieldCheck, FileText, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api, AdminOrganizationDetail } from "@/lib/api"
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

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-[12px] font-semibold text-foreground hover:bg-border transition-colors"
    >
      <FileText className="w-3.5 h-3.5" />
      {label}
    </a>
  )
}

export default function AdminOrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params?.id as string

  const [org, setOrg] = useState<AdminOrganizationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [acting, setActing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const fetchOrg = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.adminGetOrganization(orgId)
      setOrg(res.organization)
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      toast.error("Couldn't load organization.")
    } finally {
      setLoading(false)
    }
  }, [orgId, router])

  useEffect(() => {
    if (orgId) fetchOrg()
  }, [orgId, fetchOrg])

  // Hard-delete is superadmin-only (P2-20) — hide the whole Danger Zone for
  // a regular admin rather than showing a button that would just 403.
  useEffect(() => {
    api.getAdminMe().then((res) => setIsSuperAdmin(res.isSuperAdmin)).catch(() => {})
  }, [])

  const handleSuspensionToggle = async () => {
    if (!org) return
    try {
      setActing(true)
      await api.adminSetOrgSuspension(org.id, !org.suspended_at, org.suspended_at ? undefined : reason || undefined)
      toast.success(org.suspended_at ? "Organization reactivated" : "Organization suspended")
      setConfirmOpen(false)
      setReason("")
      await fetchOrg()
    } catch (err: any) {
      toast.error(err.message || "Failed to update suspension")
    } finally {
      setActing(false)
    }
  }

  const handleDelete = async () => {
    if (!org) return
    try {
      setDeleting(true)
      await api.adminDeleteOrganization(org.id, org.name)
      toast.success("Organization permanently deleted")
      router.push("/admin/organizations")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete organization")
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

  if (!org) return null

  const isSuspended = !!org.suspended_at

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-foreground leading-tight">{org.name}</h1>
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                org.approval_status === "approved"
                  ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15"
                  : "text-amber-700 bg-amber-50 dark:bg-amber-500/15"
              )}
            >
              {org.approval_status}
            </span>
            {isSuspended && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 text-red-700 bg-red-50 dark:bg-red-500/15">
                Suspended
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">{org.org_type}</p>
        </div>
        <Link
          href={`/admin/create-event?org=${org.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold shrink-0 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Create Event
        </Link>
      </div>

      {isSuspended && (
        <div className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-2xl p-4">
          <p className="text-[12px] font-bold text-red-700 uppercase tracking-wide mb-1">Suspended</p>
          {org.suspended_reason && <p className="text-sm text-red-800 dark:text-red-300">{org.suspended_reason}</p>}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" value={<span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{org.email}</span>} />
        <Field label="Phone" value={org.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{org.phone}</span>} />
        <Field label="Location" value={org.area_locality && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{org.area_locality}</span>} />
        <Field label="Website" value={org.website && <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline"><Globe className="w-3.5 h-3.5" />{org.website}</a>} />
        <Field label="Representative" value={org.representative_name} />
        <Field label="Designation" value={org.designation} />
        <Field label="Registration Type" value={org.registration_type} />
        <Field label="Registration Number" value={org.registration_number} />
        <Field label="Coordinator" value={org.coordinator_name} />
        <Field label="Parent Institution" value={org.parent_institution} />
        <Field label="Years Active" value={org.years_active} />
        <Field label="Joined" value={new Date(org.created_at).toLocaleDateString()} />
      </div>

      {org.intent_description && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Intent</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{org.intent_description}</p>
        </div>
      )}

      {(org.registration_certificate_url || org.pan_card_url || org.proof_document_url) && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">KYC Documents</p>
          <div className="flex flex-wrap gap-2">
            <DocLink label="Registration Certificate" url={org.registration_certificate_url} />
            <DocLink label="PAN Card" url={org.pan_card_url} />
            <DocLink label="Proof Document" url={org.proof_document_url} />
          </div>
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
            Reactivate Organization
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
              Suspend Organization
            </button>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <div className="bg-card rounded-2xl border border-red-200 dark:border-red-500/30 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">Danger Zone</p>
          <p className="text-[12px] text-muted-foreground mb-3">
            Permanently deletes this organization and everything tied to it. Blocked if any certificates or payment records exist for its events — suspend it instead in that case.
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Organization Permanently
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isSuspended ? "Reactivate this organization?" : "Suspend this organization?"}
        description={
          isSuspended
            ? `${org.name} will regain login access and its events stay visible.`
            : `${org.name} will lose login access immediately (existing sessions are cut off too) and can't create or manage events until reactivated. This is reversible.`
        }
        confirmLabel={isSuspended ? "Reactivate" : "Suspend"}
        onConfirm={handleSuspensionToggle}
        loading={acting}
        destructive={!isSuspended}
      />

      <TypedConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Permanently delete this organization?"
        description="This cannot be undone. All of the organization's events, gallery, reviews, and KYC documents will be permanently removed."
        targetName={org.name}
        confirmLabel="Delete Permanently"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </main>
  )
}
