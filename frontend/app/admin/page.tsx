"use client"

import Link from "next/link"
import { CalendarClock, Building2, IndianRupee, ChevronRight } from "lucide-react"

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
]

export default function AdminHomePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-3">
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
    </main>
  )
}
