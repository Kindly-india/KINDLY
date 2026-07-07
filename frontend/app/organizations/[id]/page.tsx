"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MapPin, ChevronLeft, Loader2, Edit2,
  Mail, Phone, UserPlus, UserMinus,
  Share2, Linkedin, Instagram, Globe,
  Check, Quote, Building2, Users, CalendarDays,
  Hash, FileBadge, Users2, Trophy, LogOut,
  Image as ImageIcon, Plus, Trash2, X,
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { VerifiedBadge } from "@/components/verified-badge"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

function Achievements({ items }: { items: any[] }) {
  if (!items || items.length === 0) return null;
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Wall of Fame
        </h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-[300px] bg-white/50 dark:bg-white/[0.03] border border-black/5 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-md hover:scale-[1.015] transition-all duration-300 group cursor-pointer">
            <div className="h-40 w-full bg-muted relative overflow-hidden flex items-center justify-center">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : <Trophy className="w-10 h-10 text-muted-foreground" />}
            </div>
            <div className="p-4">
              <h4 className="font-bold text-foreground text-sm mb-1 line-clamp-1">{item.title}</h4>
              <p className="text-[10px] text-[#ff6b6b] font-semibold mb-2">{item.date}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function OurTeam({ members }: { members: any[] }) {
  if (!members || members.length === 0) return null;
  return (
    <Card className="p-6 mb-6">
      <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <Users2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Key People
      </h3>
      <div className="grid gap-4">
        {members.map((member, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-muted-foreground text-xs font-bold uppercase">{member.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Reviews({ reviews }: { reviews: any[] }) {
  if (!reviews || reviews.length === 0) return null;
  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Quote className="w-5 h-5 text-purple-500" /> What Volunteers Say
      </h3>
      <div className="grid gap-4">
        {reviews.slice(0, 3).map((review, idx) => (
          <div key={idx} className="bg-purple-50 dark:bg-purple-500/15 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20 relative">
            <Quote className="w-8 h-8 text-purple-200 dark:text-purple-500/30 absolute top-2 right-2 rotate-180" />
            <p className="text-foreground italic text-sm mb-3 relative z-10">"{review.comment}"</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-card border border-purple-100 dark:border-purple-500/20 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-400">
                {review.volunteer_name?.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{review.volunteer_name}</p>
                <p className="text-[10px] text-muted-foreground">{review.event_title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function OrgDetails({ profile }: { profile: any }) {
  return (
    <Card className="p-6 mb-6">
      <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide">Organization Details</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shrink-0"><Building2 className="w-4 h-4" /></div>
          <div><p className="text-xs font-bold text-foreground">Type</p><p className="text-sm text-muted-foreground capitalize">{profile.org_type || "Registered Organization"}</p></div>
        </div>
        {profile.registration_number && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shrink-0"><Hash className="w-4 h-4" /></div>
            <div><p className="text-xs font-bold text-foreground">Registration No.</p><p className="text-sm text-muted-foreground">{profile.registration_number}</p></div>
          </div>
        )}
        {profile.years_active && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shrink-0"><FileBadge className="w-4 h-4" /></div>
            <div><p className="text-xs font-bold text-foreground">Years Active</p><p className="text-sm text-muted-foreground">{profile.years_active} Years</p></div>
          </div>
        )}
        {profile.representative_name && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shrink-0"><Users2 className="w-4 h-4" /></div>
            <div><p className="text-xs font-bold text-foreground">Rep. Name</p><p className="text-sm text-muted-foreground">{profile.representative_name}</p>{profile.designation && <p className="text-xs text-muted-foreground">{profile.designation}</p>}</div>
          </div>
        )}
      </div>
    </Card>
  )
}

function OrgGallery({ orgId, isOwnProfile }: { orgId: string; isOwnProfile: boolean }) {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!orgId) return
    api.getOrgGallery(orgId).then(setPhotos).catch(() => {})
  }, [orgId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploading(true)
    try {
      const newPhoto = await api.uploadOrgGalleryPhoto(e.target.files[0])
      setPhotos(prev => [newPhoto, ...prev])
    } catch {
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return
    try {
      await api.deleteOrgGalleryPhoto(photoId)
      setPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch {
      alert('Delete failed')
    }
  }

  if (!photos.length && !isOwnProfile) return null

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

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-500" /> Action Gallery
          </h3>
          {isOwnProfile && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs flex items-center gap-1 bg-primary text-primary-foreground dark:bg-white dark:text-black px-3 py-1.5 rounded-full hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all duration-300"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add Photo
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
            </>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-8 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-dashed border-black/10 dark:border-white/10">
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Share moments from your events and drives.</p>
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
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo.id) }}
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

export default function OrganizationProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isViewerOrg, setIsViewerOrg] = useState(false)
  const [activityData, setActivityData] = useState<any[]>([])
  const [coverError, setCoverError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)

        // "me" is a stable self-profile alias the org nav links to, so the link
        // never depends on an async-loaded id. Resolve it to the current user
        // (the backend accepts either the org profile id or the user_id).
        const currentUser = await api.getCurrentUser().catch(() => null)
        const effectiveId = id === 'me' ? currentUser?.id : (id as string)

        if (!effectiveId) {
          setLoading(false)
          router.replace('/login')
          return
        }

        const [profileRes, eventsRes, reviewsRes] = await Promise.all([
          api.getOrgPublicProfile(effectiveId),
          api.getOrgEvents(effectiveId),
          api.getOrgReviews(effectiveId),
        ])

        setProfile(profileRes.profile)
        setEvents(eventsRes.events || [])
        setReviews(reviewsRes.reviews || [])

        // Graph Logic
        const last6Months = Array(6).fill(0).map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return { name: d.toLocaleString('default', { month: 'short' }), monthIdx: d.getMonth(), events: 0 };
        });
        (eventsRes.events || []).forEach((ev: any) => {
          const bucket = last6Months.find(m => m.monthIdx === new Date(ev.event_date).getMonth());
          if (bucket) bucket.events += 1;
        });
        setActivityData(last6Months);

        // Permissions Logic
        const isSelf = id === 'me' || currentUser?.id === profileRes.profile.user_id;
        setIsOwnProfile(isSelf);
        setIsFollowing(profileRes.profile.is_followed_by_current_user ?? false)
        if (currentUser?.user_metadata?.user_type === 'organization') {
          setIsViewerOrg(true);
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  // --- CALCULATE AVERAGE RATING ---
  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return "N/A";
    const total = reviews.reduce((sum, review) => {
      const score = Number(review.rating);
      return sum + (isNaN(score) ? 0 : score);
    }, 0);
    const avg = total / reviews.length;
    if (isNaN(avg)) return "N/A";
    return avg.toFixed(1);
  }, [reviews]);

  // --- HANDLERS (Follow, Share, Logout) ---
  const handleFollow = async () => {
    if (!profile?.user_id) return
    try {
      if (isFollowing) {
        await api.unfollowUser(profile.user_id)
        setIsFollowing(false)
        setProfile((prev: any) => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }))
      } else {
        await api.followUser(profile.user_id)
        setIsFollowing(true)
        setProfile((prev: any) => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }))
      }
    } catch (err: any) { alert(err.message) }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: profile.name, url: window.location.href }).catch(() => { })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ✅ Added Logout Handler
  const handleLogout = async () => {
    try {
      if (api.logout) await api.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
      router.push("/login");
    }
  };

  const displayedEvents = isOwnProfile
    ? events
    : events.filter(ev => ev.status === 'completed');

  if (loading) return <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-foreground animate-spin" /></div>
  if (!profile) return <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center text-muted-foreground">Organization not found</div>

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
            <button onClick={handleShare} className="p-2 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 rounded-full transition-all">
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
            </button>
            {isOwnProfile ? (
              <>
                <Link href="/settings/profile" className="px-4 py-2 bg-primary text-primary-foreground dark:bg-white dark:text-black text-sm font-medium rounded-full hover:opacity-90 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Page
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 active:scale-90 rounded-full transition-all ml-1"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : !isViewerOrg && (
              <button
                onClick={handleFollow}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 shadow-sm hover:scale-[1.03] active:scale-95 flex items-center gap-2",
                  isFollowing
                    ? "bg-black/5 dark:bg-white/5 text-foreground border border-black/10 dark:border-white/10 hover:border-red-300 hover:text-red-600"
                    : "bg-primary text-primary-foreground dark:bg-white dark:text-black hover:opacity-90"
                )}
              >
                {isFollowing ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. COVER IMAGE */}
      <div className="h-48 md:h-64 w-full relative overflow-hidden group z-0">
        {!coverError && profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" onError={() => setCoverError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-indigo-950 to-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl -top-10 -right-10" />
            <Building2 className="w-12 h-12 text-white/15 relative" />
          </div>
        )}
        {/* Gradient scrim — sits on top of whichever case above renders */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT SIDEBAR (Profile Card + Details) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 relative">
              <div className="w-32 h-32 rounded-full border-4 border-neutral-50 dark:border-black shadow-md overflow-hidden bg-muted -mt-20 mb-4">
                {profile.logo_url ? <img src={profile.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">{profile.name?.charAt(0)}</div>}
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground leading-tight">{profile.name}</h1>
                  {profile.is_verified && <VerifiedBadge size="lg" />}
                </div>
                <p className="text-muted-foreground font-medium">{profile.tagline || "Making a difference."}</p>
                {profile.area_locality && <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2"><MapPin className="w-4 h-4" /> {profile.area_locality}</div>}
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-b border-black/5 dark:border-white/10 py-4 mb-6">
                <div className="text-center"><span className="block font-bold text-foreground text-lg">{profile.followers_count || 0}</span><span className="text-xs text-muted-foreground uppercase tracking-wide">Followers</span></div>
                <div className="text-center border-l border-black/5 dark:border-white/10"><span className="block font-bold text-foreground text-lg">{events.length}</span><span className="text-xs text-muted-foreground uppercase tracking-wide">Events</span></div>
                <div className="text-center border-l border-black/5 dark:border-white/10">
                  <span className="block font-bold text-foreground text-lg">{averageRating}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Rating</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2 justify-center lg:justify-start">
                {profile.linkedin && <a href={profile.linkedin} target="_blank" className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-blue-600 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"><Linkedin className="w-5 h-5" /></a>}
                {profile.instagram && <a href={profile.instagram} target="_blank" className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-pink-600 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300"><Instagram className="w-5 h-5" /></a>}
                {profile.website && <a href={profile.website} target="_blank" className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground hover:scale-110 active:scale-95 transition-all duration-300"><Globe className="w-5 h-5" /></a>}
              </div>
            </Card>

            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] dark:from-blue-500/[0.12] to-transparent pointer-events-none" />
              <div className="relative">
                <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide">Contact Details</h3>
                <div className="space-y-3">
                  {profile.email && <div className="flex items-center gap-3 text-sm text-muted-foreground"><Mail className="w-4 h-4 text-muted-foreground" /><span className="truncate">{profile.email}</span></div>}
                  {profile.phone && <div className="flex items-center gap-3 text-sm text-muted-foreground"><Phone className="w-4 h-4 text-muted-foreground" /><span>{profile.phone}</span></div>}
                  {profile.website && <div className="flex items-start gap-3 text-sm text-muted-foreground"><Globe className="w-4 h-4 text-muted-foreground mt-0.5" /><a href={profile.website} target="_blank" className="hover:underline truncate">{profile.website}</a></div>}
                </div>
              </div>
            </Card>

            <OurTeam members={profile.team_members} />
            <OrgDetails profile={profile} />
          </div>

          {/* MAIN CONTENT (Events, Stats, Etc) */}
          <div className="lg:col-span-8 space-y-6">
            <ScrollReveal>
              <OrgGallery orgId={profile.id} isOwnProfile={isOwnProfile} />
            </ScrollReveal>

            <ScrollReveal>
              <Card className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{profile.mission_statement || "No mission statement added yet."}</p>
                {profile.intent_description && <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10"><h4 className="text-sm font-bold text-foreground mb-2">About Us</h4><p className="text-muted-foreground text-sm">{profile.intent_description}</p></div>}
              </Card>
            </ScrollReveal>

            {/* Impact & Frequency — bento: hero score cell + supporting chart cell */}
            <ScrollReveal delay={0.05} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-neutral-900 via-indigo-950 to-black rounded-2xl p-6 text-white shadow-xl relative overflow-hidden hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out">
                <div className="absolute w-40 h-40 rounded-full bg-indigo-500/25 blur-3xl -top-8 -right-8 pointer-events-none" />
                <Trophy className="w-24 h-24 absolute top-0 right-0 p-4 opacity-10" />
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wide mb-1 relative">Total Impact</h3>
                <div className="text-4xl font-bold mb-4 relative">{profile.total_hours_generated || 0} Hrs</div>
                <div className="flex gap-4 relative">
                  <div><span className="text-xs text-white/60 block">Events</span><span className="font-semibold text-emerald-400">{profile.events_hosted || events.length} Hosted</span></div>
                  <div><span className="text-xs text-white/60 block">Volunteers</span><span className="font-semibold text-amber-400">{profile.volunteers_engaged || 0} Engaged</span></div>
                </div>
              </div>
              <Card className="p-6">
                <h3 className="text-sm font-bold text-foreground mb-4">Events Frequency</h3>
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
                        itemStyle={{ color: 'var(--card-foreground)' }}
                        labelStyle={{ color: 'var(--muted-foreground)' }}
                      />
                      <Bar dataKey="events" radius={[4, 4, 0, 0]} barSize={20}>
                        {activityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.events > 0 ? '#ff6b6b' : 'var(--muted)'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <Achievements items={profile.achievements} />
            </ScrollReveal>
            <ScrollReveal delay={0.05}>
              <Reviews reviews={reviews} />
            </ScrollReveal>

            {/* EVENTS SECTION */}
            <ScrollReveal delay={0.15}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">
                    {isOwnProfile ? 'Events' : 'Past Events'}
                  </h3>
                  {isOwnProfile && <Link href="/org-events/create" className="text-sm text-[#ff6b6b] hover:underline font-medium">Create New +</Link>}
                </div>

                {displayedEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No past events yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedEvents.map((event, idx) => {
                      const isCompleted = event.status === 'completed';
                      // Org owners: completed events → org report page, active events → org management page
                      // All other visitors: past completed events → volunteer showcase/report page
                      const linkHref = isOwnProfile
                        ? (isCompleted ? `/org-events/${event.id}/report` : `/org-events/${event.id}`)
                        : `/events/${event.id}/showcase`;

                      return (
                        <Link key={idx} href={linkHref} className="block group">
                          <div className="flex gap-4 p-4 border border-black/5 dark:border-white/10 rounded-xl hover:border-[#ff6b6b]/30 hover:shadow-md transition-all bg-white/50 dark:bg-white/[0.03] relative">
                            <div className="w-14 shrink-0 flex flex-col items-center justify-center bg-muted rounded-lg border border-black/5 dark:border-white/10 h-14">
                              <span className="text-xs font-bold text-[#ff6b6b] uppercase">
                                {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                              </span>
                              <span className="text-xl font-bold text-foreground">
                                {new Date(event.event_date).getDate()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pr-20">
                              <h4 className="font-bold text-foreground truncate group-hover:text-[#ff6b6b] transition-colors">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {isOwnProfile
                                    ? `${event.registered_count || 0} Registered`
                                    : `${event.checked_in_count || 0} Attended`}
                                </span>
                              </div>
                            </div>
                            <div className={cn(
                              "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium capitalize",
                              isCompleted ? "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400" : "bg-black/5 dark:bg-white/10 text-muted-foreground"
                            )}>
                              {event.status || "Draft"}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  )
}