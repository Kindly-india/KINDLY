"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Globe, BarChart3, User, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

export function OrgMobileNav() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    // Static self-profile alias so the link works on first paint.
    const profileLink = "/organizations/me"

    const items = [
        { href: "/org-home", icon: LayoutDashboard, label: "Dash", active: isActive("/org-home") },
        { href: "/org-events", icon: Calendar, label: "Events", active: isActive("/org-events") },
        // Points to the shared social page!
        { href: "/social", icon: Globe, label: "Social", active: isActive("/social") },
        { href: "/org-analytics", icon: BarChart3, label: "Analytics", active: isActive("/org-analytics") },
        { href: profileLink, icon: User, label: "Profile", active: pathname.startsWith("/organizations/") },
    ]

    return (
        <nav
            className={cn(
                "md:hidden fixed left-1/2 -translate-x-1/2 z-50",
                "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
                "bg-white/80 dark:bg-black/60 backdrop-blur-xl",
                "border border-neutral-200/60 dark:border-white/10",
                "shadow-xl shadow-neutral-200/40 dark:shadow-2xl dark:shadow-black/50 rounded-full"
            )}
        >
            <div className="flex items-center gap-1 px-2 py-2">
                {items.map(({ href, icon: Icon, label, active }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            "flex flex-col items-center justify-center w-14 h-12 rounded-full transition-colors prevent-select",
                            active && "bg-orange-500/10 dark:bg-white/10"
                        )}
                    >
                        <Icon
                            className={cn(
                                "w-5 h-5 transition-colors",
                                active ? "text-orange-600 dark:text-white" : "text-muted-foreground dark:text-neutral-500"
                            )}
                        />
                        <span
                            className={cn(
                                "text-[9px] font-medium mt-0.5",
                                active ? "text-orange-600 dark:text-white" : "text-muted-foreground dark:text-neutral-500"
                            )}
                        >
                            {label}
                        </span>
                    </Link>
                ))}
            </div>
        </nav>
    )
}
