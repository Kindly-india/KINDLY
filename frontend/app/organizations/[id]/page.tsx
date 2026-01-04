"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Pencil,
  MapPin,
  Calendar,
  ChevronLeft,
  Loader2,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  Share2,
  MoreHorizontal,
  FileText,
  ExternalLink,
  ShieldCheck,
  History
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Edit2 } from "lucide-react"

export default function OrganizationProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<'events' | 'about'>('events')
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        // We add api.getCurrentUser() to the check
        const [profileRes, eventsRes, reviewsRes, currentUser] = await Promise.all([
          api.getOrgPublicProfile(id as string),
          api.getOrgEvents(id as string),
          api.getOrgReviews(id as string),
          api.getCurrentUser().catch(() => null) // Handle case where user isn't logged in
        ])

        setProfile(profileRes.profile)
        // Check if logged-in user ID matches the profile's user_id
        setIsOwnProfile(currentUser?.id === profileRes.profile.user_id)

        setProfile(profileRes.profile)
        setIsFollowing(profileRes.isFollowing)

        // Sort events by date
        const sortedEvents = (eventsRes.events || []).sort((a: any, b: any) =>
          new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        )
        setEvents(sortedEvents)

        setReviews(reviewsRes.reviews || [])

        try {
          const volRes = await api.getOrgVolunteers(id as string)
          setVolunteers(volRes.volunteers || [])
        } catch (err) {
          // Not authorized - skip
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  const handleFollow = async () => {
    try {
      await api.toggleFollowOrg(id as string)
      setIsFollowing(!isFollowing)
      setProfile((prev: any) => ({
        ...prev,
        followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
      }))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour} ${ampm}`
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      environment: "bg-[#10b981] text-white",
      education: "bg-blue-500 text-white",
      health: "bg-red-500 text-white",
      animals: "bg-amber-500 text-white",
      elderly: "bg-purple-500 text-white",
      community: "bg-cyan-500 text-white",
    }
    return colors[category?.toLowerCase()] || "bg-gray-500 text-white"
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num
  }

  const getOrgTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      registered: "Non-Profit",
      supported: "Supported Club",
      informal: "Informal Group",
      individual: "Individual"
    }
    return types[type?.toLowerCase()] || "Organization"
  }

  // Split events into Upcoming and Past
  const now = new Date()
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= now).reverse() // Ascending order for upcoming
  const pastEvents = events.filter(e => new Date(e.event_date) < now) // Descending order for past

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <p className="text-gray-500">Organization not found</p>
      </div>
    )
  }

  // Helper component for Event Card to avoid repetition
  const EventCard = ({ event, isPast = false }: { event: any, isPast?: boolean }) => {
    const progress = Math.min(100, Math.round((event.registered_count / event.total_slots) * 100));

    return (
      <Link
        href={`/events/${event.id}`}
        className={cn(
          "block bg-white p-4 rounded-2xl border transition-all",
          isPast
            ? "border-gray-100 opacity-80 hover:opacity-100 hover:shadow-sm"
            : "border-gray-100 shadow-sm hover:shadow-md"
        )}
      >
        <div className="flex gap-4">
          <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
            {event.cover_image_url ? (
              <img src={event.cover_image_url} alt="" className={cn("w-full h-full object-cover", isPast && "grayscale")} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Calendar className="w-8 h-8" />
              </div>
            )}
            {!isPast && (
              <div className={cn("absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold capitalize", getCategoryColor(event.category))}>
                {event.category}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <h3 className={cn("font-bold leading-tight mb-1", isPast ? "text-gray-600" : "text-gray-900")}>
                {event.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(event.event_date)} • {isPast ? 'Completed' : formatTime(event.start_time)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>

            {!isPast ? (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10b981] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs font-medium text-gray-400 bg-gray-50 self-start px-2 py-1 rounded-md">
                {event.registered_count} volunteers attended
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60 support-[backdrop-filter]:bg-white/60">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Left: Back Button */}
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Right: Actions Group */}
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-full text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm active:scale-95 mr-1"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
            )}

            <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-all active:scale-95">
              <Share2 className="w-5 h-5" />
            </button>

            <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition-all active:scale-95">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 pb-20">

        {/* Profile Header */}
        <div className="bg-white rounded-3xl mt-4 overflow-hidden shadow-sm border border-gray-100">

          {/* Cover Image (Banner) */}
          <div className="h-40 md:h-48 bg-linear-to-r from-blue-50 to-slate-100 relative">
            {profile.cover_url ? (
              <img
                src={profile.cover_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              /* Fallback subtle pattern if no cover image */
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px]" />
            )}
          </div>

          <div className="px-6 pb-8">
            <div className="flex flex-col items-center -mt-12 mb-4">

              {/* Profile Pic / Logo Container */}
              {/* z-10 ensures it stays above the banner, border-white creates the cutout effect */}
              <div className="relative z-10 w-24 h-24 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden mb-3">
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Fallback Initials */
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-2xl font-bold text-gray-400 select-none">
                    {profile.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name & Verification Badge */}
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">
                  {profile.name}
                </h1>
                {profile.is_verified && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />
                )}
              </div>

              {/* Rest of the header content (Tagline, Stats, etc.) remains below... */}
              <p className="text-gray-500 text-center mb-3 text-[15px]">
                {profile.tagline || profile.area_locality}
              </p>

              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mb-6">
                {profile.registration_number && (
                  <span className="flex items-center gap-1">
                    <span className="text-gray-300">Reg No:</span> {profile.registration_number}
                  </span>
                )}
                {profile.registration_number && <span className="w-1 h-1 rounded-full bg-gray-300" />}
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full border border-gray-300" />
                  {getOrgTypeLabel(profile.org_type)}
                </span>
              </div>

              <div className="flex items-center gap-12 mb-8">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{profile.total_events || events.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{formatNumber(profile.followers_count || 0)}</div>
                  <div className="text-xs text-gray-500 font-medium">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{formatNumber(profile.lives_touched || volunteers.length || 0)}</div>
                  <div className="text-xs text-gray-500 font-medium">Volunteers</div>
                </div>
              </div>

              <button
                onClick={handleFollow}
                className={cn(
                  "w-full max-w-sm py-3 rounded-xl font-semibold transition-all text-[15px]",
                  isFollowing
                    ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    : "bg-[#0F172A] text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 px-2 mt-8 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('events')}
            className={cn(
              "pb-3 text-[15px] font-medium transition-colors relative",
              activeTab === 'events' ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            )}
          >
            All Events
            {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={cn(
              "pb-3 text-[15px] font-medium transition-colors relative",
              activeTab === 'about' ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            )}
          >
            About & Docs
            {activeTab === 'about' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />}
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'events' && (
            <div className="space-y-8">
              {/* Upcoming Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Upcoming Events
                </h3>
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => <EventCard key={event.id} event={event} />)
                  ) : (
                    <p className="text-sm text-gray-400 italic">No upcoming events scheduled.</p>
                  )}
                </div>
              </div>

              {/* Divider if we have both */}
              {upcomingEvents.length > 0 && pastEvents.length > 0 && (
                <div className="h-px bg-gray-100" />
              )}

              {/* Past Section */}
              {pastEvents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Past Events
                  </h3>
                  <div className="space-y-4">
                    {pastEvents.map(event => <EventCard key={event.id} event={event} isPast={true} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Mission */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Our Mission</h3>
                <p className="text-gray-600 text-[15px] leading-relaxed">
                  {profile.mission_statement || profile.intent_description || "No description available."}
                </p>
              </div>

              {/* Legal Documents Section */}
              {(profile.registration_certificate_url || profile.pan_card_url || profile.proof_document_url) && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Legal & Documents
                  </h3>
                  <div className="space-y-3">
                    {profile.registration_certificate_url && (
                      <a
                        href={profile.registration_certificate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Registration Certificate</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </a>
                    )}

                    {profile.pan_card_url && (
                      <a
                        href={profile.pan_card_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">PAN Card</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </a>
                    )}

                    {profile.proof_document_url && (
                      <a
                        href={profile.proof_document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Supporting Proof</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Grid */}
              <div className="grid gap-3">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 text-gray-600 hover:text-blue-600 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium truncate flex-1">{profile.website}</span>
                  </a>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 text-gray-600 hover:text-blue-600 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium truncate flex-1">{profile.email}</span>
                  </a>
                )}
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 text-gray-600 hover:text-blue-600 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium truncate flex-1">{profile.phone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}