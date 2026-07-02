"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bell, Users, X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

export function OrgTopNav() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [bellLoading, setBellLoading] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

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

  // On mount / route change: fetch profile + unread count
  useEffect(() => {
    if (shouldHide) return

    const fetchUser = async () => {
      try {
        const [profileRes, countRes] = await Promise.all([
          api.getUserProfile(),
          api.getUnreadCount(),
        ])
        if (profileRes?.profile) setProfile(profileRes.profile)
        setUnreadCount(countRes?.count ?? 0)
      } catch {
        console.log("No active session found")
      }
    }
    fetchUser()
  }, [pathname, shouldHide])

  // Close dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [bellOpen])

  const handleBellClick = async () => {
    if (bellOpen) {
      setBellOpen(false)
      return
    }
    setBellOpen(true)
    setBellLoading(true)
    try {
      // Fetch notifications and mark all read concurrently.
      // Fetch completes first in practice, so unread styling is still visible
      // on first open — subsequent opens show all as read.
      const [notifRes] = await Promise.all([
        api.getNotifications(),
        api.markAllNotificationsRead(),
      ])
      setNotifications(notifRes.notifications || [])
      setUnreadCount(0)
    } catch {
      // Bell failure must never surface an error to the user
    } finally {
      setBellLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await api.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch {
      // silent
    }
  }

  const timeAgo = (dateString: string) => {
    const secs = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (secs < 60) return "Just now"
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    return `${Math.floor(secs / 86400)}d ago`
  }

  if (shouldHide) return null

  const displayImage = profile?.avatar_url || profile?.logo_url
  const displayName = profile?.full_name || profile?.name || "Organization"
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "O"

  return (
    <>
      {/* `sticky` silently fails to stick here because `overflow-x: hidden`
          on <body> (globals.css) breaks position:sticky in Chromium — `fixed`
          + a same-height spacer sidesteps that entirely (see top-nav.tsx). */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/60 backdrop-blur-md dark:backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-12 md:h-14 flex items-center justify-between relative">

        {/* Logo */}
        <Link href="/org-home" className="hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="Kindly"
            width={100}
            height={30}
            className="h-5 md:h-6 w-auto dark:invert"
            priority
          />
        </Link>

        {/* Navigation Links (Desktop, absolutely centered) */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/org-home" className="text-[13px] md:text-[15px] text-foreground hover:text-orange-600 transition-colors font-medium">Dashboard</Link>
          <Link href="/org-events" className="text-[13px] md:text-[15px] text-foreground hover:text-orange-600 transition-colors font-medium">Events</Link>
          <Link href="/social" className="text-[13px] md:text-[15px] text-foreground hover:text-orange-600 transition-colors font-medium">Social</Link>
          <Link href="/org-analytics" className="text-[13px] md:text-[15px] text-foreground hover:text-orange-600 transition-colors font-medium flex items-center gap-1.5">Analytics</Link>
        </div>

        {/* Right: Bell + Profile avatar */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">

          {/* Notification Bell — visible on all screen sizes */}
          <div ref={bellRef} className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {/* Dropdown */}
            {bellOpen && (
              <div className="absolute top-full right-0 mt-2 w-[320px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden z-[100]">

                {/* Header */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold text-foreground">Notifications</h3>
                  <button
                    onClick={() => setBellOpen(false)}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Body */}
                <div className="max-h-[380px] overflow-y-auto">
                  {bellLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-10 text-center px-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-[13px] font-medium text-foreground">All caught up</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 group transition-colors ${
                          !n.read ? "bg-orange-50 dark:bg-orange-500/15/50" : "bg-card hover:bg-muted/50"
                        }`}
                      >
                        {/* Actor avatar */}
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                          {n.actor_avatar ? (
                            <img src={n.actor_avatar} alt="" className="w-full h-full object-cover" />
                          ) : n.actor_name ? (
                            <span className="text-[11px] font-bold text-orange-600">
                              {n.actor_name.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <Users className="w-4 h-4 text-orange-400" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-snug ${!n.read ? "font-medium text-foreground" : "text-[#3d3d3f]"}`}>
                            {n.actor_name && (
                              <span className="font-semibold">{n.actor_name} </span>
                            )}
                            {n.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>

                        {/* Unread indicator dot */}
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />
                        )}

                        {/* Delete button — appears on row hover */}
                        <button
                          onClick={(e) => handleDelete(e, n.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-muted transition-all shrink-0 mt-0.5"
                          aria-label="Dismiss"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile avatar (Desktop only) */}
          <Link href={profile?.id ? `/organizations/${profile.id}` : "#"} className="hidden md:block group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-border group-hover:border-orange-400 group-active:scale-95 transition-all bg-muted flex items-center justify-center shadow-sm">
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                  {displayInitial}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>
      </nav>
      <div className="h-12 md:h-14" aria-hidden="true" />
    </>
  )
}
