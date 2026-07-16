"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MapPin, Calendar, ChevronLeft, Loader2, Edit2,
  Sparkles, Trophy, Mail, Phone, UserPlus,
  UserMinus, Download, Share2, Linkedin, Instagram, Globe,
  Home, Check, Quote, Building2,
  Image as ImageIcon, Plus, Trash2, LogOut, Lock, Clock, X,
  Camera, Images,
} from "lucide-react"
import { api } from "@/lib/api"
import { cn, formatLabel, formatHours, formatHoursTotal } from "@/lib/utils"
import { VerifiedBadge } from "@/components/verified-badge"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

// --- SUB-COMPONENTS ---

function Testimonials({ journey }: { journey: any[] }) {
  const reviews = journey.filter(j => j.endorsements?.comment);
  if (reviews.length === 0) return null;

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Quote className="w-5 h-5 text-purple-500" /> What Organizations Say
      </h3>
      <div className="grid gap-4">
        {reviews.slice(0, 3).map((review, idx) => (
          <div key={idx} className="bg-purple-50 dark:bg-purple-500/15 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20 relative">
            <Quote className="w-8 h-8 text-purple-200 dark:text-purple-500/30 absolute top-2 right-2 rotate-180" />
            <p className="text-foreground italic text-sm mb-3 relative z-10">"{review.endorsements.comment}"</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-card border border-purple-100 dark:border-purple-500/20 flex items-center justify-center overflow-hidden">
                {review.organization_logo ? <img src={review.organization_logo} className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{review.organization_name}</p>
                <p className="text-[10px] text-muted-foreground">{review.event_title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}


function ActionGallery({ userId, isOwnProfile }: { userId: string, isOwnProfile: boolean }) {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const res = await api.getVolunteerGallery(userId);
        setPhotos(res || []);
      } catch (err) { }
    }
    if (userId) loadGallery();
  }, [userId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const newPhoto = await api.uploadGalleryPhoto(file);
      setPhotos([newPhoto, ...photos]);
    } catch (err) {
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await api.deleteGalleryPhoto(photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (err) { alert("Delete failed"); }
  }

  if (!photos.length && !isOwnProfile) return null;

  return (
    <>
      {/* Lightbox overlay */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-card/10 rounded-full transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-500" /> Action Gallery
          </h3>
          {isOwnProfile && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs flex items-center gap-1 bg-primary text-primary-foreground dark:bg-white dark:text-black px-3 py-1.5 rounded-full hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all duration-300"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add Photo
            </button>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-8 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-dashed border-black/10 dark:border-white/10">
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Share moments from your volunteering drives.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer"
                onClick={() => setLightboxUrl(photo.image_url)}
              >
                <img src={photo.image_url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                      className="p-2 bg-red-500/80 backdrop-blur rounded-full text-white hover:bg-red-600 active:scale-90 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// --- POSTS GRID ---

function PostsGrid({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const router = useRouter()
  const [data, setData] = useState<{ posts: any[]; is_private: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    api.getVolunteerPosts(userId)
      .then(setData)
      .catch(() => setData({ posts: [], is_private: false }))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 md:gap-3 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-xl md:rounded-2xl" />
        ))}
      </div>
    )
  }

  if (data?.is_private) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Lock className="w-7 h-7 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Posts are private</p>
      </Card>
    )
  }

  if (!data?.posts.length) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Camera className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-1">No posts yet</p>
        {isOwnProfile && (
          <Link href="/posts/select-event" className="text-xs text-[#ff6b6b] font-semibold hover:underline">
            Share an experience →
          </Link>
        )}
      </Card>
    )
  }

  return (
    <ScrollReveal className="grid grid-cols-3 gap-2 md:gap-3">
      {isOwnProfile && (
        <Link
          href="/posts/select-event"
          className="col-span-3 flex items-center justify-center gap-2 h-12 mb-1 border border-dashed border-black/10 dark:border-white/10 rounded-xl text-sm text-muted-foreground font-medium bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Share an experience
        </Link>
      )}
      {data.posts.map((post) => (
        <button
          key={post.id}
          onClick={() => router.push(`/posts/${post.id}`)}
          className="aspect-square overflow-hidden bg-muted relative group rounded-xl md:rounded-2xl shadow-md shadow-neutral-200/40 dark:shadow-black/40 hover:shadow-lg hover:scale-[1.03] hover:-translate-y-0.5 transition-all duration-300 ease-out"
        >
          <img
            src={post.photo_urls[0]}
            alt=""
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {post.photo_urls.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1">
              <Images className="w-3 h-3 text-white" />
            </div>
          )}
        </button>
      ))}
    </ScrollReveal>
  )
}

