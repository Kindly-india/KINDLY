"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
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
    <div className={`w-${size} h-${size} rounded-full bg-muted overflow-hidden shrink-0`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold text-sm">
            {name?.charAt(0)?.toUpperCase()}
          </div>
      }
    </div>
  )
}

// Full-bleed hero — photo runs edge-to-edge behind the floating header/author
// overlays rendered by the page itself. Nav arrows + progress dots are the
// only chrome this component owns.
function PhotoCarousel({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0)

  return (
    <div className="relative w-full h-[58vh] min-h-[400px] max-h-[600px] bg-black overflow-hidden">
      <img src={urls[idx]} alt="" className="w-full h-full object-contain" />

      {urls.length > 1 && (
        <>
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 active:scale-90 transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {idx < urls.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 active:scale-90 transition-all duration-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={cn("h-1.5 rounded-full transition-all duration-300", i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70")}
              />
            ))}
          </div>
        </>
      )}
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
      <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">Post not found.</p>
        <button onClick={() => router.back()} className="text-sm text-[#ff6b6b] font-semibold hover:underline active:scale-95 transition-all">Go back</button>
      </div>
    )
  }

  const isOwnPost = currentUserId === post.volunteer.user_id

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      <div className="max-w-lg mx-auto relative pb-32">

        {/* HERO — photo runs full-bleed with floating glass controls on top */}
        <div className="relative">
          <PhotoCarousel urls={post.photo_urls} />

          {/* Floating header, safe-area aware */}
          <div
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 active:scale-90 transition-all duration-300"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            {isOwnPost && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500/70 active:scale-90 transition-all duration-300 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Bottom scrim + floating author pill */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none z-10" />
          <Link href={`/volunteers/${post.volunteer.user_id}`} className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2.5 group">
            <div className="ring-2 ring-white/70 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-105">
              <Avatar src={post.volunteer.avatar_url} name={post.volunteer.full_name} size={9} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-semibold text-white truncate">{post.volunteer.full_name}</span>
                {post.volunteer.is_verified && <VerifiedBadge />}
              </div>
              <p className="text-[12px] text-white/80 truncate">
                at {post.event.title} · {timeAgo(post.created_at)}
              </p>
            </div>
          </Link>
        </div>

        {/* CONTENT SHEET — floats up over the hero for a native "peeking sheet" feel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative -mt-5 rounded-t-[28px] bg-neutral-50 dark:bg-black shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-9 h-1 rounded-full bg-black/10 dark:bg-white/15" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5 px-4 pt-2 pb-2">
            <button onClick={handleLike} disabled={liking} className="flex items-center gap-1.5 hover:scale-110 active:scale-90 transition-transform duration-200 disabled:opacity-60">
              <Heart className={cn("w-6 h-6 transition-colors", post.viewer_has_liked ? "fill-red-500 text-red-500" : "text-foreground")} />
              {post.like_count > 0 && <span className="text-[13px] font-semibold text-foreground">{post.like_count}</span>}
            </button>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-6 h-6 text-foreground" />
              {post.comment_count > 0 && <span className="text-[13px] font-semibold text-foreground">{post.comment_count}</span>}
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <div className="px-4 pb-3">
              <p className="text-[14px] text-foreground leading-snug">
                <span className="font-semibold mr-1">{post.volunteer.full_name}</span>
                {post.caption}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-black/5 dark:border-white/5">
            {post.comments.length === 0 ? (
              <p className="text-center text-[13px] text-muted-foreground py-6">No comments yet. Be the first!</p>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/5">
                {post.comments.map((c) => {
                  const canDelete = c.volunteer.user_id === currentUserId || isOwnPost
                  return (
                    <li
                      key={c.id}
                      className={cn(
                        "relative flex items-start gap-3 px-4 py-3 group transition-opacity hover:bg-black/[0.02] dark:hover:bg-white/[0.03]",
                        deletingCommentId === c.id && "opacity-40 pointer-events-none"
                      )}
                      onTouchStart={() => canDelete && startLongPress(c.id)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                    >
                      <Link href={`/volunteers/${c.volunteer.user_id}`} className="shrink-0 transition-transform duration-300 hover:scale-105">
                        <Avatar src={c.volunteer.avatar_url} name={c.volunteer.full_name} size={8} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-foreground leading-snug">
                          <span className="font-semibold mr-1">{c.volunteer.full_name}</span>
                          {c.content}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(c.created_at)}</p>
                      </div>

                      {/* Desktop: hover trash icon */}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/15 text-red-400 hover:text-red-600 active:scale-90 shrink-0 self-center"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Mobile: long-press confirmation overlay */}
                      {longPressedCommentId === c.id && (
                        <div className="sm:hidden absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl flex items-center justify-between px-4 z-10 rounded-lg animate-in fade-in duration-200">
                          <p className="text-[13px] text-foreground font-medium">Delete this comment?</p>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => setLongPressedCommentId(null)}
                              className="px-3 py-1.5 text-[12px] font-semibold text-muted-foreground bg-black/5 dark:bg-white/10 rounded-lg active:scale-95 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="px-3 py-1.5 text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg active:scale-95 transition-all"
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
        </motion.div>
      </div>

      {/* Comment input — floating rounded pill, inset from the screen edges.
          Global chrome is hidden on this route (see navbar-manager.tsx) so
          it can safely own the bottom of the screen. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] max-w-lg mx-auto px-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))', paddingTop: '0.75rem' }}
      >
        <div className="flex items-center gap-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full shadow-lg shadow-black/10 dark:shadow-black/50 pl-1.5 pr-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-muted shrink-0 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
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
            className="flex-1 bg-transparent px-1 py-1 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none overflow-hidden leading-5"
            style={{ maxHeight: '72px' }}
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim() || commenting}
            className="text-[#ff6b6b] font-semibold text-sm disabled:opacity-40 shrink-0 active:scale-90 transition-transform pr-1"
          >
            {commenting ? <Loader2 className="w-4 h-4 animate-spin text-[#ff6b6b]" /> : "Post"}
          </button>
        </div>
      </div>

      {/* Error toast */}
      {toastMsg && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[70] bg-primary text-primary-foreground text-[13px] px-4 py-2 rounded-full shadow-lg pointer-events-none whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
