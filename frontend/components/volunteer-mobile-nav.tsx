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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)] dark:bg-black/60 dark:border-neutral-800/80">
      <div className="flex items-center justify-around h-16 px-2">
        <Link href="/home" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Home className={cn("w-6 h-6 transition-colors", isActive("/home") ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")} />
          <span className={cn("text-[10px] font-medium", isActive("/home") ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")}>Home</span>
        </Link>
        <Link href="/events" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Sparkles className={cn("w-6 h-6 transition-colors", isActive("/events") ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")} />
          <span className={cn("text-[10px] font-medium", isActive("/events") ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")}>Discover</span>
        </Link>
        <Link href="/social" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Globe className={cn("w-6 h-6 transition-colors", isActive("/social") ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")} />
          <span className={cn("text-[10px] font-medium", isActive("/social") ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")}>Social</span>
        </Link>
        {/* 3. History (Replaced Impact) */}
        <Link href="/history" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <History className={cn("w-6 h-6 transition-colors", isActive("/history") ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")} />
          <span className={cn("text-[10px] font-medium", isActive("/history") ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")}>History</span>
        </Link>
        <Link href={profileLink} className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <User className={cn("w-6 h-6 transition-colors", pathname.startsWith('/volunteers/') ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")} />
          <span className={cn("text-[10px] font-medium", pathname.startsWith('/volunteers/') ? "text-[#0066cc] dark:text-white" : "text-muted-foreground dark:text-neutral-500")}>Profile</span>
        </Link>
      </div>
    </nav>
  )
}
