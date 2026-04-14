"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { api } from "@/lib/api"

export function TopNav() {
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
        if (res?.profile) setProfile(res.profile)
      } catch (e) {
        console.log("No active session found")
      }
    }
    fetchUser()
  }, [pathname, shouldHide])

  if (shouldHide) return null

  const displayImage = profile?.avatar_url || profile?.logo_url
  const displayName = profile?.full_name || profile?.name || "User"
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U"

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#f5f5f7]">
      <div className="max-w-300 mx-auto px-4 md:px-8 h-12 md:h-14 flex items-center justify-between relative">
        
        {/* 2nd Problem Fixed: Logo now directs to Home screen */}
        <Link href="/home" className="hover:opacity-80 transition-opacity">
          <Image 
              src="/logo.png" 
              alt="Kindly" 
              width={100} 
              height={30} 
              className="h-5 md:h-6 w-auto" 
              priority 
          />
        </Link>

        {/* Navigation Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/events" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">Events</Link>
          <Link href="/history" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">History</Link>
          <Link href="/social" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">Social</Link>
          <Link href="/volunteer-impact" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium flex items-center gap-1.5">Impact</Link>
        </div>

        {/* Profile (Hidden on Mobile) */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href={profile?.id ? `/volunteers/${profile.id}` : '#'} className="hidden md:block group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 group-hover:border-gray-400 group-active:scale-95 transition-all bg-gray-50 flex items-center justify-center shadow-sm">
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{displayInitial}</span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </nav>
  )
}