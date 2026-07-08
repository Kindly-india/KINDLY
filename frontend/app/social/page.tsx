"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { api, type Post } from "@/lib/api"
import {
  Search,
  ArrowUpRight,
  Loader2,
  User,
  X,
  ImageIcon,
  ChevronRight,
  Calendar,
  Users,
  Clock,
  Building2,
} from "lucide-react"
import { cn, formatHoursTotal } from "@/lib/utils"
import { VerifiedBadge } from "@/components/verified-badge"
import { Card } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

type Suggestion = {
  user_id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  is_verified: boolean
  total_hours: number
}

type CompletedEvent = {
  id: string
  title: string
  cover_image_url: string | null
  event_date: string
  location: string
  org_name: string | null
  org_logo_url: string | null
  org_id: string
  attendee_count: number
  total_hours: number
}

// ─── Events Tab ───────────────────────────────────────────────────────────────
function EventsTab() {
  const [events, setEvents] = useState<CompletedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    api.getCompletedEvents()
      .then(res => { if (mounted) setEvents(res.events) })
      .catch(() => { if (mounted) setError(true) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) {
    // Match the community grid skeleton exactly: 2-col grid of square pulses
    return (
      <div className="px-2">
        <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-[#fff5f5] dark:bg-white/5 flex items-center justify-center mb-3">
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-[14px] font-semibold text-foreground mb-1">Couldn't load events</p>
        <p className="text-[12px] text-muted-foreground">Please try again later.</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center mb-3">
          <Calendar className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-[14px] font-semibold text-foreground mb-1">No completed events yet</p>
        <p className="text-[12px] text-muted-foreground">Events will appear here once they're completed.</p>
      </div>
    )
  }

  // Same grid container as community tab: grid-cols-2, gap-0.5, rounded-xl, overflow-hidden
  return (
    <ScrollReveal className="px-2">
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        {events.map((ev) => {
          const dateStr = new Date(ev.event_date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short',
          })

          return (
            <Link
              key={ev.id}
              href={`/events/${ev.id}/showcase`}
              // aspect-square matches community post cell size exactly
              className="aspect-square overflow-hidden bg-muted relative block group"
            >
              {/* Cover image — full bleed, same as community photo */}
              {ev.cover_image_url ? (
                <img
                  src={ev.cover_image_url}
                  alt={ev.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-active:scale-105 opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-teal-900 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-emerald-400/50" />
                </div>
              )}

              {/* Bottom gradient + info overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Stat pills — top-right, same position as the multi-photo chevron in community */}
              <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end">
                <span className="flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-sm px-1.5 py-0.5 text-white text-[9px] font-semibold leading-none">
                  <Users className="w-2.5 h-2.5 mr-0.5" />{ev.attendee_count}
                </span>
                {ev.total_hours > 0 && (
                  <span className="flex items-center gap-0.5 bg-emerald-600/80 backdrop-blur-sm rounded-sm px-1.5 py-0.5 text-white text-[9px] font-semibold leading-none">
                    <Clock className="w-2.5 h-2.5 mr-0.5" />{formatHoursTotal(ev.total_hours)}h
                  </span>
                )}
              </div>

              {/* Bottom text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-[11px] font-bold leading-tight line-clamp-2 mb-0.5">
                  {ev.title}
                </p>
                <div className="flex items-center gap-1 min-w-0">
                  {ev.org_logo_url ? (
                    <img
                      src={ev.org_logo_url}
                      alt=""
                      className="w-3 h-3 rounded-full object-cover shrink-0 border border-white/20"
                    />
                  ) : (
                    <Building2 className="w-3 h-3 text-white/60 shrink-0" />
                  )}
                  <span className="text-white/70 text-[9px] truncate">{ev.org_name ?? dateStr}</span>
                  {ev.org_name && (
                    <span className="text-white/40 text-[9px] shrink-0 ml-auto">{dateStr}</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </ScrollReveal>
  )
}

// ─── Community Tab (existing feed, unchanged) ─────────────────────────────────
function CommunityTab() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<'all' | 'volunteers' | 'orgs'>('all')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const [feedPosts, setFeedPosts] = useState<Post[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedError, setFeedError] = useState(false)

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(true)
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})

  const isSearching = searchQuery.trim().length > 0

  useEffect(() => {
    let mounted = true
    api.getSearchHistory()
      .then(data => { if (mounted) setHistory(data) })
      .catch(() => {})
      .finally(() => { if (mounted) setHistoryLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    api.getPostsFeed()
      .then(res => { if (mounted) setFeedPosts(res.posts) })
      .catch(() => { if (mounted) setFeedError(true) })
      .finally(() => { if (mounted) setFeedLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    api.getSuggestedPeople()
      .then(res => { if (mounted) setSuggestions(res.suggestions) })
      .catch(() => {})
      .finally(() => { if (mounted) setSuggestionsLoading(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    let stale = false
    const timer = setTimeout(async () => {
      try {
        const data = await api.globalSearch(searchQuery)
        // A newer keystroke may have fired while this request was in flight —
        // ignore this response so a slow older query can't overwrite newer results.
        if (stale) return
        setResults(data)
      } catch {
        if (!stale) setResults([])
      } finally {
        if (!stale) setLoading(false)
      }
    }, 300)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [searchQuery])

  const handleResultClick = (item: any) => {
    api.saveSearchHistory({
      result_id: item.id,
      result_type: item.type,
      result_name: item.name,
      result_image: item.image ?? null,
    }).catch(() => {})
    setHistory(prev => {
      const filtered = prev.filter(h => h.result_id !== item.id)
      return [
        { id: `local-${item.id}`, result_id: item.id, result_type: item.type, result_name: item.name, result_image: item.image },
        ...filtered,
      ].slice(0, 10)
    })
  }

  const removeHistoryItem = (id: string) => {
    api.removeSearchHistoryItem(id).catch(() => {})
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  const clearHistory = () => {
    api.clearSearchHistory().catch(() => {})
    setHistory([])
  }

  const handleFollow = async (userId: string) => {
    setFollowingMap(prev => ({ ...prev, [userId]: true }))
    try {
      await api.followUser(userId)
    } catch {
      setFollowingMap(prev => ({ ...prev, [userId]: false }))
    }
  }

  const displayedResults = results.filter(item => {
    if (activeTab === 'all') return true
    if (activeTab === 'volunteers') return item.type === 'volunteer'
    if (activeTab === 'orgs') return item.type === 'org'
    return true
  })

  return (
    <>
      {/* SEARCH BAR */}
      <div className="mb-4 px-2">
        <div className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search volunteers, orgs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-10 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-sm rounded-2xl text-[14px] outline-none focus:border-black/10 dark:focus:border-white/20 focus:shadow-md transition-all duration-300 placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {isSearching && (
          <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-top-2 ml-1">
            {(['all', 'volunteers', 'orgs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all duration-300 ease-out hover:scale-[1.03] active:scale-95",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-md dark:bg-white dark:text-black"
                    : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10"
                )}
              >
                {tab === 'orgs' ? 'Organizations' : tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LOADING — search */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <p className="text-sm">Searching...</p>
        </div>
      )}

      {/* SEARCH RESULTS */}
      {!loading && isSearching && displayedResults.length > 0 && (
        <div className="space-y-2 px-2">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Results</h3>
          <div className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-[20px] border border-black/5 dark:border-white/5 overflow-hidden shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50">
            {displayedResults.map((item, idx) => (
              <Link
                key={idx}
                href={item.type === 'volunteer' ? `/volunteers/${item.id}` : `/organizations/${item.id}`}
                onClick={() => handleResultClick(item)}
                className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors duration-300 border-b border-black/5 dark:border-white/5 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border flex items-center justify-center">
                  {item.image
                    ? <Image src={item.image} width={40} height={40} className="w-full h-full object-cover" alt={item.name} />
                    : <User className="w-5 h-5 text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="font-semibold text-foreground truncate text-[14px]">{item.name}</h4>
                    {item.verified && <VerifiedBadge />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* NO RESULTS */}
      {!loading && isSearching && displayedResults.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-[13px]">No results for "{searchQuery}"</p>
        </div>
      )}

      {/* DEFAULT: HISTORY + SUGGESTIONS + FEED */}
      {!isSearching && !loading && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* RECENT SEARCHES */}
          {!historyLoading && history.length > 0 && (
            <div className="px-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent</h3>
                <button onClick={clearHistory} className="text-[11px] text-red-500 font-bold hover:underline">
                  Clear All
                </button>
              </div>
              <div className="bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-[20px] border border-black/5 dark:border-white/5 overflow-hidden shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-300 border-b border-black/5 dark:border-white/5 last:border-0 group">
                    <Link
                      href={item.result_type === 'volunteer' ? `/volunteers/${item.result_id}` : `/organizations/${item.result_id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0 border border-black/5 dark:border-white/10 flex items-center justify-center">
                        {item.result_image
                          ? <Image src={item.result_image} width={36} height={36} className="w-full h-full object-cover" alt={item.result_name} />
                          : <User className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.result_name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{item.result_type}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeHistoryItem(item.id)}
                      className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 active:scale-90 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                      aria-label="Remove"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PEOPLE YOU MIGHT KNOW */}
          {(suggestionsLoading || suggestions.length > 0) && (
            <ScrollReveal>
              <h2 className="text-[16px] font-semibold text-foreground mb-3 px-2">People you might know</h2>
              <div
                className="flex gap-[10px] overflow-x-auto pb-1 px-5"
                style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {suggestionsLoading
                  ? [1, 2, 3].map((i) => (
                      <Card
                        key={i}
                        className="shrink-0 w-[140px] min-h-[200px] p-0 gap-0 animate-pulse flex flex-col"
                        style={{ scrollSnapAlign: 'start' }}
                      >
                        <div className="flex flex-col items-center px-3 pt-4 gap-2 flex-1">
                          <div className="w-14 h-14 rounded-full bg-muted" />
                          <div className="w-20 h-3 rounded-full bg-muted" />
                          <div className="w-14 h-2.5 rounded-full bg-muted" />
                          <div className="w-12 h-2.5 rounded-full bg-muted" />
                        </div>
                        <div className="px-3 pb-4 mt-auto">
                          <div className="w-full h-8 rounded-full bg-muted" />
                        </div>
                      </Card>
                    ))
                  : suggestions.map((s) => {
                      const isFollowing = followingMap[s.user_id] ?? false
                      return (
                        <Card
                          key={s.user_id}
                          className="shrink-0 w-[140px] min-h-[200px] p-0 gap-0 flex flex-col group"
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          <Link href={`/volunteers/${s.user_id}`} className="flex flex-col items-center px-3 pt-4 gap-1.5 flex-1 min-h-0">
                            <div className="w-14 h-14 rounded-full bg-muted overflow-hidden border border-black/5 dark:border-white/10 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                              {s.avatar_url
                                ? <Image src={s.avatar_url} width={56} height={56} className="w-full h-full object-cover" alt={s.full_name} />
                                : <User className="w-6 h-6 text-muted-foreground" />
                              }
                            </div>
                            <div className="w-full text-center">
                              <div className="flex items-center justify-center gap-1 min-h-[2.2em]">
                                <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2 text-center">{s.full_name}</p>
                                {s.is_verified && <VerifiedBadge />}
                              </div>
                              {/* Fixed-height slot for city/hours so every card in the row keeps
                                  the Follow button pinned at the same spot regardless of which
                                  fields are present (row siblings otherwise stretch to match the
                                  tallest card and this text can spill into it). */}
                              <div className="mt-0.5 space-y-0.5">
                                <p className={cn("text-[11px] text-muted-foreground truncate", !s.city && "invisible")}>
                                  {s.city || "—"}
                                </p>
                                <p className={cn("text-[11px] font-medium text-[#ff6b6b]", s.total_hours <= 0 && "invisible")}>
                                  {formatHoursTotal(s.total_hours)}h volunteered
                                </p>
                              </div>
                            </div>
                          </Link>
                          <div className="px-3 pb-4 mt-auto">
                            <button
                              onClick={() => !isFollowing && handleFollow(s.user_id)}
                              className={cn(
                                "w-full h-8 rounded-full text-[12px] font-semibold transition-all duration-300 ease-out hover:scale-[1.03] active:scale-95",
                                isFollowing
                                  ? "bg-[#ff6b6b] text-white"
                                  : "border border-[#ff6b6b]/60 dark:border-[#ff6b6b]/50 text-[#ff6b6b] hover:bg-[#ff6b6b]/10"
                              )}
                            >
                              {isFollowing ? "Following" : "Follow"}
                            </button>
                          </div>
                        </Card>
                      )
                    })
                }
              </div>
            </ScrollReveal>
          )}

          {/* COMMUNITY GRID */}
          <ScrollReveal delay={0.05} className="px-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight mb-4">Community</h1>

            {feedLoading && (
              <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {!feedLoading && feedError && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#fff5f5] dark:bg-white/5 flex items-center justify-center mb-3">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-[14px] font-semibold text-foreground mb-1">Couldn't load posts</p>
                <p className="text-[12px] text-muted-foreground">Follow volunteers to see their posts here.</p>
              </div>
            )}

            {!feedLoading && !feedError && feedPosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[13px] text-muted-foreground">Follow people to see their posts here.</p>
              </div>
            )}

            {!feedLoading && !feedError && feedPosts.filter(p => p.photo_urls?.[0]).length > 0 && (() => {
              const gridPosts = feedPosts.filter(p => p.photo_urls?.[0])
              const gridCols = gridPosts.length > 0 && gridPosts.length % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2'
              return (
                <div className={`grid ${gridCols} gap-0.5 rounded-xl overflow-hidden`}>
                  {gridPosts.map((post) => (
                    <button
                      key={post.id}
                      className="aspect-square overflow-hidden bg-muted relative group"
                      onClick={() => router.push(`/posts/${post.id}`)}
                    >
                      <img
                        src={post.photo_urls[0]}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-active:scale-105"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement
                          img.style.display = 'none'
                          const parent = img.parentElement
                          if (parent) parent.style.background = '#f3f4f6'
                        }}
                      />
                      {post.photo_urls.length > 1 && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 backdrop-blur-sm rounded-sm flex items-center justify-center">
                          <ChevronRight className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )
            })()}
          </ScrollReveal>
        </div>
      )}
    </>
  )
}

// ─── Page root ────────────────────────────────────────────────────────────────
export default function SocialDiscoveryPage() {
  const [pageTab, setPageTab] = useState<'community' | 'events'>('community')

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-20 relative overflow-x-hidden">
      {/* Ambient glows — top indigo + a bottom-right coral echo (ties into the
          Follow/accent color used throughout this page) so dark mode reads
          as a lit surface rather than flat black the further you scroll. */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[420px] bg-gradient-to-b from-indigo-200/20 dark:from-indigo-500/[0.14] to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-[360px] right-0 translate-x-1/3 w-[560px] h-[560px] rounded-full bg-[#ff6b6b]/[0.04] dark:bg-[#ff6b6b]/[0.07] blur-3xl" />

      <div className="max-w-2xl mx-auto px-2 sm:px-4 pt-4 pb-24 relative">

        {/* PAGE TAB SWITCHER */}
        <div className="flex gap-1 mb-6 p-1 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-full shadow-sm">
          <button
            onClick={() => setPageTab('community')}
            className={cn(
              "flex-1 h-9 rounded-full text-[13px] font-semibold transition-all duration-300 ease-out active:scale-95",
              pageTab === 'community'
                ? "bg-primary text-primary-foreground shadow-sm dark:bg-white dark:text-black"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            Community
          </button>
          <button
            onClick={() => setPageTab('events')}
            className={cn(
              "flex-1 h-9 rounded-full text-[13px] font-semibold transition-all duration-300 ease-out active:scale-95",
              pageTab === 'events'
                ? "bg-primary text-primary-foreground shadow-sm dark:bg-white dark:text-black"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            Events
          </button>
        </div>

        {/* TAB CONTENT */}
        {pageTab === 'community' && <CommunityTab />}
        {pageTab === 'events' && <EventsTab />}

      </div>
    </div>
  )
}
