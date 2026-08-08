"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Check,
  X,
  Loader2,
  CalendarClock,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface PendingOrg {
  id: string
  org_type: string
  name: string
  email: string
  phone: string | null
  registration_type: string | null
  registration_number: string | null
  representative_name: string | null
  designation: string | null
  website: string | null
  parent_institution: string | null
  coordinator_name: string | null
  area_locality: string | null
  intent_description: string | null
  registration_certificate_url: string | null
  pan_card_url: string | null
  proof_document_url: string | null
  created_at: string
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
    >
      <FileText className="w-3.5 h-3.5" />
      {label}
    </a>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-[13px] text-foreground break-words">{value}</p>
    </div>
  )
}

export default function AdminApproveOrgsPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<PendingOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<PendingOrg | null>(null)

  const fetchPending = async () => {
    try {
      setLoading(true)
      const res = await api.getPendingOrgs()
      setOrgs(res.organizations || [])
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      console.error("Failed to fetch pending organizations", err)
      toast.error("Couldn't load pending organizations.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDecision = async (org: PendingOrg, status: "approved" | "rejected") => {
    try {
      setActingId(org.id)
      await api.setOrgApproval(org.id, status)
      setOrgs((prev) => prev.filter((o) => o.id !== org.id))
      toast.success(
        status === "approved"
          ? `${org.name} approved — they've been emailed.`
          : `${org.name} rejected and removed.`,
      )
    } catch (err: any) {
      toast.error(err.message || "Action failed. Please try again.")
    } finally {
      setActingId(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return
    await handleDecision(rejectTarget, "rejected")
    setRejectTarget(null)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <h1 className="text-base font-bold text-foreground leading-tight">Organization Approvals</h1>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
          {orgs.length} awaiting review
        </p>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {orgs.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Check className="w-10 h-10 mx-auto opacity-20 mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">All caught up</p>
            <p className="text-xs mt-1">No organizations waiting for approval.</p>
          </div>
        ) : (
          orgs.map((org) => (
            <div key={org.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-bold text-foreground truncate">{org.name}</h2>
                      <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        {org.org_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                    <CalendarClock className="w-3.5 h-3.5" />
                    {new Date(org.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </div>

                {/* Contact row */}
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-[12px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{org.email}</span>
                  {org.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{org.phone}</span>}
                  {org.area_locality && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{org.area_locality}</span>}
                  {org.website && (
                    <a href={org.website.startsWith("http") ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                      <Globe className="w-3.5 h-3.5" />{org.website}
                    </a>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  <Field label="Registration" value={[org.registration_type, org.registration_number].filter(Boolean).join(" · ") || null} />
                  <Field label="Representative" value={[org.representative_name, org.designation].filter(Boolean).join(", ") || null} />
                  <Field label="Parent Institution" value={org.parent_institution} />
                  <Field label="Coordinator" value={org.coordinator_name} />
                </div>

                {org.intent_description && (
                  <div className="mt-4 space-y-0.5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Intent</p>
                    <p className="text-[13px] text-foreground leading-relaxed">{org.intent_description}</p>
                  </div>
                )}

                {/* Documents */}
                {(org.registration_certificate_url || org.pan_card_url || org.proof_document_url) && (
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
                    <DocLink label="Registration Certificate" url={org.registration_certificate_url} />
                    <DocLink label="PAN Card" url={org.pan_card_url} />
                    <DocLink label="Proof Document" url={org.proof_document_url} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-5 py-3 bg-muted/50 border-t border-border">
                <button
                  onClick={() => handleDecision(org, "approved")}
                  disabled={actingId === org.id}
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {actingId === org.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => setRejectTarget(org)}
                  disabled={actingId === org.id}
                  className="h-10 px-4 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/15 text-red-600 border border-red-200 dark:border-red-500/20 rounded-xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject application?"
        description={
          rejectTarget
            ? `Reject and permanently delete "${rejectTarget.name}"'s application? This frees their email to re-apply.`
            : ""
        }
        confirmLabel="Reject"
        onConfirm={handleRejectConfirm}
        loading={actingId === rejectTarget?.id}
        destructive
      />
    </div>
  )
}
