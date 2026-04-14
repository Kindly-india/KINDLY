"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Globe, BarChart3, User, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

export function OrgMobileNav() {
    const pathname = usePathname()
    const [profile, setProfile] = useState<any>(null)
    
    // Checks if the current URL matches the link
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

    const profileLink = profile?.id ? `/organizations/${profile.id}` : "/login"

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16 px-2">
                <Link href="/org-home" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
                    <LayoutDashboard className={cn("w-6 h-6 transition-colors", isActive("/org-home") ? "text-orange-600" : "text-gray-400")} />
                    <span className={cn("text-[10px] font-medium", isActive("/org-home") ? "text-orange-600" : "text-gray-400")}>Dash</span>
                </Link>
                <Link href="/org-events" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
                    <Calendar className={cn("w-6 h-6 transition-colors", isActive("/org-events") ? "text-orange-600" : "text-gray-400")} />
                    <span className={cn("text-[10px] font-medium", isActive("/org-events") ? "text-orange-600" : "text-gray-400")}>Events</span>
                </Link>
                
                {/* Points to the shared social page! */}
                <Link href="/social" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
                    <Globe className={cn("w-6 h-6 transition-colors", isActive("/social") ? "text-orange-600" : "text-gray-400")} />
                    <span className={cn("text-[10px] font-medium", isActive("/social") ? "text-orange-600" : "text-gray-400")}>Social</span>
                </Link>
                
                <Link href="/org-analytics" className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
                    <BarChart3 className={cn("w-6 h-6 transition-colors", isActive("/org-analytics") ? "text-orange-600" : "text-gray-400")} />
                    <span className={cn("text-[10px] font-medium", isActive("/org-analytics") ? "text-orange-600" : "text-gray-400")}>Analytics</span>
                </Link>
                <Link href={profileLink} className="flex flex-col items-center justify-center w-full h-full space-y-1 prevent-select">
                    <User className={cn("w-6 h-6 transition-colors", pathname.startsWith('/organizations/') ? "text-orange-600" : "text-gray-400")} />
                    <span className={cn("text-[10px] font-medium", pathname.startsWith('/organizations/') ? "text-orange-600" : "text-gray-400")}>Profile</span>
                </Link>
            </div>
        </nav>
    )
}