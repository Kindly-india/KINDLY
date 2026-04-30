"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Heart, MessageCircle, Loader2, Trash2, ChevronLeft, ChevronRight, User } from "lucide-react"
import { api, type Post, type PostComment } from "@/lib/api"
import { cn } from "@/lib/utils"
import { VerifiedBadge } from "@/components/verified-badge"

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function Avatar({ src, name, size = 9 }: { src: string | null; name: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gray-100 overflow-hidden shrink-0`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-sm">
            {name?.charAt(0)?.toUpperCase()}
          </div>
      }
    </div>
  )
}

function PhotoCarousel({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0)

  if (urls.length === 1) {
    return (
      <div className="aspect-square bg-black w-full">
        <img src={urls[0]} alt="" className="w-full h-full object-contain" />
      </div>
    )
  }

  return (
    <div className="relative aspect-square bg-black w-full overflow-hidden">
      <img src={urls[idx]} alt="" className="w-full h-full object-contain" />

      {idx > 0 && (
        <button
          onClick={() => setIdx((i) => i - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {idx < urls.length - 1 && (
        <button
          onClick={() => setIdx((i) => i + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {urls.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={cn("w-1.5 h-1.5 rounded-full transition-all", i === idx ? "bg-white" : "bg-white/50")}
          />
        ))}
      </div>
    </div>
  )
}

export default function PostDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const postId = id as string
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [post, setPost] = useState<(Post & { comments: PostComment[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [liking, setLiking] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commenting, setCommenting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [longPressedCommentId, setLongPressedCommentId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    api.getCurrentUser().then((u: any) => setCurrentUserId(u?.id ?? null)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!postId) return
    api.getPost(postId)
      .then(setPost)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [postId])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleLike = async () => {
    if (!post || liking) return
    setLiking(true)
    const wasLiked = post.viewer_has_liked
    setPost((p) => p ? {
      ...p,
      viewer_has_liked: !wasLiked,
      like_count: wasLiked ? Math.max(0, p.like_count - 1) : p.like_count + 1,
    } : p)
    try {
      await api.togglePostLike(postId)
    } catch {
      setPost((p) => p ? {
        ...p,
        viewer_has_liked: wasLiked,
        like_count: wasLiked ? p.like_count + 1 : Math.max(0, p.like_count - 1),
      } : p)
    } finally {
      setLiking(false)
    }
  }

  const handleComment = async () => {
    if (!commentText.trim() || commenting) return
    setCommenting(true)
    const text = commentText.trim()
    setCommentText("")
    try {
      const newComment = await api.addPostComment(postId, text)
      setPost((p) => p ? { ...p, comments: [...p.comments, newComment], comment_count: p.comment_count + 1 } : p)
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch {
      setCommentText(text)
    } finally {
      setCommenting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return
    setDeleting(true)
    try {
      await api.deletePost(postId)
      window.location.href = '/social'
    } catch {
      setDeleting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!post || deletingCommentId) return
    setLongPressedCommentId(null)
    const removed = post.comments.find((c) => c.id === commentId)
    // Optimistic remove
    setPost((p) => p ? {
      ...p,
      comments: p.comments.filter((c) => c.id !== commentId),
      comment_count: Math.max(0, p.comment_count - 1),
    } : p)
    setDeletingCommentId(commentId)
    try {
      await api.deletePostComment(postId, commentId)
    } catch {
      // Restore on failure
      if (removed) {
        setPost((p) => p ? {
          ...p,
          comments: [...p.comments, removed].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ),
          comment_count: p.comment_count + 1,
        } : p)
      }
      showToast("Failed to delete comment")
    } finally {
      setDeletingCommentId(null)
    }
  }

  const startLongPress = (commentId: string) => {
    longPressTimer.current = setTimeout(() => setLongPressedCommentId(commentId), 600)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500 text-sm">Post not found.</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600 font-semibold">Go back</button>
      </div>
    )
  }

  const isOwnPost = currentUserId === post.volunteer.user_id

  return (
    <div className="min-h-screen bg-white pb-36 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#f5f5f7]">
        <div className="h-14 flex items-center px-3 gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-[#1d1d1f]" />
          </button>
          <span className="text-[17px] font-semibold text-[#1d1d1f] flex-1">Post</span>
          {isOwnPost && (
            <button onClick={handleDelete} disabled={deleting} className="p-2 rounded-full hover:bg-red-50 text-red-500 disabled:opacity-50">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/volunteers/${post.volunteer.user_id}`}>
          <Avatar src={post.volunteer.avatar_url} name={post.volunteer.full_name} size={10} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link href={`/volunteers/${post.volunteer.user_id}`} className="text-[14px] font-semibold text-[#1d1d1f] hover:underline truncate">
              {post.volunteer.full_name}
            </Link>
            {post.volunteer.is_verified && <VerifiedBadge />}
          </div>
          <p className="text-[12px] text-[#86868b] truncate">
            at {post.event.title} · {timeAgo(post.created_at)}
          </p>
        </div>
      </div>

      {/* Photos */}
      <PhotoCarousel urls={post.photo_urls} />

      {/* Actions */}
      <div className="flex items-center gap-5 px-4 pt-3 pb-2">
        <button onClick={handleLike} disabled={liking} className="flex items-center gap-1.5 active:scale-90 transition-transform disabled:opacity-60">
          <Heart className={cn("w-6 h-6 transition-colors", post.viewer_has_liked ? "fill-red-500 text-red-500" : "text-[#1d1d1f]")} />
          {post.like_count > 0 && <span className="text-[13px] font-semibold text-[#1d1d1f]">{post.like_count}</span>}
        </button>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-6 h-6 text-[#1d1d1f]" />
          {post.comment_count > 0 && <span className="text-[13px] font-semibold text-[#1d1d1f]">{post.comment_count}</span>}
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-[14px] text-[#1d1d1f] leading-snug">
            <span className="font-semibold mr-1">{post.volunteer.full_name}</span>
            {post.caption}
          </p>
        </div>
      )}

      {/* Comments */}
      <div className="border-t border-[#f5f5f7]">
        {post.comments.length === 0 ? (
          <p className="text-center text-[13px] text-[#86868b] py-6">No comments yet. Be the first!</p>
        ) : (
          <ul className="divide-y divide-[#f5f5f7]">
            {post.comments.map((c) => {
              const canDelete = c.volunteer.user_id === currentUserId || isOwnPost
              return (
                <li
                  key={c.id}
                  className={cn(
                    "relative flex items-start gap-3 px-4 py-3 group transition-opacity",
                    deletingCommentId === c.id && "opacity-40 pointer-events-none"
                  )}
                  onTouchStart={() => canDelete && startLongPress(c.id)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                >
                  <Link href={`/volunteers/${c.volunteer.user_id}`}>
                    <Avatar src={c.volunteer.avatar_url} name={c.volunteer.full_name} size={8} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#1d1d1f] leading-snug">
                      <span className="font-semibold mr-1">{c.volunteer.full_name}</span>
                      {c.content}
                    </p>
                    <p className="text-[11px] text-[#86868b] mt-0.5">{timeAgo(c.created_at)}</p>
                  </div>

                  {/* Desktop: hover trash icon */}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 shrink-0 self-center"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Mobile: long-press confirmation overlay */}
                  {longPressedCommentId === c.id && (
                    <div className="sm:hidden absolute inset-0 bg-white/95 flex items-center justify-between px-4 z-10 rounded-lg">
                      <p className="text-[13px] text-[#1d1d1f] font-medium">Delete this comment?</p>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setLongPressedCommentId(null)}
                          className="px-3 py-1.5 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="px-3 py-1.5 text-[12px] font-semibold text-white bg-red-500 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment input — fixed at bottom, above mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 px-4 pt-3 max-w-lg mx-auto" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <textarea
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 72) + "px"
            }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleComment())}
            placeholder="Add a comment..."
            maxLength={500}
            rows={1}
            className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm text-[#1d1d1f] placeholder:text-gray-400 outline-none resize-none overflow-hidden leading-5"
            style={{ maxHeight: '72px' }}
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim() || commenting}
            className="text-[#80242a] font-semibold text-sm disabled:opacity-40 shrink-0"
          >
            {commenting ? <Loader2 className="w-4 h-4 animate-spin text-[#80242a]" /> : "Post"}
          </button>
        </div>
      </div>

      {/* Error toast */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-[13px] px-4 py-2 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
