"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api, type Post } from "@/lib/api"
import {
  Search,
  ArrowUpRight,
  ChevronRight,
  Loader2,
  User,
  X,
  Heart,
  MessageCircle,
  ImageIcon,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VerifiedBadge } from "@/components/verified-badge"

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function FeedCard({ post, onLikeToggle, onCommentAdded }: {
  post: Post
  onLikeToggle: (postId: string, liked: boolean) => void
  onCommentAdded?: (postId: string) => void
}) {
  const router = useRouter()
  const [liking, setLiking] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commenting, setCommenting] = useState(false)
  const [showCommentSheet, setShowCommentSheet] = useState(false)
  const sheetInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showCommentSheet) setTimeout(() => sheetInputRef.current?.focus(), 50)
  }, [showCommentSheet])

  const handleComment = async (text: string) => {
    if (!text.trim() || commenting) return
    setCommenting(true)
    try {
      await api.addPostComment(post.id, text.trim())
      setCommentText("")
      setShowCommentSheet(false)
      onCommentAdded?.(post.id)
    } catch {
      // keep text on failure
    } finally {
      setCommenting(false)
    }
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (liking) return
    setLiking(true)
    const wasLiked = post.viewer_has_liked
    onLikeToggle(post.id, !wasLiked)
    try {
      await api.togglePostLike(post.id)
    } catch {
      onLikeToggle(post.id, wasLiked)
    } finally {
      setLiking(false)
    }
  }

  return (
    <div className="bg-white rounded-[20px] border border-gray-200/80 overflow-hidden shadow-sm">
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/volunteers/${post.volunteer.user_id}`} onClick={(e) => e.stopPropagation()}>
          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
            {post.volunteer.avatar_url
              ? <img src={post.volunteer.avatar_url} alt={post.volunteer.full_name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">{post.volunteer.full_name?.charAt(0)}</div>
            }
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link href={`/volunteers/${post.volunteer.user_id}`} onClick={(e) => e.stopPropagation()} className="text-[13px] font-semibold text-gray-900 truncate hover:underline">
              {post.volunteer.full_name}
            </Link>
            {post.volunteer.is_verified && <VerifiedBadge />}
          </div>
          <p className="text-[11px] text-gray-500 truncate">at {post.event.title}</p>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(post.created_at)}</span>
      </div>

      {/* Photo */}
      <button
        className="block w-full aspect-square bg-gray-100 overflow-hidden active:opacity-90 transition-opacity"
        onClick={() => router.push(`/posts/${post.id}`)}
      >
        <img src={post.photo_urls[0]} alt="" className="w-full h-full object-cover" />
      </button>

      {/* Actions + caption */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-4 mb-2.5">
          <button
            onClick={handleLike}
            disabled={liking}
            className="flex items-center gap-1.5 active:scale-90 transition-transform disabled:opacity-60"
          >
            <Heart className={cn("w-5 h-5 transition-colors", post.viewer_has_liked ? "fill-red-500 text-red-500" : "text-gray-700")} />
            {post.like_count > 0 && <span className="text-[13px] font-medium text-gray-700">{post.like_count}</span>}
          </button>
          <button
            onClick={() => router.push(`/posts/${post.id}`)}
            className="flex items-center gap-1.5 active:scale-90 transition-transform"
          >
            <MessageCircle className="w-5 h-5 text-gray-700" />
            {post.comment_count > 0 && <span className="text-[13px] font-medium text-gray-700">{post.comment_count}</span>}
          </button>
        </div>

        {post.caption && (
          <p className="text-[13px] text-gray-700 leading-snug line-clamp-3">
            <span className="font-semibold mr-1">{post.volunteer.full_name}</span>
            {post.caption}
          </p>
        )}

        {post.comment_count > 0 && (
          <button onClick={() => router.push(`/posts/${post.id}`)} className="text-[12px] text-gray-400 mt-1 hover:text-gray-600 transition-colors">
            View {post.comment_count === 1 ? "1 comment" : `all ${post.comment_count} comments`}
          </button>
        )}
      </div>

      {/* Comment input row */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {/* Mobile: tappable pill → opens bottom sheet */}
        <button
          className="sm:hidden flex-1 h-8 bg-gray-50 rounded-full px-3.5 text-[12px] text-gray-400 text-left active:bg-gray-100 transition-colors"
          onClick={() => setShowCommentSheet(true)}
        >
          Add a comment...
        </button>

        {/* Desktop: inline input */}
        <input
          className="hidden sm:block flex-1 h-8 bg-gray-50 rounded-full px-3.5 text-[12px] text-[#1d1d1f] placeholder:text-gray-400 outline-none"
          placeholder="Add a comment..."
          value={commentText}
          maxLength={500}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment(commentText)}
        />
        {commentText.trim() && (
          <button
            onClick={() => handleComment(commentText)}
            disabled={commenting}
            className="hidden sm:flex shrink-0 text-[13px] font-semibold text-[#80242a] disabled:opacity-40"
          >
            {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
          </button>
        )}
      </div>

      {/* Comment bottom sheet — mobile only */}
      {showCommentSheet && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setShowCommentSheet(false); setCommentText("") }}
          />
          <div className="relative w-full bg-white rounded-t-2xl px-4 py-3 flex items-center gap-3 shadow-xl">
            <input
              ref={sheetInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment(commentText)}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 h-10 bg-[#f5f5f7] rounded-full px-4 text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none"
            />
            <button
              onClick={() => handleComment(commentText)}
              disabled={!commentText.trim() || commenting}
              className="w-9 h-9 bg-[#80242a] rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
            >
              {commenting
                ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                : <Send className="w-4 h-4 text-white" />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
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

  const isSearching = searchQuery.trim().length > 0

  // Load search history on mount
  useEffect(() => {
    api.getSearchHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  // Load community feed on mount
  useEffect(() => {
    api.getPostsFeed()
      .then((res) => setFeedPosts(res.posts))
      .catch(() => setFeedError(true))
      .finally(() => setFeedLoading(false))
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

  const handleLikeToggle = (postId: string, liked: boolean) => {
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, viewer_has_liked: liked, like_count: liked ? p.like_count + 1 : Math.max(0, p.like_count - 1) }
          : p
      )
    )
  }

  const handleCommentAdded = (postId: string) => {
    setFeedPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)
    )
  }

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

            {/* COMMUNITY FEED */}
            <div className="px-2">
              <h1 className="text-xl font-bold text-[#1d1d1f] tracking-tight mb-4">Community</h1>

              {feedLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-[20px] border border-gray-200/60 overflow-hidden animate-pulse">
                      <div className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-gray-200 rounded w-1/3" />
                          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="aspect-square w-full bg-gray-200" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </div>
                    </div>
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-[14px] font-semibold text-gray-700 mb-1">No posts yet</p>
                  <p className="text-[12px] text-gray-400 max-w-[200px]">Follow volunteers to see their experiences here.</p>
                </div>
              )}

              {!feedLoading && !feedError && feedPosts.length > 0 && (
                <div className="space-y-4">
                  {feedPosts.map((post) => (
                    <FeedCard key={post.id} post={post} onLikeToggle={handleLikeToggle} onCommentAdded={handleCommentAdded} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
