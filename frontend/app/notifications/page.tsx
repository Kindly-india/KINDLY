"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, ArrowLeft, UserPlus, UserCheck, Check, ChevronRight, Users, Heart, MessageCircle, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { api, type PostAuthor } from "@/lib/api"
import { VerifiedBadge } from "@/components/verified-badge"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

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
type FollowBackState = 'idle' | 'loading' | 'done'

type DisplayItem =
  | { kind: 'single'; notif: Notification }
  | {
      kind: 'follow-group'
      ids: string[]
      actorIds: (string | null)[]
      actorNames: string[]
      actorAvatars: (string | null)[]
      total: number
      createdAt: string
      allRead: boolean
    }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const isPostNotif = (type: string) => type === 'post_liked' || type === 'post_commented'

function groupByDay(notifications: Notification[]) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000)

  const today: Notification[] = []
  const yesterday: Notification[] = []
  const earlier: Notification[] = []

  for (const n of notifications) {
    const d = new Date(n.created_at)
    if (d >= startOfToday) today.push(n)
    else if (d >= startOfYesterday) yesterday.push(n)
    else earlier.push(n)
  }

  return [
    { label: "Today", items: today },
    { label: "Yesterday", items: yesterday },
    { label: "Earlier", items: earlier },
  ].filter(g => g.items.length > 0)
}

