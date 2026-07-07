"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export function TopNav() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [userType, setUserType] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  // Apple-style hide-on-scroll-down / reveal-on-scroll-up.
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setHidden(currentY > lastScrollY.current && currentY > 80)
      lastScrollY.current = currentY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Define all routes where the navbar should be HIDDEN
  const hideNavRoutes = [
    "/",
    "/login",
    "/signup",
    "/how-it-works",
    "/for-volunteers",
    "/for-organisations",
    "/update-password",
    "/org-events/[id]/report",
    "/onboarding"
  ]
  
  // Also hide if the path starts with company, resources, or legal
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
        if (res?.profile) {
          setProfile(res.profile)
          setUserType(res.userType ?? null)
          if (res.userType === 'volunteer') {
            const { count } = await api.getUnreadCount()
            setUnreadCount(count ?? 0)
          }
        }
      } catch (e) {
        console.log("No active session found")
      }
    }
    fetchUser()
  }, [shouldHide])

  if (shouldHide) return null

  const displayImage = profile?.avatar_url || profile?.logo_url
  const displayName = profile?.full_name || profile?.name || "User"
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U"

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/60 backdrop-blur-md dark:backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/10 transition-transform duration-300 ease-in-out",
          hidden ? "-translate-y-full" : "translate-y-0"
        )}
      >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-12 md:h-14 flex items-center justify-between relative">
        
        {/* 2nd Problem Fixed: Logo now directs to Home screen */}
        <Link href="/home" className="hover:opacity-80 transition-opacity">
          <Image 
              src="/logo.png" 
              alt="Kindly" 
              width={100} 
              height={30} 
              className="h-5 md:h-6 w-auto dark:invert" 
              priority 
          />
        </Link>

        {/* Navigation Links + Bell (Desktop only, absolutely centered) */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/events" className="text-[13px] md:text-[15px] text-foreground hover:text-[#0066cc] transition-colors font-medium">Events</Link>
          <Link href="/history" className="text-[13px] md:text-[15px] text-foreground hover:text-[#0066cc] transition-colors font-medium">History</Link>
          {userType === 'volunteer' && (
            <Link
              href="/notifications"
              className="relative p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#80242a]" />
              )}
            </Link>
          )}
          <Link href="/social" className="text-[13px] md:text-[15px] text-foreground hover:text-[#0066cc] transition-colors font-medium">Social</Link>
          <Link href="/volunteer-impact" className="text-[13px] md:text-[15px] text-foreground hover:text-[#0066cc] transition-colors font-medium flex items-center gap-1.5">Impact</Link>
        </div>

        {/* Right side: Mobile Bell + Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bell — mobile only, volunteers only */}
          {userType === 'volunteer' && (
            <Link
              href="/notifications"
              className="relative p-2 rounded-full hover:bg-muted active:scale-95 transition-all md:hidden"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#80242a]" />
              )}
            </Link>
          )}
          {/* Avatar — desktop only */}
          <Link href="/volunteers/me" className="hidden md:block group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border group-hover:border-border group-active:scale-95 transition-all bg-muted flex items-center justify-center shadow-sm">
              {displayImage ? (
                <Image src={displayImage} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-muted-foreground group-hover:text-foreground transition-colors">{displayInitial}</span>
              )}
            </div>
          </Link>
        </div>
      </div>
      </nav>
      {/* Reserves the fixed nav's height in normal flow (no-op on layout.tsx). */}
      <div className="h-12 md:h-14" aria-hidden="true" />
    </>
  )
}