// --- UNFOLLOW CONFIRM SHEET ---

function UnfollowConfirmSheet({ name, onConfirm, onCancel }: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl border-t border-black/5 dark:border-white/10">
        <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 mx-auto mb-5" />
        <p className="text-center text-[15px] font-semibold text-foreground mb-1">Unfollow {name}?</p>
        <p className="text-center text-[13px] text-muted-foreground mb-6">Their posts will no longer appear in your feed.</p>
        <button
          onClick={onConfirm}
          className="w-full py-3 bg-red-500 text-white rounded-2xl text-[15px] font-semibold mb-2.5 hover:bg-red-600 hover:scale-[1.015] active:scale-95 transition-all duration-300"
        >
          Unfollow
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 bg-black/5 dark:bg-white/10 text-foreground rounded-2xl text-[15px] font-semibold hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// --- FOLLOW LIST MODAL ---

function FollowUserButton({ user, onStatusChange }: {
  user: any
  onStatusChange: (userId: string, newStatus: 'none' | 'pending' | 'accepted') => void
}) {
  const [status, setStatus] = useState<'none' | 'pending' | 'accepted'>(
    user.requester_follow_status ?? 'none'
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      if (status === 'none') {
        const res = await api.followUser(user.user_id)
        const next = (res.status as 'pending' | 'accepted') ?? 'accepted'
        setStatus(next)
        onStatusChange(user.user_id, next)
      } else {
        await api.unfollowUser(user.user_id)
        setStatus('none')
        onStatusChange(user.user_id, 'none')
      }
    } catch (err: any) {
      setError(err.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={handle}
        disabled={busy}
        className={cn(
          "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-50",
          status === 'accepted'
            ? "bg-black/5 dark:bg-white/10 text-foreground hover:bg-black/10 dark:hover:bg-white/15"
            : status === 'pending'
              ? "bg-black/5 dark:bg-white/10 text-muted-foreground cursor-pointer"
              : "bg-primary text-primary-foreground dark:bg-white dark:text-black hover:opacity-90"
        )}
      >
        {status === 'accepted' ? 'Following' : status === 'pending' ? 'Requested' : 'Follow'}
      </button>
      {error && <p className="text-[10px] text-red-500 max-w-[80px] text-right leading-tight">{error}</p>}
    </div>
  )
}

function FollowListModal({ type, initialUsers, onClose, isOwnProfilePage, currentUserId }: {
  type: 'followers' | 'following' | null
  initialUsers: any[]
  onClose: () => void
  isOwnProfilePage: boolean
  currentUserId: string | null
}) {
  const [users, setUsers] = useState(initialUsers ?? [])
  const [removeError, setRemoveError] = useState<string | null>(null)

  if (!type) return null
  const title = type === 'followers' ? 'Followers' : 'Following'

  const handleRemove = async (followerId: string) => {
    try {
      await api.removeFollower(followerId)
      setUsers(prev => prev.filter(u => u.user_id !== followerId))
    } catch (err: any) {
      setRemoveError(err.message || 'Failed to remove')
      setTimeout(() => setRemoveError(null), 3000)
    }
  }

  const handleStatusChange = (userId: string, newStatus: 'none' | 'pending' | 'accepted') => {
    setUsers(prev => prev.map(u =>
      u.user_id === userId ? { ...u, requester_follow_status: newStatus } : u
    ))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-black/5 dark:border-white/10 max-h-[72vh] flex flex-col overflow-hidden">
        {/* Handle pill */}
        <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 mx-auto mt-3 shrink-0 sm:hidden" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10 shrink-0">
          <h3 className="font-semibold text-[15px] text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {removeError && (
          <p className="text-xs text-red-600 px-5 py-2 bg-red-50 dark:bg-red-500/15 border-b border-red-100">{removeError}</p>
        )}
        <div className="overflow-y-auto flex-1">
          {users.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground text-sm">No {title.toLowerCase()} yet.</div>
          ) : (
            users.map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted transition-colors">
                <Link
                  href={u.entity_type === 'org' ? `/organizations/${u.profile_id}` : `/volunteers/${u.user_id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                    {u.avatar_url
                      ? <img src={u.avatar_url} className="w-full h-full object-cover" alt={u.full_name} />
                      : <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-sm">{u.full_name?.charAt(0)}</div>
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-foreground truncate">{u.full_name}</p>
                      {u.is_verified && <VerifiedBadge />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.city || u.headline || 'Volunteer'}</p>
                  </div>
                </Link>

                {/* Action button — never show for the viewer's own entry */}
                {u.user_id !== currentUserId && (
                  isOwnProfilePage && type === 'followers' ? (
                    <button
                      onClick={() => handleRemove(u.user_id)}
                      className="px-3.5 py-1.5 bg-muted text-foreground text-xs font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-600 active:scale-95 transition-all shrink-0"
                    >
                      Remove
                    </button>
                  ) : (
                    <div className="shrink-0">
                      <FollowUserButton user={u} onStatusChange={handleStatusChange} />
                    </div>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---

export default function VolunteerProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [journey, setJourney] = useState<any[]>([])
  const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [followModal, setFollowModal] = useState<{ type: 'followers' | 'following' | null; users: any[] }>({ type: null, users: [] })
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false)
  const [activityData, setActivityData] = useState<any[]>([])
  const [isViewerOrg, setIsViewerOrg] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [coverError, setCoverError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)
  const [activeProfileTab, setActiveProfileTab] = useState<'posts' | 'about'>('posts')

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true)

        // "me" is a stable self-profile alias the nav links to, so the profile
        // link never depends on an async-loaded id (which made clicks no-op
        // until getUserProfile resolved). Resolve it to the current user here.
        const currentUser = await api.getCurrentUser().catch(() => null)
        const effectiveId = id === 'me' ? currentUser?.id : (id as string)

        if (!effectiveId) {
          if (isMounted) { setLoading(false); router.replace('/login') }
          return
        }

        const [profileRes, journeyRes] = await Promise.all([
          api.getVolunteerPublicProfile(effectiveId),
          api.getVolunteerJourney(effectiveId),
        ])

        if (!isMounted) return;

        const fetchedProfile = profileRes.profile;
        setJourney(journeyRes.journey || [])

        const isSelf = id === 'me' || currentUser?.id === fetchedProfile.user_id;
        setIsOwnProfile(isSelf);
        if (currentUser?.id) setCurrentUserId(currentUser.id);

        if (isSelf) {
          try {
            const ownProfile = await api.getUserProfile();
            if (ownProfile?.profile) {
              const p = ownProfile.profile;
              if (p.email) fetchedProfile.email = p.email;
              if (p.phone) fetchedProfile.phone = p.phone;
              if (p.address) fetchedProfile.address = p.address;
            }
          } catch (e) { }
        }
        setProfile(fetchedProfile)
        setActivityData(fetchedProfile.activity_graph || [])

        // ✅ UNCOMMENTED: Hides the follow button for organizations perfectly
        if (currentUser?.user_metadata?.user_type === 'organization') {
          setIsViewerOrg(true); 
        }

        setFollowStatus(fetchedProfile.follow_status ?? 'none')

      } catch (err) {
        console.error("Profile fetch error:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProfile()

    return () => { isMounted = false; }
  }, [id])

  const showError = (msg: string) => {
    setErrorToast(msg)
    setTimeout(() => setErrorToast(null), 3000)
  }

  const handleFollow = async () => {
    if (!profile?.user_id || followLoading) return
    if (followStatus === 'accepted') {
      setShowUnfollowConfirm(true)
      return
    }
    setFollowLoading(true)
    try {
      if (followStatus === 'pending') {
        await api.unfollowUser(profile.user_id)
        setFollowStatus('none')
      } else {
        const res = await api.followUser(profile.user_id)
        const newStatus = (res.status as 'pending' | 'accepted') ?? 'accepted'
        setFollowStatus(newStatus)
        if (newStatus === 'accepted') {
          setProfile((prev: any) => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }))
        }
      }
    } catch (err: any) {
      showError(err.message || 'Something went wrong')
    } finally {
      setFollowLoading(false)
    }
  }

  const executeUnfollow = async () => {
    setShowUnfollowConfirm(false)
    try {
      await api.unfollowUser(profile.user_id)
      setFollowStatus('none')
      setProfile((prev: any) => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }))
    } catch (err: any) {
      showError(err.message || 'Failed to unfollow')
    }
  }

  const handleOpenFollowList = async (type: 'followers' | 'following') => {
    if (profile?.is_private && !isOwnProfile && followStatus !== 'accepted') return
    try {
      if (type === 'followers') {
        const res = await api.getFollowers(profile.user_id)
        if (res.error === 'forbidden') return
        if (res.error) { showError('Could not load followers'); return }
        setFollowModal({ type, users: res.followers ?? [] })
      } else {
        const res = await api.getFollowing(profile.user_id)
        if (res.error === 'forbidden') return
        if (res.error) { showError('Could not load following'); return }
        setFollowModal({ type, users: res.following ?? [] })
      }
    } catch {
      showError('Could not load list')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Volunteer Profile',
          text: `Check out ${profile.full_name}'s impact on Kindly!`,
          url: window.location.href
        })
      } catch (err) { }
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      try {
        if (api.logout) await api.logout();
        else {
          localStorage.removeItem('supabase.auth.token'); 
          localStorage.clear();
        }
      } catch (err) {
        console.error("Logout error", err);
      } finally {
        router.push('/'); 
      }
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getExternalLink = (url: string) => {
    if (!url) return "#";
    return url.startsWith('http') ? url : `https://${url}`;
  }

  if (loading) return <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-foreground animate-spin" /></div>
  if (!profile) return <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center text-muted-foreground">Profile not found</div>

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-20 font-sans relative overflow-x-hidden">
      {/* Ambient top glow — centered, not off to either side */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[420px] bg-gradient-to-b from-indigo-200/20 dark:from-indigo-500/[0.14] to-transparent blur-3xl z-0" />

      {/* 1. TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 rounded-full transition-all relative"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
            </button>

            {isOwnProfile ? (
              <>
                <Link href="/settings/profile" className="px-4 py-2 bg-primary text-primary-foreground dark:bg-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 active:scale-90 rounded-full transition-all ml-1"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              !isViewerOrg && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 shadow-sm hover:scale-[1.03] active:scale-95 flex items-center gap-2 disabled:opacity-60",
                    followStatus === 'accepted'
                      ? "bg-black/5 dark:bg-white/5 text-foreground border border-black/10 dark:border-white/10 hover:border-red-300 hover:text-red-600"
                      : followStatus === 'pending'
                        ? "bg-black/5 dark:bg-white/5 text-muted-foreground border border-black/10 dark:border-white/10 cursor-pointer"
                        : "bg-primary text-primary-foreground dark:bg-white dark:text-black hover:opacity-90"
                  )}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : followStatus === 'accepted' ? (
                    <><UserMinus className="w-4 h-4" /> Following</>
                  ) : followStatus === 'pending' ? (
                    <><Clock className="w-4 h-4" /> Requested</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      {/* 2. COVER IMAGE */}
      <div className="h-48 md:h-64 w-full relative overflow-hidden group z-0">
        {!coverError && profile?.cover_url ? (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={() => setCoverError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-indigo-950 to-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl -top-10 -right-10" />
            <Sparkles className="w-12 h-12 text-white/15 relative" />
          </div>
        )}
        {/* Gradient scrim — centered wash, not a side blob. Sits on top of
            whichever of the two cases above renders (a real photo is fully
            opaque and would otherwise hide any gradient behind it entirely). */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* 3. LEFT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <Card className="p-6 relative">
              <div className="w-32 h-32 rounded-full border-4 border-neutral-50 dark:border-black shadow-md overflow-hidden bg-muted -mt-20 mb-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">{profile?.full_name?.charAt(0)}</div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{profile?.full_name}</h1>
                  {profile?.is_verified && <VerifiedBadge size="lg" />}
                </div>
                <p className="text-muted-foreground font-medium">{profile?.headline || "Volunteer"}</p>
                {profile?.city && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <MapPin className="w-4 h-4" /> {profile.city}
                  </div>
                )}
                {!isOwnProfile && profile?.mutual_followers?.count > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-2 shrink-0">
                      {profile.mutual_followers.preview.map((u: any, i: number) => (
                        <div
                          key={u.user_id}
                          className="w-6 h-6 rounded-full border-2 border-neutral-50 dark:border-neutral-900 bg-muted overflow-hidden"
                          style={{ zIndex: profile.mutual_followers.preview.length - i }}
                        >
                          {u.avatar_url
                            ? <img src={u.avatar_url} className="w-full h-full object-cover" alt={u.full_name} />
                            : <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-muted-foreground bg-muted">{u.full_name?.charAt(0)}</div>
                          }
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {profile.mutual_followers.count === 1 ? (
                        <>Followed by <span className="font-semibold text-foreground">{profile.mutual_followers.preview[0]?.full_name?.split(' ')[0]}</span></>
                      ) : profile.mutual_followers.count === 2 ? (
                        <>Followed by <span className="font-semibold text-foreground">{profile.mutual_followers.preview[0]?.full_name?.split(' ')[0]}</span> and <span className="font-semibold text-foreground">{profile.mutual_followers.preview[1]?.full_name?.split(' ')[0]}</span></>
                      ) : (
                        <>Followed by <span className="font-semibold text-foreground">{profile.mutual_followers.preview[0]?.full_name?.split(' ')[0]}</span>, <span className="font-semibold text-foreground">{profile.mutual_followers.preview[1]?.full_name?.split(' ')[0]}</span> and <span className="font-semibold text-foreground">{profile.mutual_followers.count - 2} others</span></>
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-b border-black/5 dark:border-white/10 py-4 mb-6">
                <button
                  onClick={() => handleOpenFollowList('followers')}
                  className="text-center hover:opacity-70 active:scale-95 transition-all disabled:opacity-100 disabled:cursor-default disabled:active:scale-100"
                  disabled={profile?.is_private && !isOwnProfile && followStatus !== 'accepted'}
                >
                  <span className="block font-bold text-foreground text-lg">{profile?.followers_count || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Followers</span>
                </button>
                <button
                  onClick={() => handleOpenFollowList('following')}
                  className="text-center border-l border-black/5 dark:border-white/10 hover:opacity-70 active:scale-95 transition-all disabled:opacity-100 disabled:cursor-default disabled:active:scale-100"
                  disabled={profile?.is_private && !isOwnProfile && followStatus !== 'accepted'}
                >
                  <span className="block font-bold text-foreground text-lg">{profile?.following_count || 0}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Following</span>
                </button>
                <div className="text-center border-l border-black/5 dark:border-white/10">
                  <span className="block font-bold text-foreground text-lg">{formatHoursTotal(profile?.total_hours)}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Hours</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2 justify-center lg:justify-start">
                {profile?.linkedin && <a href={getExternalLink(profile.linkedin)} target="_blank" className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-blue-600 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"><Linkedin className="w-5 h-5" /></a>}
                {profile?.instagram && <a href={getExternalLink(profile.instagram)} target="_blank" className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-pink-600 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"><Instagram className="w-5 h-5" /></a>}
                {profile?.website && <a href={getExternalLink(profile.website)} target="_blank" className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground hover:scale-110 active:scale-95 transition-all duration-300"><Globe className="w-5 h-5" /></a>}
              </div>
            </Card>

            {/* CONTACT DETAILS */}
            {(isOwnProfile || profile?.view_type === 'private' || profile?.view_type === 'resume') && (
              <Card className="p-6 relative overflow-hidden">
                {/* Centered gradient wash — not a side blob */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] dark:from-blue-500/[0.12] to-transparent pointer-events-none" />
                <div className="relative">
                  <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide">Contact Details</h3>
                  <div className="space-y-3">
                    {/* ✅ UPDATED: Safe optional chaining here */}
                    {profile?.email ? (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/15 p-2 rounded">
                        <span>Email not added.</span>
                        {isOwnProfile && <Link href="/settings/profile" className="underline font-semibold">Add now</Link>}
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.address && (
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Home className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span>{profile.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <Card className="p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary">{formatLabel(skill)}</Badge>
                  ))}
                </div>
              </Card>
            )}

          </div>

          {/* 4. MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-6 lg:pt-20">
            {profile?.is_private && !isOwnProfile && followStatus !== 'accepted' ? (
              /* Privacy Lock */
              <Card className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-[15px] font-semibold text-foreground mb-1">This account is private</p>
                <p className="text-[13px] text-muted-foreground max-w-xs">
                  {followStatus === 'pending'
                    ? 'Follow request sent. Waiting for approval.'
                    : 'Follow them to see their activity.'
                  }
                </p>
              </Card>
            ) : (
              <>
                {/* Tab bar */}
                <div className="flex gap-1 p-1 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-full shadow-sm">
                  {(['posts', 'about'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveProfileTab(tab)}
                      className={cn(
                        "flex-1 h-9 rounded-full text-[13px] font-semibold capitalize transition-all duration-300 ease-out active:scale-95",
                        activeProfileTab === tab
                          ? "bg-primary text-primary-foreground dark:bg-white dark:text-black shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeProfileTab === 'posts' ? (
                  <PostsGrid userId={profile?.user_id} isOwnProfile={isOwnProfile} />
                ) : (
                <>
                <ScrollReveal>
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-foreground">About</h3>
                    {profile?.created_at && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Member since {new Date(profile.created_at).getFullYear()}</span>}
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{profile?.bio || "No bio added yet."}</p>
                </Card>
                </ScrollReveal>

                {/* Impact & Graph — bento: hero score cell + supporting chart cell */}
                <ScrollReveal delay={0.05} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-neutral-900 via-indigo-950 to-black rounded-2xl p-6 text-white shadow-xl relative overflow-hidden hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out">
                    <div className="absolute w-40 h-40 rounded-full bg-indigo-500/25 blur-3xl -top-8 -right-8 pointer-events-none" />
                    <Trophy className="w-24 h-24 absolute top-0 right-0 p-4 opacity-10" />
                    <h3 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-1 relative">Impact Score</h3>
                    <div className="text-4xl font-bold mb-4 relative">{profile?.impact_score || 0}</div>
                    <div className="flex gap-4 relative">
                      <div><span className="text-xs text-white/60 block">Reliability</span><span className="font-semibold text-emerald-400">{profile?.reliability_score || 100}%</span></div>
                      <div><span className="text-xs text-white/60 block">Rank</span><span className="font-semibold text-amber-400">{profile?.total_hours > 50 ? 'Gold' : profile?.total_hours > 10 ? 'Silver' : 'Bronze'}</span></div>
                    </div>
                  </div>

                  <Card className="p-6">
                    <h3 className="text-sm font-bold text-foreground mb-4">Monthly Activity (Hours)</h3>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData}>
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                              borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              backgroundColor: 'var(--card)', color: 'var(--foreground)',
                            }}
                          />
                          <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={20}>
                            {activityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.hours > 0 ? '#ff6b6b' : 'var(--muted)'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </ScrollReveal>

                {/* Action Gallery */}
                <ScrollReveal>
                  <ActionGallery userId={profile?.user_id} isOwnProfile={isOwnProfile} />
                </ScrollReveal>

                {/* Testimonials */}
                <ScrollReveal delay={0.05}>
                  <Testimonials journey={journey} />
                </ScrollReveal>

                {/* Certificates */}
                {profile?.badges && profile.badges.length > 0 && (
                  <ScrollReveal delay={0.1}>
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">Certificates & Badges</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {profile.badges.map((badge: string, idx: number) => (
                        <div key={idx} className="min-w-[140px] p-4 rounded-xl border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/15 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform duration-300">
                          <div className="w-12 h-12 bg-card rounded-full shadow-sm flex items-center justify-center mb-3">
                            <Trophy className="w-6 h-6 text-amber-500" />
                          </div>
                          <h4 className="font-bold text-foreground text-sm">{badge}</h4>
                          <p className="text-xs text-muted-foreground mt-1">Earned via Activity</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  </ScrollReveal>
                )}

                {/* Journey */}
                <ScrollReveal delay={0.15}>
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-6">Volunteering History</h3>
                  {journey.length === 0 ? (
                    <div className="text-center py-10"><Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">No history yet.</p></div>
                  ) : (
                    <div className="space-y-8 relative pl-2">
                      <div className="absolute top-2 left-[27px] h-full w-0.5 bg-black/10 dark:bg-white/10 -z-10" />
                      {journey.map((item, idx) => (
                        <Link
                          key={idx}
                          href={item.event_id ? `/events/${item.event_id}/showcase` : '#'}
                          className="flex gap-4 relative group"
                        >
                          <div className="w-14 shrink-0 flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-card border-2 border-blue-500 z-10 shadow-[0_0_0_4px_var(--card)] mb-2" />
                            <span className="text-xs font-semibold text-muted-foreground">{formatDate(item.event_date).split(',')[0]}</span>
                          </div>
                          <div className="flex-1 bg-white/50 dark:bg-white/[0.03] border border-black/5 dark:border-white/10 rounded-xl p-4 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0">
                                  {item.organization_logo ? <img src={item.organization_logo} className="w-full h-full object-cover rounded-lg" /> : <Building2 className="w-5 h-5 text-muted-foreground" />}
                                </div>
                                <div>
                                  <h4 className="font-bold text-foreground text-sm md:text-base">{item.event_title}</h4>
                                  <p className="text-xs text-muted-foreground">{item.organization_name}</p>
                                </div>
                              </div>
                              <span className={cn("px-2 py-1 border rounded text-xs font-medium whitespace-nowrap", item.hours_contributed > 0 ? "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20" : "bg-black/5 dark:bg-white/5 text-muted-foreground border-black/10 dark:border-white/10")}>{formatHours(item.hours_contributed)}</span>
                            </div>
                            {item.endorsements?.comment && (
                              <div className="mt-3 bg-blue-50 dark:bg-blue-500/15 p-3 rounded-lg border border-blue-100 dark:border-blue-500/20">
                                <p className="text-sm text-foreground italic">"{item.endorsements.comment}"</p>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
                </ScrollReveal>
              </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Followers / Following Modal — conditionally rendered so useState re-initialises on each open */}
      {followModal.type && (
        <FollowListModal
          type={followModal.type}
          initialUsers={followModal.users}
          isOwnProfilePage={isOwnProfile}
          currentUserId={currentUserId}
          onClose={() => setFollowModal({ type: null, users: [] })}
        />
      )}

      {/* Unfollow Confirmation Sheet */}
      {showUnfollowConfirm && (
        <UnfollowConfirmSheet
          name={profile?.full_name ?? 'this user'}
          onConfirm={executeUnfollow}
          onCancel={() => setShowUnfollowConfirm(false)}
        />
      )}

      {/* Error toast */}
      {errorToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-primary text-primary-foreground text-sm px-4 py-2.5 rounded-full shadow-lg pointer-events-none">
          {errorToast}
        </div>
      )}
    </div>
  )
}