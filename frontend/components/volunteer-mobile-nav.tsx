"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sparkles, Globe, User, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

export function VolunteerMobileNav() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const isActive = (path: string) => pathname === path

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.getUserProfile()
        if (res?.profile) setProfile(res.profile)
      } catch (e) {
        console.log("No active session found")
      }
    }
    fetchUser()
  }, [])

  const profileLink = profile?.id ? `/volunteers/${profile.id}` : "/login"

  const items = [
    { href: "/home", icon: Home, label: "Home", active: isActive("/home") },
    { href: "/events", icon: Sparkles, label: "Discover", active: isActive("/events") },
    { href: "/social", icon: Globe, label: "Social", active: isActive("/social") },
    { href: "/history", icon: History, label: "History", active: isActive("/history") },
    { href: profileLink, icon: User, label: "Profile", active: pathname.startsWith("/volunteers/") },
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
              active && "bg-black/5 dark:bg-white/10"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 transition-colors",
                active ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-neutral-500"
              )}
            />
            <span
              className={cn(
                "text-[9px] font-medium mt-0.5",
                active ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-neutral-500"
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
