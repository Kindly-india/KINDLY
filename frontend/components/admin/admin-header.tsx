"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/approve-events", label: "Events" },
  { href: "/admin/approve-orgs", label: "Approvals" },
  { href: "/admin/organizations", label: "Orgs" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/audit-log", label: "Audit Log" },
]

export function AdminHeader() {
  const pathname = usePathname()

  return (
    <>
      {/* `fixed` + a same-height spacer, not `sticky` — sticky silently fails
          here because `overflow-x: hidden` on <body> (globals.css) breaks
          position:sticky in Chromium. Same trick as org-top-nav.tsx/top-nav.tsx. */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-12 md:h-14 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-[13px] md:text-sm font-bold text-foreground">Admin</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] md:text-[13px] font-semibold whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <div className="h-12 md:h-14" aria-hidden="true" />
    </>
  )
}
