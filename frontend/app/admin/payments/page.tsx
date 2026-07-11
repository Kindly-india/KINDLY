"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  IndianRupee,
  Users,
  Loader2,
  AlertTriangle,
  Check,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { api, AdminPaymentsDashboardEvent } from "@/lib/api"

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<AdminPaymentsDashboardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [referenceInputs, setReferenceInputs] = useState<Record<string, string>>({})

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await api.getAdminPaymentsDashboard()
      setEvents(res.events || [])
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      console.error("Failed to fetch payments dashboard", err)
      toast.error("Couldn't load the payments dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMarkPaid = async (event: AdminPaymentsDashboardEvent) => {
    if (!event.bill) return
    try {
      setActingId(event.bill.id)
      await api.markBillPaid(event.bill.id, referenceInputs[event.bill.id])
      toast.success(`${event.organizationName ?? "Organization"} marked as paid.`)
      await fetchDashboard()
    } catch (err: any) {
      toast.error(err.message || "Failed to mark bill as paid.")
    } finally {
      setActingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const refundAttentionCount = events.reduce((sum, e) => sum + e.needsRefundAttention, 0)

  return (
    <div className="min-h-screen bg-muted pb-20">
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">Paid Events</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {events.length} paid events{refundAttentionCount > 0 ? ` · ${refundAttentionCount} refunds need attention` : ""}
              </p>
            </div>
          </div>
          <Link
            href="/admin/approve-orgs"
            className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Orgs →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto opacity-20 mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">No paid events yet</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.eventId} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-foreground truncate">{event.title}</h2>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {event.organizationName ?? "Unknown org"}
                      {event.organizationUpiId ? ` · ${event.organizationUpiId}` : " · No UPI ID on file"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                    {event.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-4 text-[12px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {event.paidRegistrationCount} paid registration{event.paidRegistrationCount !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {rupees(event.grossCollectedPaise)} collected
                  </span>
                </div>

                {event.needsRefundAttention > 0 && (
                  <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-red-50 dark:bg-red-500/15 text-red-600 rounded-xl text-[12px] font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {event.needsRefundAttention} unrefunded payment{event.needsRefundAttention !== 1 ? "s" : ""} on this cancelled event — needs manual refund follow-up.
                  </div>
                )}

                {event.bill && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Owed to org</p>
                        <p className="text-lg font-black text-foreground">{rupees(event.bill.org_amount_paise)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        event.bill.status === "paid"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                      }`}>
                        {event.bill.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>

                    {event.bill.status === "pending" && (
                      <div className="flex items-center gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Reference (UTR, optional)"
                          value={referenceInputs[event.bill.id] ?? ""}
                          onChange={(e) => setReferenceInputs((prev) => ({ ...prev, [event.bill!.id]: e.target.value }))}
                          className="flex-1 h-10 px-3 bg-muted border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                        <button
                          onClick={() => handleMarkPaid(event)}
                          disabled={actingId === event.bill.id}
                          className="h-10 px-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
                        >
                          {actingId === event.bill.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Mark Paid
                        </button>
                      </div>
                    )}
                    {event.bill.paid_reference && (
                      <p className="text-[11px] text-muted-foreground mt-2">Reference: {event.bill.paid_reference}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
