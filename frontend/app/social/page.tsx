"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Search,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Clock,
  User,
  Menu,
  X,
  Sparkles,
  Calendar,
  BarChart3,
  Users,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"

// --- CATEGORY IMAGE MAP (Expanded for Variety) ---
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

// Deterministic helper to pick an image based on the article title
const getImageForStory = (title: string, category: string) => {
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Community"]
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % images.length
  return images[index]
}

export default function SocialDiscoveryPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<'all' | 'volunteers' | 'orgs'>('all')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // News feed state
  const [stories, setStories] = useState<any[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)

  // Navbar & User State
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userType, setUserType] = useState<'volunteer' | 'org' | null>(null)

  // --- INITIALIZATION & AUTH CHECK ---
  useEffect(() => {
    const initializePage = async () => {
      // 1. Authenticate with Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      // 2. Redirect to login if unauthorized
      if (!user || authError) {
        router.push('/login')
        return // Stop execution, preventing unauthenticated API calls
      }

      // 3. If authenticated, fetch User Profile
      try {
        const res = await api.getUserProfile()
        if (res?.profile) {
          setProfile(res.profile)
          if ('org_type' in res.profile) {
            setUserType('org')
          } else {
            setUserType('volunteer')
          }
        }
      } catch (e) {
        console.error("Failed to fetch profile", e)
      }

      // 4. Finally, trigger the stories to load
      loadStories()
    }

    initializePage()
  }, [router])

  // --- FETCH REAL STORIES ---
  const loadStories = () => {
    setStoriesLoading(true)
    fetch("/api/social-stories")
      .then((r) => r.json())
      .then((d) => setStories(d.stories || []))
      .catch(() => setStories([]))
      .finally(() => setStoriesLoading(false))
  }

  useEffect(() => {
    loadStories()
  }, [])

  // --- SEARCH HANDLER ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setLoading(true)
    setResults([])
    try {
      const data = await api.globalSearch(searchQuery)
      setResults(data)
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.getUserProfile()
        if (res?.profile) {
          setProfile(res.profile)
          if ('org_type' in res.profile) {
            setUserType('org')
          } else {
            setUserType('volunteer')
          }
        }
      } catch (e) {
        console.error("Failed to fetch profile", e)
      }
    }
    fetchUser()
  }, [])

  const displayImage = profile?.avatar_url || profile?.logo_url
  const displayName = profile?.full_name || profile?.name || "User"
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U"

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

  const isActive = (path: string) =>
    pathname === path ? "text-[#0066cc] font-medium" : "text-[#1d1d1f] hover:text-[#0066cc]"

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">


      {/* =========================================================
          MAIN CONTENT AREA (Mobile Optimized)
         ========================================================= */}
      <div className="max-w-2xl mx-auto px-2 sm:px-4 pt-4 pb-24">

        {/* SEARCH BAR */}
        <div className="mb-6 px-2">
          <form onSubmit={handleSearch} className="relative group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              placeholder="Search volunteers, orgs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value === '') { setIsSearching(false); setResults([]) }
              }}
              className="w-full h-11 md:h-12 pl-11 pr-4 bg-white border border-gray-200 shadow-sm rounded-2xl md:rounded-full text-[14px] md:text-[15px] outline-none focus:border-gray-400 focus:shadow-md transition-all placeholder:text-gray-400"
            />
          </form>

          {isSearching && (
            <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-top-2 ml-2">
              {['all', 'volunteers', 'orgs'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[11px] md:text-xs font-semibold capitalize transition-all",
                    activeTab === tab ? "bg-black text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {tab === 'orgs' ? 'Organizations' : tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LOADING STATE (search) */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Searching community...</p>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {!loading && isSearching && displayedResults.length > 0 && (
          <div className="space-y-2 px-2">
            <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Top Results</h3>
            <div className="bg-white rounded-[20px] border border-gray-200 overflow-hidden shadow-sm">
              {displayedResults.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.type === 'volunteer' ? `/volunteers/${item.id}` : `/organizations/${item.id}`}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-semibold text-gray-900 truncate text-[14px] md:text-[15px]">{item.name}</h4>
                      {item.verified && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />}
                    </div>
                    <p className="text-[11px] md:text-xs text-gray-500 truncate">{item.subtitle}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* NO RESULTS STATE */}
        {!loading && isSearching && displayedResults.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-[13px] md:text-sm">No results found for "{searchQuery}"</p>
          </div>
        )}

        {/* DEFAULT FEED: REAL IMPACT STORIES */}
        {!isSearching && !loading && (
          <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between px-2 md:px-1">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#1d1d1f] tracking-tight">Discover Impact</h1>
                {!storiesLoading && (
                  <p className="text-[11px] md:text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                    Live news
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden md:inline-block text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <button
                  onClick={loadStories}
                  disabled={storiesLoading}
                  title="Refresh stories"
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center active:scale-95 hover:bg-gray-50 transition-all disabled:opacity-40"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500", storiesLoading && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* SKELETON LOADING (Updated aspect ratios) */}
            {storiesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-[24px] border border-gray-200/60 overflow-hidden animate-pulse">
                    <div className="aspect-video md:aspect-[4/3] w-full bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-5 bg-gray-200 rounded w-full" />
                      <div className="h-5 bg-gray-200 rounded w-4/5" />
                      <div className="h-3 bg-gray-100 rounded w-2/3 mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STORIES GRID */}
            {!storiesLoading && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {stories.map((story, idx) => (
                    <div
                      key={idx}
                      className="group flex flex-col h-full bg-white rounded-[24px] border border-gray-200/80 overflow-hidden shadow-sm active:scale-[0.98] transition-all duration-200"
                    >
                      {/* Card Image */}
                      <div className="aspect-video md:aspect-[4/3] w-full overflow-hidden relative bg-gray-100">
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

                      {/* Card Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-medium text-gray-400 mb-2">
                          <span className="truncate max-w-[130px] text-[#1d1d1f]">{story.author}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                          <span className="shrink-0">{story.date}</span>
                        </div>

                        <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#0066cc] transition-colors line-clamp-2">
                          {story.title}
                        </h3>

                        <p className="text-[13px] md:text-sm text-gray-600 line-clamp-2 md:line-clamp-3 mb-4 leading-relaxed">
                          {story.excerpt}
                        </p>

                        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                          <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-gray-500 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {story.readTime}
                          </div>
                          {story.url ? (
                            <a
                              href={story.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 px-3 bg-[#f5f5f7] hover:bg-gray-200 rounded-full text-[11px] md:text-xs font-bold text-[#1d1d1f] flex items-center gap-1 transition-colors"
                            >
                              Read <ExternalLink className="w-3 h-3 md:hidden" /> <span className="hidden md:inline">Story</span>
                            </a>
                          ) : (
                            <span className="h-8 px-3 bg-[#f5f5f7] rounded-full text-[11px] md:text-xs font-bold text-[#1d1d1f] flex items-center gap-1">
                              Read <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="py-6 text-center">
                  <button
                    onClick={loadStories}
                    disabled={storiesLoading}
                    className="text-[13px] font-medium text-gray-500 active:text-black transition-colors flex items-center gap-2 mx-auto disabled:opacity-40"
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