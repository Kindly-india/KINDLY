"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, CalendarClock, Building2, IndianRupee, Loader2, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"

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
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // No dedicated "am I admin" endpoint — reuse an existing AdminGuard route
    // purely as a gate check, same 401/403 redirect pattern as every other
    // admin page.
    api.getPendingOrgs()
      .catch((err: any) => {
        if (err?.status === 401 || err?.status === 403) {
          router.push("/")
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted pb-20">
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h1 className="text-base font-bold text-foreground leading-tight">Admin</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-3">
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
    </div>
  )
}
