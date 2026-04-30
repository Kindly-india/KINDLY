"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VerifiedBadge } from "@/components/verified-badge"

type Suggestion = {
  user_id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  is_verified: boolean
  total_hours: number
}

export default function SocialDiscoveryPage() {
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
    api.getSearchHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => {
    api.getPostsFeed()
      .then((res) => setFeedPosts(res.posts))
      .catch(() => setFeedError(true))
      .finally(() => setFeedLoading(false))
  }, [])

  useEffect(() => {
    api.getSuggestedPeople()
      .then((res) => setSuggestions(res.suggestions))
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false))
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await api.globalSearch(searchQuery)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
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
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      <div className="max-w-2xl mx-auto px-2 sm:px-4 pt-4 pb-24">

        {/* SEARCH BAR */}
        <div className="mb-4 px-2">
          <div className="relative group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search volunteers, orgs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-10 bg-white border border-gray-200 shadow-sm rounded-2xl text-[14px] outline-none focus:border-gray-400 focus:shadow-md transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
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
                    "px-4 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all",
                    activeTab === tab ? "bg-black text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
          <div className="py-16 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Searching...</p>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {!loading && isSearching && displayedResults.length > 0 && (
          <div className="space-y-2 px-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Results</h3>
            <div className="bg-white rounded-[20px] border border-gray-200 overflow-hidden shadow-sm">
              {displayedResults.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.type === 'volunteer' ? `/volunteers/${item.id}` : `/organizations/${item.id}`}
                  onClick={() => handleResultClick(item)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                    {item.image
                      ? <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      : <User className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="font-semibold text-gray-900 truncate text-[14px]">{item.name}</h4>
                      {item.verified && <VerifiedBadge />}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* NO RESULTS */}
        {!loading && isSearching && displayedResults.length === 0 && (
          <div className="text-center py-12 text-gray-500">
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
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent</h3>
                  <button onClick={clearHistory} className="text-[11px] text-[#0066cc] font-semibold hover:underline">
                    Clear All
                  </button>
                </div>
                <div className="bg-white rounded-[20px] border border-gray-200 overflow-hidden shadow-sm">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 group">
                      <Link
                        href={item.result_type === 'volunteer' ? `/volunteers/${item.result_id}` : `/organizations/${item.result_id}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                          {item.result_image
                            ? <img src={item.result_image} className="w-full h-full object-cover" alt={item.result_name} />
                            : <User className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.result_name}</p>
                          <p className="text-[11px] text-gray-500 capitalize">{item.result_type}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeHistoryItem(item.id)}
                        className="p-1.5 rounded-full hover:bg-gray-200 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PEOPLE YOU MIGHT KNOW */}
            {(suggestionsLoading || suggestions.length > 0) && (
              <div>
                <h2 className="text-[16px] font-semibold text-[#1d1d1f] mb-3 px-2">People you might know</h2>
                <div
                  className="flex gap-[10px] overflow-x-auto pb-1 px-5"
                  style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {suggestionsLoading
                    ? [1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="shrink-0 w-[140px] h-48 rounded-2xl bg-white shadow-sm animate-pulse flex flex-col"
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          <div className="flex flex-col items-center px-3 pt-4 gap-2 flex-1">
                            <div className="w-14 h-14 rounded-full bg-gray-200" />
                            <div className="w-20 h-3 rounded-full bg-gray-200" />
                            <div className="w-14 h-2.5 rounded-full bg-gray-100" />
                            <div className="w-12 h-2.5 rounded-full bg-gray-100" />
                          </div>
                          <div className="px-3 pb-4 mt-auto">
                            <div className="w-full h-8 rounded-full bg-gray-200" />
                          </div>
                        </div>
                      ))
                    : suggestions.map((s) => {
                        const isFollowing = followingMap[s.user_id] ?? false
                        return (
                          <div
                            key={s.user_id}
                            className="shrink-0 w-[140px] h-48 rounded-2xl bg-white shadow-sm flex flex-col"
                            style={{ scrollSnapAlign: 'start' }}
                          >
                            <Link href={`/volunteers/${s.user_id}`} className="flex flex-col items-center px-3 pt-4 gap-1.5 flex-1 min-h-0">
                              <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center">
                                {s.avatar_url
                                  ? <img src={s.avatar_url} className="w-full h-full object-cover" alt={s.full_name} />
                                  : <User className="w-6 h-6 text-gray-400" />
                                }
                              </div>
                              <div className="w-full text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <p className="text-[13px] font-semibold text-[#1d1d1f] leading-tight line-clamp-2 text-center">{s.full_name}</p>
                                  {s.is_verified && <VerifiedBadge />}
                                </div>
                                {s.city && (
                                  <p className="text-[11px] text-[#86868b] mt-0.5 truncate">{s.city}</p>
                                )}
                                {s.total_hours > 0 && (
                                  <p className="text-[11px] font-medium text-[#80242a] mt-0.5">{s.total_hours}h volunteered</p>
                                )}
                              </div>
                            </Link>
                            <div className="px-3 pb-4 mt-auto">
                              <button
                                onClick={() => !isFollowing && handleFollow(s.user_id)}
                                className={cn(
                                  "w-full h-8 rounded-full text-[12px] font-semibold transition-all",
                                  isFollowing
                                    ? "bg-[#80242a] text-white"
                                    : "border border-[#80242a] text-[#80242a] hover:bg-[#80242a]/5"
                                )}
                              >
                                {isFollowing ? "Following" : "Follow"}
                              </button>
                            </div>
                          </div>
                        )
                      })
                  }
                </div>
              </div>
            )}

            {/* COMMUNITY GRID */}
            <div className="px-2">
              <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight mb-4">Community</h1>

              {feedLoading && (
                <div className="grid grid-cols-3 gap-px bg-black rounded-xl overflow-hidden">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
                  ))}
                </div>
              )}

              {!feedLoading && feedError && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-[14px] font-semibold text-gray-700 mb-1">Couldn't load posts</p>
                  <p className="text-[12px] text-gray-400">Follow volunteers to see their posts here.</p>
                </div>
              )}

              {!feedLoading && !feedError && feedPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-[13px] text-[#86868b]">Follow people to see their posts here.</p>
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
                        className="aspect-square overflow-hidden bg-gray-100 relative"
                        onClick={() => router.push(`/posts/${post.id}`)}
                      >
                        <img
                          src={post.photo_urls[0]}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement
                            img.style.display = 'none'
                            const parent = img.parentElement
                            if (parent) parent.style.background = '#f3f4f6'
                          }}
                        />
                        {post.photo_urls.length > 1 && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 rounded-sm flex items-center justify-center">
                            <ChevronRight className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
