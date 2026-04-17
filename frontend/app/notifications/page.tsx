"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, ArrowLeft, UserPlus } from "lucide-react"
import { api } from "@/lib/api"

type Notification = {
  id: string
  actor_id: string | null
  actor_name: string | null
  actor_avatar: string | null
  type: string
  message: string
  read: boolean
  entity_id: string | null
  created_at: string
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "new_follower") {
    return (
      <div className="w-9 h-9 rounded-full bg-[#80242a]/10 flex items-center justify-center shrink-0">
        <UserPlus className="w-4 h-4 text-[#80242a]" />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <Bell className="w-4 h-4 text-gray-500" />
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ notifications: data }] = await Promise.all([
          api.getNotifications(),
          api.markAllNotificationsRead(),
        ])
        setNotifications(data)
      } catch {
        // fail silently — user just sees empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#f5f5f7]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#1d1d1f]" />
          </button>
          <h1 className="text-[17px] font-semibold text-[#1d1d1f]">Notifications</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex flex-col gap-3 px-4 pt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">You're all caught up</p>
            <p className="text-[13px] text-[#86868b]">New activity will appear here.</p>
          </div>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3.5 border-b border-[#f5f5f7] transition-colors ${
                  !n.read ? "bg-[#80242a]/[0.03]" : ""
                }`}
              >
                <NotificationIcon type={n.type} />
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[14px] text-[#1d1d1f] leading-snug">
                    <span className="font-semibold">{n.actor_name ?? "Someone"}</span>{" "}
                    {n.message}
                  </p>
                  <p className="text-[12px] text-[#86868b] mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-[#80242a] shrink-0 mt-1.5" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
