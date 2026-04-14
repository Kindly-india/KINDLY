"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sparkles, Globe, User, BarChart3 } from "lucide-react"
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
        {/* NEW IMPACT TAB */}
        <Link href="/volunteer-impact" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <BarChart3 className={cn("w-6 h-6 transition-colors", isActive("/volunteer-impact") ? "text-[#0066cc]" : "text-gray-400")} />
          <span className={cn("text-[10px] font-medium", isActive("/volunteer-impact") ? "text-[#0066cc]" : "text-gray-400")}>Impact</span>
        </Link>
        <Link href="/social" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <Globe className={cn("w-6 h-6 transition-colors", isActive("/social") ? "text-[#0066cc]" : "text-gray-400")} />
          <span className={cn("text-[10px] font-medium", isActive("/social") ? "text-[#0066cc]" : "text-gray-400")}>Social</span>
        </Link>
        <Link href={profileLink} className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
          <User className={cn("w-6 h-6 transition-colors", pathname.startsWith('/volunteers/') ? "text-[#0066cc]" : "text-gray-400")} />
          <span className={cn("text-[10px] font-medium", pathname.startsWith('/volunteers/') ? "text-[#0066cc]" : "text-gray-400")}>Profile</span>
        </Link>
      </div>
    </nav>
  )
}