"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sparkles, Globe, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

export function MobileNav() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)

  // Define all routes where the navbar should be HIDDEN
  const hideNavRoutes = [
    "/",
    "/login",
    "/signup",
    "/how-it-works",
    "/for-volunteers",
    "/for-organisations",
  ]
  
  const isStaticSection = 
    pathname.startsWith("/company") || 
    pathname.startsWith("/resources") || 
    pathname.startsWith("/legal")

  const shouldHide = hideNavRoutes.includes(pathname) || isStaticSection

  useEffect(() => {
    if (shouldHide) return

    const fetchUser = async () => {
      try {
        const res = await api.getUserProfile()
        if (res?.profile) setProfile(res.profile)
      } catch (e) {
        console.log("No active session found")
      }
    }
    fetchUser()
  }, [pathname, shouldHide])

  if (shouldHide) return null

  const isActive = (path: string) => pathname === path

  let profileLink = "/login" 
  if (profile) {
    profileLink = profile.org_type 
      ? `/organizations/${profile.id}` 
      : `/volunteers/${profile.id}`
  }

  const isProfileActive = pathname.startsWith('/volunteers/') || pathname.startsWith('/organizations/')

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        <Link href="/home" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Home className={cn("w-6 h-6 transition-colors", isActive("/home") ? "text-[#0066cc]" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-medium", isActive("/home") ? "text-[#0066cc]" : "text-muted-foreground")}>Home</span>
        </Link>

        <Link href="/events" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Sparkles className={cn("w-6 h-6 transition-colors", isActive("/events") ? "text-[#0066cc]" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-medium", isActive("/events") ? "text-[#0066cc]" : "text-muted-foreground")}>Discover</span>
        </Link>

        <Link href="/social" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Globe className={cn("w-6 h-6 transition-colors", isActive("/social") ? "text-[#0066cc]" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-medium", isActive("/social") ? "text-[#0066cc]" : "text-muted-foreground")}>Social</span>
        </Link>

        <Link href={profileLink} className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <User className={cn("w-6 h-6 transition-colors", isProfileActive ? "text-[#0066cc]" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-medium", isProfileActive ? "text-[#0066cc]" : "text-muted-foreground")}>Profile</span>
        </Link>
      </div>
    </nav>
  )
}