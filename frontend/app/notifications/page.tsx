"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, ArrowLeft, UserPlus, UserCheck, Check, ChevronRight, Users, Heart, MessageCircle, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { api, type PostAuthor } from "@/lib/api"
import { VerifiedBadge } from "@/components/verified-badge"

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
  post_thumbnail?: string | null
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

const isPostNotif = (type: string) => type === 'post_liked' || type === 'post_commented'

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 10 }: { src: string | null; name: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`
  return (
    <div className={`${sizeClass} rounded-full bg-muted overflow-hidden shrink-0`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold text-sm">
            {name?.charAt(0)?.toUpperCase()}
          </div>
      }
    </div>
  )
}

// ─── Notification icon (non-post types) ───────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  if (type === "new_follower" || type === "follow_accepted") {
    return (
      <div className="w-10 h-10 rounded-full bg-[#80242a]/10 flex items-center justify-center shrink-0">
        <UserPlus className="w-4 h-4 text-[#80242a]" />
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
      <Bell className="w-4 h-4 text-muted-foreground" />
    </div>
  )
}

// ─── Likes list modal ─────────────────────────────────────────────────────────

function LikesListModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [likers, setLikers] = useState<PostAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPostLikes(postId)
      .then(setLikers)
      .finally(() => setLoading(false))
  }, [postId])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl pb-safe max-h-[70vh] flex flex-col">
        {/* Handle + header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-border">
          <span className="text-[15px] font-semibold text-foreground">Liked by</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : likers.length === 0 ? (
            <p className="text-center text-[13px] text-muted-foreground py-10">No likes yet.</p>
          ) : (
            <ul>
              {likers.map((liker) => (
                <li key={liker.user_id}>
                  <Link
                    href={`/volunteers/${liker.user_id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <Avatar src={liker.avatar_url} name={liker.full_name} size={10} />
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[14px] font-semibold text-foreground truncate">{liker.full_name}</span>
                      {liker.is_verified && <VerifiedBadge />}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold text-foreground">Follow Requests</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">No pending requests</p>
            <p className="text-[13px] text-muted-foreground">New follow requests will appear here.</p>
          </div>
        ) : (
          <ul>
            {items.map((req) => {
              const state = states[req.requester_id] ?? 'idle'
              return (
                <li
                  key={req.requester_id}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-border"
                >
                  <Avatar src={req.avatar_url} name={req.full_name} size={10} />

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{req.full_name}</p>
                    <p className="text-[12px] text-muted-foreground truncate">
                      {req.city || req.headline || 'Volunteer'} · {timeAgo(req.requested_at)}
                    </p>
                  </div>

                  {state === 'accepted' ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium shrink-0">
                      <Check className="w-3.5 h-3.5" /> Confirmed
                    </span>
                  ) : state === 'rejected' ? (
                    <span className="text-xs text-muted-foreground font-medium shrink-0">Deleted</span>
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
                        className="px-3 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
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
  const [likesModalPostId, setLikesModalPostId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [notifResult, requestsResult] = await Promise.all([
          api.getNotifications(),
          api.getPendingFollowRequests(),
          api.markAllNotificationsRead(),
        ])
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-muted active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold text-foreground">Notifications</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* ── Follow Requests row — always at top ── */}
        <button
          onClick={() => setShowRequestsInbox(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border hover:bg-muted active:bg-muted transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-foreground">Follow Requests</p>
            <p className="text-[12px] text-muted-foreground">
              {loading ? '...' : pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-[#80242a] text-white text-[11px] font-bold rounded-full flex items-center justify-center shrink-0">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        {/* ── General notifications feed ── */}
        {loading ? (
          <div className="flex flex-col gap-3 px-4 pt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center pt-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">Couldn't load notifications</p>
            <p className="text-[13px] text-muted-foreground">Check your connection and try again.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">You're all caught up</p>
            <p className="text-[13px] text-muted-foreground">New activity will appear here.</p>
          </div>
        ) : (
          <ul>
            {notifications.map((n) => {
              if (isPostNotif(n.type)) {
                // Post like / comment — dedicated layout with thumbnail
                return (
                  <li
                    key={n.id}
                    className={`flex items-center gap-3 px-4 py-3.5 border-b border-border ${!n.read ? "bg-[#80242a]/[0.03]" : ""}`}
                  >
                    {/* Actor avatar with type badge */}
                    <div className="relative shrink-0">
                      <Avatar src={n.actor_avatar} name={n.actor_name ?? '?'} size={10} />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${n.type === 'post_liked' ? 'bg-red-500' : 'bg-primary'}`}>
                        {n.type === 'post_liked'
                          ? <Heart className="w-2.5 h-2.5 text-white fill-white" />
                          : <MessageCircle className="w-2.5 h-2.5 text-white" />
                        }
                      </div>
                    </div>

                    {/* Message + time — taps to post detail */}
                    <button
                      onClick={() => n.entity_id && router.push(`/posts/${n.entity_id}`)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-[14px] text-foreground leading-snug">{n.message}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                    </button>

                    {/* Post thumbnail — taps to post detail */}
                    {n.post_thumbnail && (
                      <button
                        onClick={() => n.entity_id && router.push(`/posts/${n.entity_id}`)}
                        className="shrink-0"
                      >
                        <img
                          src={n.post_thumbnail}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-border"
                        />
                      </button>
                    )}

                    {/* For likes: show likers modal button */}
                    {n.type === 'post_liked' && n.entity_id && (
                      <button
                        onClick={() => setLikesModalPostId(n.entity_id)}
                        className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-[#80242a] shrink-0" />
                    )}
                  </li>
                )
              }

              // Default layout for follow / endorsement / other types
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-border transition-colors ${!n.read ? "bg-[#80242a]/[0.03]" : ""}`}
                >
                  <NotificationIcon type={n.type} />
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[14px] text-foreground leading-snug">
                      <span className="font-semibold">{n.actor_name ?? "Someone"}</span>{" "}
                      {n.message}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-[#80242a] shrink-0 mt-1.5" />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Likes list modal */}
      {likesModalPostId && (
        <LikesListModal
          postId={likesModalPostId}
          onClose={() => setLikesModalPostId(null)}
        />
      )}
    </div>
  )
}
