"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  ArrowUpRight,
  ChevronRight,
  Loader2,
  Clock,
  User,
  RefreshCw,
  ExternalLink,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { VerifiedBadge } from "@/components/verified-badge"

// --- CATEGORY IMAGE MAP ---
const CATEGORY_IMAGES: Record<string, string[]> = {
  Environment: [
    "https://images.unsplash.com/photo-1618477461853-5f8dd68aa1fd?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60"
  ],
  Community: [
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1528301721190-186c3bd85418?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60"
  ],
  Education: [
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=60",
  ],
  Health: [
    "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=60"
  ],
  "Elderly Care": [
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=800&auto=format&fit=crop&q=60"
  ],
  Animals: [
    "https://images.unsplash.com/photo-1551730459-92db2a308d6a?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=60"
  ],
}

const getImageForStory = (title: string, category: string) => {
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Community"]
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return images[Math.abs(hash) % images.length]
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

  const [stories, setStories] = useState<any[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)

  const isSearching = searchQuery.trim().length > 0

  // Load search history on mount
  useEffect(() => {
    api.getSearchHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  // Debounced live search
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

  const loadStories = () => {
    setStoriesLoading(true)
    fetch("/api/social-stories")
      .then((r) => r.json())
      .then((d) => setStories(d.stories || []))
      .catch(() => setStories([]))
      .finally(() => setStoriesLoading(false))
  }

  useEffect(() => { loadStories() }, [])

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

  const displayedResults = results.filter(item => {
    if (activeTab === 'all') return true
    if (activeTab === 'volunteers') return item.type === 'volunteer'
    if (activeTab === 'orgs') return item.type === 'org'
    return true
  })

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      Environment:    "bg-emerald-100 text-emerald-700",
      Community:      "bg-blue-100 text-blue-700",
      Education:      "bg-orange-100 text-orange-700",
      Health:         "bg-red-100 text-red-700",
      "Elderly Care": "bg-purple-100 text-purple-700",
      Animals:        "bg-amber-100 text-amber-700",
    }
    return map[category] || "bg-gray-100 text-gray-700"
  }

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

        {/* LOADING */}
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

        {/* DEFAULT: HISTORY + FEED */}
        {!isSearching && !loading && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* RECENT SEARCHES */}
            {!historyLoading && history.length > 0 && (
              <div className="px-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent</h3>
                  <button
                    onClick={clearHistory}
                    className="text-[11px] text-[#0066cc] font-semibold hover:underline"
                  >
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

            {/* DISCOVER IMPACT FEED */}
            <div className="flex items-center justify-between px-2">
              <div>
                <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight">Discover Impact</h1>
                {!storiesLoading && (
                  <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                    Live news
                  </p>
                )}
              </div>
              <button
                onClick={loadStories}
                disabled={storiesLoading}
                title="Refresh"
                className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center active:scale-95 hover:bg-gray-50 transition-all disabled:opacity-40"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-gray-500", storiesLoading && "animate-spin")} />
              </button>
            </div>

            {storiesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-[24px] border border-gray-200/60 overflow-hidden animate-pulse">
                    <div className="aspect-video w-full bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-5 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-2/3 mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!storiesLoading && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                  {stories.map((story, idx) => (
                    <div
                      key={idx}
                      className="group flex flex-col h-full bg-white rounded-[24px] border border-gray-200/80 overflow-hidden shadow-sm active:scale-[0.98] transition-all duration-200"
                    >
                      <div className="aspect-video w-full overflow-hidden relative bg-gray-100">
                        <img
                          src={getImageForStory(story.title, story.category)}
                          alt={story.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                        <span className={cn(
                          "absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md",
                          getCategoryColor(story.category)
                        )}>
                          {story.category}
                        </span>
                        <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] font-bold bg-black/50 text-white backdrop-blur-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          LIVE
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400 mb-2">
                          <span className="truncate max-w-[130px] text-[#1d1d1f]">{story.author}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                          <span className="shrink-0">{story.date}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#0066cc] transition-colors line-clamp-2">
                          {story.title}
                        </h3>
                        <p className="text-[13px] text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          {story.excerpt}
                        </p>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {story.readTime}
                          </div>
                          {story.url ? (
                            <a
                              href={story.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 px-3 bg-[#f5f5f7] hover:bg-gray-200 rounded-full text-[11px] font-bold text-[#1d1d1f] flex items-center gap-1 transition-colors"
                            >
                              Read <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="h-8 px-3 bg-[#f5f5f7] rounded-full text-[11px] font-bold text-[#1d1d1f] flex items-center gap-1">
                              Read <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="py-4 text-center">
                  <button
                    onClick={loadStories}
                    disabled={storiesLoading}
                    className="text-[13px] font-medium text-gray-500 active:text-black flex items-center gap-2 mx-auto disabled:opacity-40"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Load fresh stories
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
