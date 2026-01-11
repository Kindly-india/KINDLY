"use client"

import { useState, useEffect, useMemo } from "react" // ✅ Added useMemo
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MapPin, ChevronLeft, Loader2, CheckCircle2, Edit2,
  Mail, Phone, UserPlus, UserMinus,
  Share2, Linkedin, Instagram, Globe,
  Check, Quote, Building2, Users, CalendarDays,
  Hash, FileBadge, Users2, Trophy
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

// ... [Keep Achievements, OurTeam, Reviews, and OrgDetails components exactly the same] ...

function Achievements({ items }: { items: any[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Wall of Fame
        </h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-[300px] bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all group cursor-pointer">
            <div className="h-40 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : <Trophy className="w-10 h-10 text-gray-300" />}
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{item.title}</h4>
              <p className="text-[10px] text-blue-600 font-semibold mb-2">{item.date}</p>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OurTeam({ members }: { members: any[] }) {
  if (!members || members.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
        <Users2 className="w-4 h-4 text-blue-600" /> Key People
      </h3>
      <div className="grid gap-4">
        {members.map((member, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-gray-500 text-xs font-bold uppercase">{member.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{member.name}</p>
              <p className="text-xs text-gray-500">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Reviews({ reviews }: { reviews: any[] }) {
  if (!reviews || reviews.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Quote className="w-5 h-5 text-purple-500" /> What Volunteers Say
      </h3>
      <div className="grid gap-4">
        {reviews.slice(0, 3).map((review, idx) => (
          <div key={idx} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 relative">
            <Quote className="w-8 h-8 text-purple-200 absolute top-2 right-2 rotate-180" />
            <p className="text-gray-700 italic text-sm mb-3 relative z-10">"{review.comment}"</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-purple-100 flex items-center justify-center font-bold text-xs text-purple-600">
                {review.volunteer_name?.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{review.volunteer_name}</p>
                <p className="text-[10px] text-gray-500">{review.event_title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrgDetails({ profile }: { profile: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Organization Details</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0"><Building2 className="w-4 h-4" /></div>
          <div><p className="text-xs font-bold text-gray-900">Type</p><p className="text-sm text-gray-600 capitalize">{profile.org_type || "Registered Organization"}</p></div>
        </div>
        {profile.registration_number && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0"><Hash className="w-4 h-4" /></div>
            <div><p className="text-xs font-bold text-gray-900">Registration No.</p><p className="text-sm text-gray-600">{profile.registration_number}</p></div>
          </div>
        )}
        {profile.years_active && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0"><FileBadge className="w-4 h-4" /></div>
            <div><p className="text-xs font-bold text-gray-900">Years Active</p><p className="text-sm text-gray-600">{profile.years_active} Years</p></div>
          </div>
        )}
        {profile.representative_name && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0"><Users2 className="w-4 h-4" /></div>
            <div><p className="text-xs font-bold text-gray-900">Rep. Name</p><p className="text-sm text-gray-600">{profile.representative_name}</p>{profile.designation && <p className="text-xs text-gray-400">{profile.designation}</p>}</div>
          </div>
        )}
      </div>
    </div>
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
  const [activityData, setActivityData] = useState<any[]>([])
  const [coverError, setCoverError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const [profileRes, eventsRes, reviewsRes, currentUser] = await Promise.all([
          api.getOrgPublicProfile(id as string),
          api.getOrgEvents(id as string),
          api.getOrgReviews(id as string),
          api.getCurrentUser().catch(() => null)
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
        const isSelf = currentUser?.id === profileRes.profile.user_id;
        setIsOwnProfile(isSelf);

        if (!isSelf && currentUser && profileRes.profile?.user_id) {
          try {
            const followRes = await api.getFollowStatus(profileRes.profile.user_id)
            setIsFollowing(followRes.isFollowing)
          } catch (err) { }
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
    // 1. Check if reviews exist
    if (!reviews || reviews.length === 0) return "N/A";

    // 2. Calculate Sum (Ensure rating is treated as a number)
    const total = reviews.reduce((sum, review) => {
      const score = Number(review.rating); // Force conversion to Number
      return sum + (isNaN(score) ? 0 : score);
    }, 0);

    // 3. Calculate Average
    const avg = total / reviews.length;

    // 4. Return formatted (e.g., "4.5" or "5.0")
    // If NaN (e.g. all ratings were invalid), return N/A
    if (isNaN(avg)) return "N/A";

    return avg.toFixed(1);
  }, [reviews]);

  // --- HANDLERS (Follow, Share) ---
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

  const displayedEvents = isOwnProfile
    ? events
    : events.filter(ev => ev.status === 'completed');

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 text-gray-900 animate-spin" /></div>
  if (!profile) return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Organization not found</div>

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">

      {/* 1. TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
            </button>
            {isOwnProfile ? (
              <Link href="/settings/profile" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Page
              </Link>
            ) : (
              <button onClick={handleFollow} className={cn("px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2", isFollowing ? "bg-white text-red-600 border border-red-200" : "bg-black text-white")}>
                {isFollowing ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. COVER IMAGE */}
      <div className="h-48 md:h-64 bg-gray-200 w-full relative overflow-hidden">
        {!coverError && profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" onError={() => setCoverError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center"><Building2 className="w-12 h-12 text-white/10" /></div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT SIDEBAR (Profile Card + Details) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 -mt-20 mb-4">
                {profile.logo_url ? <img src={profile.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">{profile.name?.charAt(0)}</div>}
              </div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1 flex items-center gap-2">{profile.name} <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" /></h1>
                <p className="text-gray-600 font-medium">{profile.tagline || "Making a difference."}</p>
                {profile.area_locality && <div className="flex items-center gap-1 text-sm text-gray-500 mt-2"><MapPin className="w-4 h-4" /> {profile.area_locality}</div>}
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-4 mb-6">
                <div className="text-center"><span className="block font-bold text-gray-900 text-lg">{profile.followers_count || 0}</span><span className="text-xs text-gray-500 uppercase">Followers</span></div>
                <div className="text-center border-l border-gray-100"><span className="block font-bold text-gray-900 text-lg">{events.length}</span><span className="text-xs text-gray-500 uppercase">Events</span></div>

                {/* ✅ UPDATED RATING DISPLAY */}
                <div className="text-center border-l border-gray-100">
                  <span className="block font-bold text-gray-900 text-lg">{averageRating}</span>
                  <span className="text-xs text-gray-500 uppercase">Rating</span>
                </div>

              </div>
              <div className="flex gap-3 pt-2 justify-center lg:justify-start">
                {profile.linkedin && <a href={profile.linkedin} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-blue-600 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>}
                {profile.instagram && <a href={profile.instagram} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-pink-600 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>}
                {profile.website && <a href={profile.website} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 hover:text-black transition-colors"><Globe className="w-5 h-5" /></a>}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Contact Details</h3>
              <div className="space-y-3">
                {profile.email && <div className="flex items-center gap-3 text-sm text-gray-600"><Mail className="w-4 h-4 text-gray-400" /><span className="truncate">{profile.email}</span></div>}
                {profile.phone && <div className="flex items-center gap-3 text-sm text-gray-600"><Phone className="w-4 h-4 text-gray-400" /><span>{profile.phone}</span></div>}
                {profile.website && <div className="flex items-start gap-3 text-sm text-gray-600"><Globe className="w-4 h-4 text-gray-400 mt-0.5" /><a href={profile.website} target="_blank" className="hover:underline truncate">{profile.website}</a></div>}
              </div>
            </div>

            <OurTeam members={profile.team_members} />
            <OrgDetails profile={profile} />
          </div>

          {/* MAIN CONTENT (Events, Stats, Etc) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">{profile.mission_statement || "No mission statement added yet."}</p>
              {profile.intent_description && <div className="mt-4 pt-4 border-t border-gray-100"><h4 className="text-sm font-bold text-gray-900 mb-2">About Us</h4><p className="text-gray-600 text-sm">{profile.intent_description}</p></div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-24 h-24" /></div>
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-1">Total Impact</h3>
                <div className="text-4xl font-bold mb-4">{profile.total_hours_generated || 0} Hrs</div>
                <div className="flex gap-4">
                  <div><span className="text-xs text-slate-400 block">Events</span><span className="font-semibold text-emerald-400">{profile.events_hosted || events.length} Hosted</span></div>
                  <div><span className="text-xs text-slate-400 block">Volunteers</span><span className="font-semibold text-amber-400">{profile.volunteers_engaged || 0} Engaged</span></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Events Frequency</h3>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}><XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="events" radius={[4, 4, 0, 0]} barSize={20}><Cell fill='#3b82f6' /></Bar></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <Achievements items={profile.achievements} />
            <Reviews reviews={reviews} />

            {/* EVENTS SECTION */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Events</h3>
                {isOwnProfile && <Link href="/org-events/create" className="text-sm text-blue-600 hover:underline font-medium">Create New +</Link>}
              </div>

              {displayedEvents.length === 0 ? (
                <div className="text-center py-10"><CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No events found.</p></div>
              ) : (
                <div className="space-y-4">
                  {displayedEvents.map((event, idx) => {
                    const isCompleted = event.status === 'completed';
                    let linkHref;
                    if (isOwnProfile) {
                      linkHref = isCompleted ? `/org-events/${event.id}/report` : `/org-events/${event.id}`;
                    } else {
                      linkHref = `/events/${event.id}/showcase`;
                    }

                    return (
                      <Link key={idx} href={linkHref} className="block group">
                        <div className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all bg-white relative">
                          <div className="w-14 shrink-0 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200 h-14">
                            <span className="text-xs font-bold text-red-500 uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-xl font-bold text-gray-900">{new Date(event.event_date).getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0 pr-20">
                            <h4 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{event.title}</h4>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.registered_count || 0} Registered</span>
                            </div>
                          </div>
                          <div className={cn("absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium capitalize", isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                            {event.status || "Draft"}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}