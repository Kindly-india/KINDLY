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

  // Fetch the logged-in user so we know where to link them
useEffect(() => {
    // 1. Check if we are on an auth page before even trying to fetch
    const isAuthPage = pathname === "/" || pathname === "/login" || pathname === "/signup"
    
    if (isAuthPage) return // Exit early!

    const fetchUser = async () => {
      try {
        const res = await api.getUserProfile()
        if (res?.profile) setProfile(res.profile)
      } catch (e) {
        // If it's just a 401/session error, don't log it to keep the console clean
        console.log("No active session found (normal for logged-out users)")
      }
    }
    fetchUser()
  }, [pathname]) // Add pathname to dependency array so it re-checks when you navigate

  // Do not show the bottom nav on auth screens or landing page
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null
  }

  // Helper to check active state
  const isActive = (path: string) => pathname === path

  // Dynamic Profile Link Logic
  let profileLink = "/login" // fallback if not loaded
  if (profile) {
    if ('org_type' in profile) {
      profileLink = `/organizations/${profile.id}`
    } else {
      profileLink = `/volunteers/${profile.id}`
    }
  }

  // Check if profile tab is active (matches either volunteer or org URL)
  const isProfileActive = pathname.startsWith('/volunteers/') || pathname.startsWith('/organizations/')

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        
        <Link href="/home" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Home className={cn("w-6 h-6 transition-colors", isActive("/home") ? "text-[#0066cc]" : "text-gray-400")} />
          <span className={cn("text-[10px] font-medium", isActive("/home") ? "text-[#0066cc]" : "text-gray-400")}>Home</span>
        </Link>

        <Link href="/events" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Sparkles className={cn("w-6 h-6 transition-colors", isActive("/events") ? "text-[#0066cc]" : "text-gray-400")} />
          <span className={cn("text-[10px] font-medium", isActive("/events") ? "text-[#0066cc]" : "text-gray-400")}>Discover</span>
        </Link>

        <Link href="/social" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Globe className={cn("w-6 h-6 transition-colors", isActive("/social") ? "text-[#0066cc]" : "text-gray-400")} />
          <span className={cn("text-[10px] font-medium", isActive("/social") ? "text-[#0066cc]" : "text-gray-400")}>Social</span>
        </Link>

        {/* Dynamic Profile Link */}
        <Link href={profileLink} className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <User className={cn("w-6 h-6 transition-colors", isProfileActive ? "text-[#0066cc]" : "text-gray-400")} />
          <span className={cn("text-[10px] font-medium", isProfileActive ? "text-[#0066cc]" : "text-gray-400")}>Profile</span>
        </Link>

      </div>
    </nav>
  )
}