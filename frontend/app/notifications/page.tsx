"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, ArrowLeft, UserPlus, UserCheck, Check, ChevronRight, Users } from "lucide-react"
import { api } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

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

type PendingRequest = {
  requester_id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  headline: string | null
  is_verified: boolean
  requested_at: string
}

type RequestState = 'idle' | 'loading' | 'accepted' | 'rejected'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Notification icon ────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  if (type === "new_follower" || type === "follow_accepted") {
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 10 }: { src: string | null; name: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`
  return (
    <div className={`${sizeClass} rounded-full bg-gray-100 overflow-hidden shrink-0`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-sm">
            {name?.charAt(0)?.toUpperCase()}
          </div>
      }
    </div>
  )
}

// ─── Requests Inbox ───────────────────────────────────────────────────────────

function RequestsInbox({
  requests,
  onBack,
  onCountChange,
}: {
  requests: PendingRequest[]
  onBack: () => void
  onCountChange: (newCount: number) => void
}) {
  const [items, setItems] = useState(requests)
  const [states, setStates] = useState<Record<string, RequestState>>({})

  const handleAccept = async (requesterId: string) => {
    setStates(prev => ({ ...prev, [requesterId]: 'loading' }))
    try {
      await api.acceptFollowRequest(requesterId)
      setStates(prev => ({ ...prev, [requesterId]: 'accepted' }))
      setTimeout(() => {
        setItems(prev => {
          const next = prev.filter(r => r.requester_id !== requesterId)
          onCountChange(next.length)
          return next
        })
      }, 900)
    } catch {
      setStates(prev => ({ ...prev, [requesterId]: 'idle' }))
    }
  }

  const handleReject = async (requesterId: string) => {
    setStates(prev => ({ ...prev, [requesterId]: 'loading' }))
    try {
      await api.rejectFollowRequest(requesterId)
      setStates(prev => ({ ...prev, [requesterId]: 'rejected' }))
      setTimeout(() => {
        setItems(prev => {
          const next = prev.filter(r => r.requester_id !== requesterId)
          onCountChange(next.length)
          return next
        })
      }, 900)
    } catch {
      setStates(prev => ({ ...prev, [requesterId]: 'idle' }))
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#f5f5f7]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#1d1d1f]" />
          </button>
          <h1 className="text-[17px] font-semibold text-[#1d1d1f]">Follow Requests</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">No pending requests</p>
            <p className="text-[13px] text-[#86868b]">New follow requests will appear here.</p>
          </div>
        ) : (
          <ul>
            {items.map((req) => {
              const state = states[req.requester_id] ?? 'idle'
              return (
                <li
                  key={req.requester_id}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f5f7]"
                >
                  <Avatar src={req.avatar_url} name={req.full_name} size={10} />

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1d1d1f] truncate">{req.full_name}</p>
                    <p className="text-[12px] text-[#86868b] truncate">
                      {req.city || req.headline || 'Volunteer'} · {timeAgo(req.requested_at)}
                    </p>
                  </div>

                  {/* Action buttons */}
                  {state === 'accepted' ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium shrink-0">
                      <Check className="w-3.5 h-3.5" /> Confirmed
                    </span>
                  ) : state === 'rejected' ? (
                    <span className="text-xs text-gray-400 font-medium shrink-0">Deleted</span>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAccept(req.requester_id)}
                        disabled={state === 'loading'}
                        className="px-3 py-1.5 bg-[#80242a] text-white text-xs font-semibold rounded-lg hover:bg-[#6b1e23] active:scale-95 transition-all disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleReject(req.requester_id)}
                        disabled={state === 'loading'}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showRequestsInbox, setShowRequestsInbox] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [notifResult, requestsResult] = await Promise.all([
          api.getNotifications(),
          api.getPendingFollowRequests(),
          api.markAllNotificationsRead(),
        ])
        // Filter out follow_request type — they now live in the dedicated inbox
        setNotifications(
          notifResult.notifications.filter((n: Notification) => n.type !== 'follow_request')
        )
        setPendingRequests(requestsResult.requests)
        setPendingCount(requestsResult.count)
      } catch {
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // If the requests inbox is open, render it as a full-page overlay
  if (showRequestsInbox) {
    return (
      <RequestsInbox
        requests={pendingRequests}
        onBack={() => setShowRequestsInbox(false)}
        onCountChange={(n) => setPendingCount(n)}
      />
    )
  }

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
        {/* ── Follow Requests row — always at top ── */}
        <button
          onClick={() => setShowRequestsInbox(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#f5f5f7] hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-[#1d1d1f]">Follow Requests</p>
            <p className="text-[12px] text-[#86868b]">
              {loading ? '...' : pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-[#80242a] text-white text-[11px] font-bold rounded-full flex items-center justify-center shrink-0">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        {/* ── General notifications feed ── */}
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
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center pt-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-[15px] font-semibold text-[#1d1d1f] mb-1">Couldn't load notifications</p>
            <p className="text-[13px] text-[#86868b]">Check your connection and try again.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 px-8 text-center">
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