// Collapses consecutive "started following you" notifications into a single
// digest row — the common source of clutter when someone gets followed by
// several people in a short window.
function groupConsecutiveFollows(items: Notification[]): DisplayItem[] {
  const out: DisplayItem[] = []
  let i = 0
  while (i < items.length) {
    const n = items[i]
    if (n.type === 'new_follower') {
      const bucket: Notification[] = [n]
      let j = i + 1
      while (j < items.length && items[j].type === 'new_follower') {
        bucket.push(items[j])
        j++
      }
      if (bucket.length === 1) {
        out.push({ kind: 'single', notif: n })
      } else {
        out.push({
          kind: 'follow-group',
          ids: bucket.map(b => b.id),
          actorIds: bucket.map(b => b.actor_id),
          actorNames: bucket.map(b => b.actor_name ?? 'Someone'),
          actorAvatars: bucket.map(b => b.actor_avatar),
          total: bucket.length,
          createdAt: bucket[0].created_at,
          allRead: bucket.every(b => b.read),
        })
      }
      i = j
    } else {
      out.push({ kind: 'single', notif: n })
      i++
    }
  }
  return out
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 10 }: { src: string | null; name: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`
  return (
    <div className={`${sizeClass} rounded-full bg-muted overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10`}>
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
      <div className="w-10 h-10 rounded-full bg-[#ff6b6b]/10 flex items-center justify-center shrink-0">
        <UserPlus className="w-4 h-4 text-[#ff6b6b]" />
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

function LikesListModal({
  postId,
  people: providedPeople,
  title = "Liked by",
  onClose,
}: {
  postId?: string
  people?: PostAuthor[]
  title?: string
  onClose: () => void
}) {
  const [likers, setLikers] = useState<PostAuthor[]>(providedPeople ?? [])
  const [loading, setLoading] = useState(!providedPeople && !!postId)

  useEffect(() => {
    if (providedPeople || !postId) return
    api.getPostLikes(postId)
      .then(setLikers)
      .finally(() => setLoading(false))
  }, [postId, providedPeople])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pb-6 max-h-[70vh] flex flex-col shadow-2xl shadow-black/20 dark:shadow-black/60 border-t border-black/5 dark:border-white/10">
        {/* Handle + header */}
        <div className="flex justify-center pt-2.5">
          <div className="w-9 h-1 rounded-full bg-black/10 dark:bg-white/15" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-black/5 dark:border-white/10">
          <span className="text-[15px] font-bold text-foreground">{title}</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : likers.length === 0 ? (
            <p className="text-center text-[13px] text-muted-foreground py-10">Nothing to show yet.</p>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {likers.map((liker) => (
                <li key={liker.user_id}>
                  <Link
                    href={`/volunteers/${liker.user_id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
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
    <div className="min-h-screen bg-neutral-50 dark:bg-black relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-blue-200/20 dark:from-blue-500/[0.14] to-transparent blur-3xl" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-bold text-foreground">Follow Requests</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 relative">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-500/5 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-blue-500" />
            </div>
            <p className="text-[15px] font-bold text-foreground mb-1">No pending requests</p>
            <p className="text-[13px] text-muted-foreground">New follow requests will appear here.</p>
          </div>
        ) : (
          <ScrollReveal className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 overflow-hidden">
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {items.map((req) => {
                const state = states[req.requester_id] ?? 'idle'
                return (
                  <li
                    key={req.requester_id}
                    className="flex items-center gap-3 px-4 py-3.5"
                  >
                    <Avatar src={req.avatar_url} name={req.full_name} size={10} />

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">{req.full_name}</p>
                      <p className="text-[12px] text-muted-foreground truncate">
                        {req.city || req.headline || 'Volunteer'} · {timeAgo(req.requested_at)}
                      </p>
                    </div>

                    {state === 'accepted' ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                        <Check className="w-3.5 h-3.5" /> Confirmed
                      </span>
                    ) : state === 'rejected' ? (
                      <span className="text-xs text-muted-foreground font-medium shrink-0">Deleted</span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAccept(req.requester_id)}
                          disabled={state === 'loading'}
                          className="px-3 py-1.5 bg-[#ff6b6b] text-white text-xs font-semibold rounded-lg hover:bg-[#ee5a5a] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleReject(req.requester_id)}
                          disabled={state === 'loading'}
                          className="px-3 py-1.5 bg-black/5 dark:bg-white/10 text-foreground text-xs font-semibold rounded-lg hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </ScrollReveal>
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
  const [peopleModal, setPeopleModal] = useState<{ title: string; postId?: string; people?: PostAuthor[] } | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [followBackStates, setFollowBackStates] = useState<Record<string, FollowBackState>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const [notifResult, requestsResult] = await Promise.all([
          api.getNotifications(),
          api.getPendingFollowRequests(),
          api.markAllNotificationsRead(),
        ])
        const raw = notifResult.notifications as Notification[]
        setNotifications(raw.filter((n) => n.type !== 'follow_request'))
        setHasMore(!!notifResult.hasMore)
        setCursor(raw.length ? raw[raw.length - 1].created_at : null)
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

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await api.getNotifications(cursor)
      const raw = res.notifications as Notification[]
      setNotifications(prev => [...prev, ...raw.filter((n) => n.type !== 'follow_request')])
      setHasMore(!!res.hasMore)
      setCursor(raw.length ? raw[raw.length - 1].created_at : null)
    } catch {
      // leave hasMore as-is so the user can retry
    } finally {
      setLoadingMore(false)
    }
  }

  const handleDismiss = async (ids: string[]) => {
    const idSet = new Set(ids)
    const backup = notifications
    setNotifications(prev => prev.filter(n => !idSet.has(n.id)))
    try {
      await Promise.all(ids.map(id => api.deleteNotification(id)))
    } catch {
      setNotifications(backup)
    }
  }

  const handleFollowBack = async (actorId: string) => {
    setFollowBackStates(prev => ({ ...prev, [actorId]: 'loading' }))
    try {
      await api.followUser(actorId)
      setFollowBackStates(prev => ({ ...prev, [actorId]: 'done' }))
    } catch {
      setFollowBackStates(prev => ({ ...prev, [actorId]: 'idle' }))
    }
  }

  if (showRequestsInbox) {
    return (
      <RequestsInbox
        requests={pendingRequests}
        onBack={() => setShowRequestsInbox(false)}
        onCountChange={(n) => setPendingCount(n)}
      />
    )
  }

  const groups = groupByDay(notifications)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-[#ff6b6b]/[0.12] dark:from-[#ff6b6b]/[0.1] to-transparent blur-3xl" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-bold text-foreground">Notifications</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6 relative">
        {/* ── Follow Requests entry — always at top, its own glass card ── */}
        <ScrollReveal>
          <button
            onClick={() => setShowRequestsInbox(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ease-out text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground">Follow Requests</p>
              <p className="text-[12px] text-muted-foreground">
                {loading ? '...' : pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
              </p>
            </div>
            {pendingCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-[#ff6b6b] text-white text-[11px] font-bold rounded-full flex items-center justify-center shrink-0">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </ScrollReveal>

        {/* ── General notifications feed ── */}
        {loading ? (
          <div className="flex flex-col gap-3 px-1">
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
          <div className="flex flex-col items-center justify-center pt-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-500/20 dark:to-red-500/5 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-[15px] font-bold text-foreground mb-1">Couldn&apos;t load notifications</p>
            <p className="text-[13px] text-muted-foreground">Check your connection and try again.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-white/10 dark:to-white/[0.03] flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-bold text-foreground mb-1">You&apos;re all caught up</p>
            <p className="text-[13px] text-muted-foreground">New activity will appear here.</p>
          </div>
        ) : (
          <>
            {groups.map((group, gi) => (
              <ScrollReveal key={group.label} delay={gi * 0.05} className="space-y-2">
                <h2 className="px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h2>
                <div className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 overflow-hidden">
                  <ul className="divide-y divide-black/5 dark:divide-white/10">
                    {groupConsecutiveFollows(group.items).map((item) => {
                      if (item.kind === 'follow-group') {
                        return (
                          <li
                            key={item.ids.join('-')}
                            className="flex items-center gap-3 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                          >
                            <button
                              onClick={() => setPeopleModal({
                                title: 'New followers',
                                people: item.actorIds.map((id, idx) => ({
                                  id: id ?? '',
                                  user_id: id ?? '',
                                  full_name: item.actorNames[idx],
                                  avatar_url: item.actorAvatars[idx],
                                  is_verified: false,
                                })),
                              })}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <div className="flex -space-x-3 shrink-0">
                                {item.actorAvatars.slice(0, 3).map((av, idx) => (
                                  <div key={idx} className="ring-2 ring-white dark:ring-neutral-900 rounded-full">
                                    <Avatar src={av} name={item.actorNames[idx]} size={9} />
                                  </div>
                                ))}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] text-foreground leading-snug">
                                  <span className="font-semibold">{item.actorNames[0]}</span>
                                  {item.total === 2 && <> and <span className="font-semibold">{item.actorNames[1]}</span></>}
                                  {item.total > 2 && (
                                    <>
                                      , <span className="font-semibold">{item.actorNames[1]}</span> and{" "}
                                      <span className="font-semibold">{item.total - 2} other{item.total - 2 > 1 ? 's' : ''}</span>
                                    </>
                                  )}
                                  {" "}started following you.
                                </p>
                                <p className="text-[12px] text-muted-foreground mt-0.5">{timeAgo(item.createdAt)}</p>
                              </div>
                            </button>

                            <div className="flex items-center gap-2 shrink-0">
                              {!item.allRead && <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />}
                              <button
                                onClick={() => handleDismiss(item.ids)}
                                className="p-1 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                aria-label="Dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </li>
                        )
                      }

                      const n = item.notif

                      if (isPostNotif(n.type)) {
                        // Post like / comment — dedicated layout with thumbnail
                        return (
                          <li
                            key={n.id}
                            className="flex items-center gap-3 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                          >
                            {/* Actor avatar with type badge — taps to likers list for post_liked */}
                            {n.type === 'post_liked' && n.entity_id ? (
                              <button
                                onClick={() => setPeopleModal({ title: 'Liked by', postId: n.entity_id! })}
                                className="relative shrink-0"
                              >
                                <Avatar src={n.actor_avatar} name={n.actor_name ?? '?'} size={10} />
                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center bg-red-500">
                                  <Heart className="w-2.5 h-2.5 text-white fill-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="relative shrink-0">
                                <Avatar src={n.actor_avatar} name={n.actor_name ?? '?'} size={10} />
                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center bg-[#ff6b6b]">
                                  <MessageCircle className="w-2.5 h-2.5 text-white" />
                                </div>
                              </div>
                            )}

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
                                  className="w-12 h-12 rounded-lg object-cover border border-black/5 dark:border-white/10"
                                />
                              </button>
                            )}

                            <div className="flex items-center gap-2 shrink-0">
                              {!n.read && <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />}
                              <button
                                onClick={() => handleDismiss([n.id])}
                                className="p-1 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                aria-label="Dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </li>
                        )
                      }

                      // Default layout for follow / endorsement / other types
                      return (
                        <li
                          key={n.id}
                          className="flex items-start gap-3 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <button
                            onClick={() => n.actor_id && router.push(`/volunteers/${n.actor_id}`)}
                            className="flex items-start gap-3 flex-1 min-w-0 text-left"
                          >
                            <NotificationIcon type={n.type} />
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-[14px] text-foreground leading-snug">
                                <span className="font-semibold">{n.actor_name ?? "Someone"}</span>{" "}
                                {n.message}
                              </p>
                              <p className="text-[12px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            {n.type === 'new_follower' && n.actor_id && (
                              followBackStates[n.actor_id] === 'done' ? (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <Check className="w-3 h-3" /> Following
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleFollowBack(n.actor_id!)}
                                  disabled={followBackStates[n.actor_id] === 'loading'}
                                  className="px-2.5 py-1 bg-[#ff6b6b] text-white text-[11px] font-semibold rounded-lg hover:bg-[#ee5a5a] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                  Follow back
                                </button>
                              )
                            )}
                            {!n.read && <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />}
                            <button
                              onClick={() => handleDismiss([n.id])}
                              className="p-1 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                              aria-label="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </ScrollReveal>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-full border border-black/5 dark:border-white/5 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load older notifications'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* People list modal — post likers or a follow-digest roster */}
      {peopleModal && (
        <LikesListModal
          postId={peopleModal.postId}
          people={peopleModal.people}
          title={peopleModal.title}
          onClose={() => setPeopleModal(null)}
        />
      )}
    </div>
  )
}
