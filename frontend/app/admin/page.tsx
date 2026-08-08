"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CalendarClock,
  Building2,
  IndianRupee,
  ChevronRight,
  Users,
  ClipboardList,
  AlertTriangle,
  Loader2,
  ScrollText,
} from "lucide-react"
import { api, AdminStats } from "@/lib/api"

const SECTIONS = [
  {
    href: "/admin/approve-events",
    icon: CalendarClock,
    title: "Event Approvals",
    description: "Review and publish events submitted by organizations.",
  },
  {
    href: "/admin/approve-orgs",
    icon: Building2,
    title: "Organization Approvals",
    description: "Review KYC documents and approve or reject new organizations.",
  },
  {
    href: "/admin/payments",
    icon: IndianRupee,
    title: "Paid Events",
    description: "Live registration/payment counts, bills, and mark-paid for paid events.",
  },
  {
    href: "/admin/organizations",
    icon: Users,
    title: "Organizations",
    description: "Browse and search every organization on the platform.",
  },
  {
    href: "/admin/audit-log",
    icon: ScrollText,
    title: "Audit Log",
    description: "Who approved, rejected, or marked what paid, and when.",
  },
]

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAdminStats()
      .then(setStats)
      .catch(() => {
        // Non-fatal — the quick-links below still work without stats.
      })
      .finally(() => setLoading(false))
  }, [])

  const tiles = stats
    ? [
        { label: "Pending orgs", value: String(stats.pendingOrgsCount), icon: Building2, urgent: stats.pendingOrgsCount > 0 },
        { label: "Pending events", value: String(stats.pendingEventsCount), icon: CalendarClock, urgent: stats.pendingEventsCount > 0 },
        { label: "Approved orgs", value: String(stats.approvedOrgsCount), icon: Users, urgent: false },
        { label: "Total events", value: String(stats.totalEvents), icon: ClipboardList, urgent: false },
        { label: "Volunteers", value: String(stats.totalVolunteers), icon: Users, urgent: false },
        { label: "Collected", value: rupees(stats.grossCollectedPaise), icon: IndianRupee, urgent: false },
      ]
    : []

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tiles.map((tile) => (
              <div key={tile.label} className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                    tile.urgent ? "bg-amber-50 dark:bg-amber-500/15" : "bg-emerald-50 dark:bg-emerald-500/15"
                  }`}
                >
                  <tile.icon className={`w-4 h-4 ${tile.urgent ? "text-amber-600" : "text-emerald-600"}`} />
                </div>
                <p className="text-xl font-bold text-foreground">{tile.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{tile.label}</p>
              </div>
            ))}
          </div>

          {stats.refundAttentionCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/15 text-red-600 rounded-xl text-[12px] font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {stats.refundAttentionCount} unrefunded payment{stats.refundAttentionCount !== 1 ? "s" : ""} across
              cancelled events — see Paid Events.
            </div>
          )}
        </>
      ) : null}

      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center gap-4 bg-card rounded-2xl border border-border shadow-sm p-5 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
              <section.icon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold text-foreground">{section.title}</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">{section.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </main>
  )
}
