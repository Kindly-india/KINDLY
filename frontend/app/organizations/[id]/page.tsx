"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MapPin, ChevronLeft, Loader2, CheckCircle2, Edit2,
  Trophy, Mail, Phone, UserPlus, UserMinus,
  Share2, Linkedin, Instagram, Globe,
  Check, Quote, Building2, Users, CalendarDays,
  Hash, FileBadge, Users2, Image as ImageIcon, Plus, ExternalLink, Award, Newspaper
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

// --- SUB-COMPONENTS ---

// ✅ UPDATED: ACHIEVEMENTS (Real Data)
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
            {/* Image Area - Show placeholder if no image */}
            <div className="h-40 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Trophy className="w-10 h-10 text-gray-300" />
              )}
            </div>

            {/* Description Area */}
            <div className="p-4">
              <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{item.title}</h4>
              <p className="text-[10px] text-blue-600 font-semibold mb-2">{item.date}</p>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ✅ UPDATED: TEAM (Real Data)
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
              {/* Assuming member object has 'name', 'role' */}
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
        {/* Org Type */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Type</p>
            <p className="text-sm text-gray-600 capitalize">{profile.org_type || "Registered Organization"}</p>
          </div>
        </div>

        {/* Registration */}
        {profile.registration_number && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Registration No.</p>
              <p className="text-sm text-gray-600">{profile.registration_number}</p>
            </div>
          </div>
        )}

        {/* Years Active */}
        {profile.years_active && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <FileBadge className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Years Active</p>
              <p className="text-sm text-gray-600">{profile.years_active} Years</p>
            </div>
          </div>
        )}

        {/* Representative */}
        {profile.representative_name && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
              <Users2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Rep. Name</p>
              <p className="text-sm text-gray-600">{profile.representative_name}</p>
              {profile.designation && <p className="text-xs text-gray-400">{profile.designation}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---

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

  const [isViewerOrg, setIsViewerOrg] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        // 1. Fetch all Organization Data (Profile, Events, Reviews, User)
        const [profileRes, eventsRes, reviewsRes, currentUser] = await Promise.all([
          api.getOrgPublicProfile(id as string),
          api.getOrgEvents(id as string),
          api.getOrgReviews(id as string),
          api.getCurrentUser().catch(() => null)
        ])

        // ✅ Define fetchedProfile here so we can use it immediately for logic
        const fetchedProfile = profileRes.profile;

        setProfile(fetchedProfile)

        // 2. Set Events & Reviews
        const fetchedEvents = eventsRes.events || [];
        setEvents(fetchedEvents)
        setReviews(reviewsRes.reviews || [])

        // 3. Graph Data Logic
        const last6Months = Array(6).fill(0).map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return {
            name: d.toLocaleString('default', { month: 'short' }),
            monthIdx: d.getMonth(),
            events: 0
          };
        });

        fetchedEvents.forEach((ev: any) => {
          const eventDate = new Date(ev.event_date);
          const bucket = last6Months.find(m => m.monthIdx === eventDate.getMonth());
          if (bucket) bucket.events += 1;
        });
        setActivityData(last6Months);

        // 4. Follow Button Logic
        const isSelf = currentUser?.id === fetchedProfile.user_id;
        setIsOwnProfile(isSelf);

        const hasToken = localStorage.getItem('token') || currentUser;

        // ✅ Check Status using the fetched profile (not state)
        if (!isSelf && currentUser && fetchedProfile?.user_id) {
          try {
            const followRes = await api.getFollowStatus(fetchedProfile.user_id)
            setIsFollowing(followRes.isFollowing)
          } catch (err) {
            console.error("Follow check failed", err);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  const handleFollow = async () => {
    // ⚠️ Check for user_id, NOT id
    if (!profile?.user_id) return

    try {
      if (isFollowing) {
        await api.unfollowUser(profile.user_id)
        setIsFollowing(false)
        setProfile((prev: any) => ({
          ...prev,
          followers_count: Math.max(0, (prev.followers_count || 0) - 1)
        }))
      } else {
        await api.followUser(profile.user_id)
        setIsFollowing(true)
        setProfile((prev: any) => ({
          ...prev,
          followers_count: (prev.followers_count || 0) + 1
        }))
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: profile.name, url: window.location.href })
      } catch (err) { }
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getExternalLink = (url: string) => {
    if (!url) return "#";
    return url.startsWith('http') ? url : `https://${url}`;
  }

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
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all relative"
            >
              {copied ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
            </button>

            {isOwnProfile ? (
              <Link href="/settings/profile" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Page
              </Link>
            ) : (
              // ✅ LOGIC: Hide if Viewer is Org
              !isViewerOrg && (
                <button
                  onClick={handleFollow}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2",
                    isFollowing
                      ? "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300" // Unfollow Style
                      : "bg-black text-white hover:bg-gray-800" // Follow Style
                  )}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" /> Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Follow
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      {/* 2. COVER IMAGE */}
      <div className="h-48 md:h-64 bg-gray-200 w-full relative overflow-hidden group">
        {!coverError && profile.cover_url ? (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={() => setCoverError(true)}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-r from-slate-800 to-slate-900 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-white/10" />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* 3. LEFT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 -mt-20 mb-4">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">{profile.name?.charAt(0)}</div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">{profile.name}</h1>
                  <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50 shrink-0" />
                </div>
                <p className="text-gray-600 font-medium">{profile.tagline || "Making a difference."}</p>
                {profile.area_locality && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                    <MapPin className="w-4 h-4" /> {profile.area_locality}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-4 mb-6">
                <div className="text-center">
                  <span className="block font-bold text-gray-900 text-lg">{profile.followers_count || 0}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Followers</span>
                </div>
                <div className="text-center border-l border-gray-100">
                  <span className="block font-bold text-gray-900 text-lg">{events.length}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Events</span>
                </div>
                <div className="text-center border-l border-gray-100">
                  <span className="block font-bold text-gray-900 text-lg">4.9</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Rating</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2 justify-center lg:justify-start">
                {profile.linkedin && <a href={getExternalLink(profile.linkedin)} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-blue-600 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>}
                {profile.instagram && <a href={getExternalLink(profile.instagram)} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-pink-600 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>}
                {profile.website && <a href={getExternalLink(profile.website)} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 hover:text-black transition-colors"><Globe className="w-5 h-5" /></a>}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <button className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" /> Contact Organization
                </button>
              </div>
            </div>

            {/* CONTACT DETAILS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Contact Details</h3>
              <div className="space-y-3">
                {profile.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                    <a href={getExternalLink(profile.website)} target="_blank" className="hover:underline truncate">{profile.website}</a>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ REAL TEAM DATA - USES profile.team_members */}
            <OurTeam members={profile.team_members} />

            {/* ORG SPECIFIC DETAILS */}
            <OrgDetails profile={profile} />
          </div>

          {/* 4. MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-6">
            {/* Mission Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Our Mission</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {profile.mission_statement || "No mission statement added yet."}
              </p>
              {profile.intent_description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">About Us</h4>
                  <p className="text-gray-600 text-sm">{profile.intent_description}</p>
                </div>
              )}
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-24 h-24" /></div>
                <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-1">Total Impact</h3>
                {/* ✅ DISPLAYS REAL HOURS */}
                <div className="text-4xl font-bold mb-4">{profile.total_hours_generated || 0} Hrs</div>
                <div className="flex gap-4">
                  {/* ✅ DISPLAYS REAL EVENTS COUNT */}
                  <div>
                    <span className="text-xs text-slate-400 block">Events</span>
                    <span className="font-semibold text-emerald-400">{profile.events_hosted || events.length} Hosted</span>
                  </div>
                  {/* ✅ DISPLAYS REAL VOLUNTEER COUNT */}
                  <div>
                    <span className="text-xs text-slate-400 block">Volunteers</span>
                    <span className="font-semibold text-amber-400">{profile.volunteers_engaged || 0} Engaged</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Events Frequency</h3>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="events" radius={[4, 4, 0, 0]} barSize={20}>
                        {activityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.events > 0 ? '#3b82f6' : '#e5e7eb'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ✅ REAL ACHIEVEMENTS DATA - USES profile.achievements */}
            <Achievements items={profile.achievements} />

            {/* Reviews */}
            <Reviews reviews={reviews} />

            {/* Events List (With Status and Click Logic) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Events</h3>
                {isOwnProfile && <Link href="/org-events/create" className="text-sm text-blue-600 hover:underline font-medium">Create New +</Link>}
              </div>

              {events.length === 0 ? (
                <div className="text-center py-10"><CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No events hosted yet.</p></div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, idx) => {
                    const isCompleted = event.status === 'completed';
                    const linkHref = isCompleted
                      ? `/org-events/${event.id}/report`
                      : `/org-events/${event.id}`;

                    let badgeClass = "bg-gray-100 text-gray-600";
                    let badgeText = event.status || "Draft";

                    if (isCompleted) {
                      badgeClass = "bg-green-100 text-green-700";
                      badgeText = "Completed";
                    } else if (event.status === 'published') {
                      badgeClass = "bg-blue-50 text-blue-700";
                      badgeText = "Ongoing";
                    }

                    return (
                      <Link key={idx} href={linkHref} className="block group">
                        <div className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all bg-white relative">
                          {/* Date Box */}
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

                          {/* Status Badge */}
                          <div className={cn("absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium capitalize", badgeClass)}>
                            {badgeText}
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