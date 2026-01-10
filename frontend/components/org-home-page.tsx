"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Clock,
  MapPin,
  Users,
  Sparkles,
  Menu,
  X,
  Heart,
  ChevronRight,
  ChevronLeft,
  Plus,
  Megaphone,
  CheckCircle,
  UserCheck,
  User,
  Calendar,
  Building2,
  AlertTriangle,
  Loader2,
  BarChart3 // ✅ Added Icon for Analytics
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

export function OrgHomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const eventsRef = useRef<HTMLDivElement>(null)

  // --- Real-Time Data State ---
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  const [stats, setStats] = useState({
    totalHours: 0,
    activeVolunteers: 0,
    eventsHosted: 0,
    upcomingEventsCount: 0
  })
  const [error, setError] = useState<string | null>(null)

  // --- Fetch Data on Mount ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        const [profileRes, eventsRes, activityRes] = await Promise.all([
          api.getUserProfile(),
          api.getMyEvents(),
          api.getRecentActivity()
        ])

        const orgProfile = profileRes?.profile || {}
        const fetchedEvents = eventsRes.events || []

        setProfile(orgProfile)
        setEvents(fetchedEvents)
        setRecentActivity(activityRes.activities || [])

        // Initialize Stats
        const calculatedStats = {
          totalHours: 0,
          activeVolunteers: 0,
          eventsHosted: 0,
          upcomingEventsCount: 0
        }

        // Process Events Basic Stats
        fetchedEvents.forEach((event: any) => {
          calculatedStats.eventsHosted += 1

          const start = new Date(`1970-01-01T${event.start_time}`)
          const end = new Date(`1970-01-01T${event.end_time}`)
          let durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          if (durationHours < 0) durationHours = 0;

          const volunteerCount = event.checked_in_count || 0
          calculatedStats.totalHours += Math.round(durationHours * volunteerCount)

          const eventDate = new Date(event.event_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (eventDate >= today) {
            calculatedStats.upcomingEventsCount += 1
          }
        });

        // Calculate UNIQUE Active Volunteers
        const uniqueVolunteerIds = new Set<string>();
        const activeEvents = fetchedEvents.filter((e: any) => (e.registered_count || 0) > 0);

        await Promise.all(activeEvents.map(async (ev: any) => {
          try {
            const regRes = await api.getEventRegistrations(ev.id);
            if (regRes.registrations && Array.isArray(regRes.registrations)) {
              regRes.registrations.forEach((reg: any) => {
                const vId = reg.volunteer_id || reg.volunteer_profiles?.id;
                if (vId) uniqueVolunteerIds.add(vId);
              });
            }
          } catch (err) {
            console.warn(`Could not fetch roster for event ${ev.id}`, err);
          }
        }));

        calculatedStats.activeVolunteers = uniqueVolunteerIds.size;
        setStats(calculatedStats)

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const scrollEvents = (direction: "left" | "right") => {
    if (eventsRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300
      eventsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      environment: "bg-emerald-500",
      education: "bg-blue-500",
      health: "bg-red-500",
      animals: "bg-amber-500",
      elderly: "bg-purple-500",
      community: "bg-cyan-500",
    }
    return colors[category?.toLowerCase()] || "bg-gray-500"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0066cc] animate-spin" />
          <p className="text-sm text-[#86868b]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Sticky Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#f5f5f7]">
        <div className="max-w-300 mx-auto px-4 md:px-8 h-12 md:h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-[15px] md:text-[17px] font-bold text-[#1d1d1f] tracking-tight">KINDLY</span>
          </Link>

          <div className="hidden md:flex gap-4">
            <Link href="/org-events" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors">
              My Events
            </Link>
            <Link href="/social" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors">
              Social
            </Link>
            {/* ✅ ADDED ANALYTICS LINK DESKTOP */}
            <Link href="/org-analytics" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors">
              Analytics
            </Link>
          </div>

          <Link href={`/organizations/${profile?.id}`} className="hidden md:block">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#f5f5f7] hover:ring-[#0066cc] transition-all bg-gray-100 flex items-center justify-center text-[#0066cc] font-bold">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span>{profile?.name?.charAt(0) || "O"}</span>
              )}
            </div>
          </Link>

          <div className="relative md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors">
              {menuOpen ? <X className="w-5 h-5 text-[#1d1d1f]" /> : <Menu className="w-5 h-5 text-[#1d1d1f]" />}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-xl shadow-xl border border-[#e5e5e7] overflow-hidden">
                  <Link href={`/organizations/${profile?.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#f5f5f7] bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-bold">{profile?.name?.charAt(0)}</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">View Profile</span>
                  </Link>
                  <Link href="/org-events" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#0284c7]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">My Events</span>
                  </Link>
                  <Link href="/org-volunteers" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#2e7d32]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Volunteers</span>
                  </Link>
                  {/* ✅ ADDED ANALYTICS LINK MOBILE */}
                  <Link href="/org-analytics" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f3e8ff] to-[#d8b4fe] flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#9333ea]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Analytics</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section (Unchanged) */}
      <section className="relative bg-gradient-to-br from-[#f0f7ff] via-[#f5faff] to-[#f0fdf4] py-8 md:py-16 overflow-hidden">
        <div className="absolute top-4 left-4 md:top-8 md:left-20 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 md:w-5 md:h-5 text-[#0066cc]" />
        </div>
        <div className="absolute top-10 right-6 md:top-16 md:right-32 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" />
        </div>
        <div className="absolute bottom-14 left-6 md:bottom-20 md:left-32 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Users className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
        </div>
        <div className="absolute bottom-8 right-4 md:bottom-12 md:right-20 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Heart className="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" />
        </div>

        <div className="max-w-300 mx-auto px-4 md:px-8 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm mb-4 md:mb-6">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] md:text-[13px] text-[#1d1d1f] font-medium">
              {stats.upcomingEventsCount} events upcoming
            </span>
          </div>

          <h1 className="text-[24px] md:text-[56px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-[#0066cc] via-[#10b981] to-[#f59e0b] bg-clip-text text-transparent">
              {profile?.name || "Partner"}
            </span>
            .
          </h1>
          <p className="text-[14px] md:text-[19px] font-semibold text-[#1d1d1f] mt-2 md:mt-3">
            Ready to make an impact in your society?
          </p>

          <div className="flex justify-center gap-2 md:gap-4 mt-6 md:mt-8">
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <p className="text-[18px] md:text-[28px] font-bold text-[#0066cc]">
                {stats.totalHours.toLocaleString()}
              </p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Total Hours</p>
            </div>
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <p className="text-[18px] md:text-[28px] font-bold text-[#10b981]">
                {stats.activeVolunteers.toLocaleString()}
              </p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Active Volunteers</p>
            </div>
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <p className="text-[18px] md:text-[28px] font-bold text-[#f59e0b]">
                {stats.eventsHosted}
              </p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Events Hosted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions (Unchanged) */}
      <section className="bg-white py-6 md:py-10 border-b border-[#f5f5f7]">
        <div className="max-w-300 mx-auto px-4 md:px-8">
          <h2 className="text-[18px] md:text-[24px] font-bold text-[#1d1d1f] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Link href="/org-events/create" className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-md transition-all group border border-[#bbf7d0]">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
              </div>
              <h3 className="text-[14px] md:text-[17px] font-semibold text-[#1d1d1f]">Create Event</h3>
              <p className="text-[11px] md:text-[13px] text-[#86868b] mt-0.5">Draft a new volunteer drive</p>
            </Link>
            <Link href="/org-events?tab=active" className="bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-md transition-all group border border-[#fed7aa]">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Megaphone className="w-5 h-5 md:w-6 md:h-6 text-[#f59e0b]" />
              </div>
              <h3 className="text-[14px] md:text-[17px] font-semibold text-[#1d1d1f]">Broadcast</h3>
              <p className="text-[11px] md:text-[13px] text-[#86868b] mt-0.5">Message all volunteers</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Your Events Section (Unchanged) */}
      <section className="bg-[#f5f5f7] py-6 md:py-12">
        <div className="max-w-300 mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-[20px] md:text-[36px] font-bold text-[#1d1d1f] tracking-tight">Your Events</h2>
              <p className="text-[12px] md:text-[15px] text-[#86868b] mt-0.5">Manage and track your volunteer drives</p>
            </div>
            <Link href="/org-events" className="text-[12px] md:text-[14px] font-medium text-[#0066cc] hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Calendar className="w-12 h-12 text-[#86868b] mx-auto mb-3" />
              <p className="text-sm text-[#86868b]">No events yet. Create your first event!</p>
              <Link href="/org-events/create" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Create Event
              </Link>
            </div>
          ) : (
            <>
              <div ref={eventsRef} className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                {events.map((event) => (
                  <Link key={event.id} href={`/org-events/${event.id}`} className="shrink-0 w-64 md:w-auto snap-start group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="relative aspect-4/3 overflow-hidden">
                      {event.cover_image_url ? (
                        <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"><Calendar className="w-12 h-12 text-gray-400" /></div>
                      )}
                      <div className={cn("absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] md:text-[11px] font-semibold text-white capitalize", getCategoryColor(event.category))}>
                        {event.category}
                      </div>
                      <div className={cn("absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] md:text-[11px] font-semibold capitalize", event.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {event.status}
                      </div>
                      {event.is_urgent && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500 text-white rounded text-[9px] md:text-[11px] font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="text-[13px] md:text-[15px] font-semibold text-[#1d1d1f] mb-1.5 line-clamp-1">{event.title}</h3>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[#86868b]"><Clock className="w-3 h-3" /><span className="text-[10px] md:text-[12px]">{formatDate(event.event_date)} • {formatTime(event.start_time)}</span></div>
                        <div className="flex items-center gap-1.5 text-[#86868b]"><MapPin className="w-3 h-3" /><span className="text-[10px] md:text-[12px] line-clamp-1">{event.location}</span></div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#f5f5f7]">
                        <div className="flex items-center justify-between text-[10px] md:text-[11px] mb-1">
                          <span className="text-[#86868b]">{event.registered_count}/{event.total_slots} registered</span>
                          <span className="font-medium text-[#10b981]">{Math.round((event.registered_count / event.total_slots) * 100) || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full transition-all" style={{ width: `${(event.registered_count / event.total_slots) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {events.length > 4 && (
                <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-6 md:mt-10">
                  <button onClick={() => scrollEvents("left")} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#d2d2d7] flex items-center justify-center hover:bg-white transition-colors"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-[#1d1d1f]" /></button>
                  <div className="flex items-center gap-1">{[1, 2, 3].map((page) => (<button key={page} className={cn("w-7 h-7 md:w-8 md:h-8 rounded-full text-[11px] md:text-[13px] font-medium transition-colors", page === 1 ? "bg-[#1d1d1f] text-white" : "text-[#86868b] hover:bg-white")}>{page}</button>))}</div>
                  <button onClick={() => scrollEvents("right")} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#d2d2d7] flex items-center justify-center hover:bg-white transition-colors"><ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#1d1d1f]" /></button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Recent Activity Section (Unchanged) */}
      <section className="bg-white py-6 md:py-10">
        <div className="max-w-300 mx-auto px-4 md:px-8">
          <h2 className="text-[18px] md:text-[24px] font-bold text-[#1d1d1f] mb-4">Recent Activity</h2>

          {recentActivity.length === 0 ? (
            <div className="bg-[#f5f5f7] rounded-xl p-6 text-center text-[#86868b] text-sm">
              No recent activity yet.
            </div>
          ) : (
            <div className="bg-[#f5f5f7] rounded-xl md:rounded-2xl overflow-hidden divide-y divide-white">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3.5 md:p-4 bg-white">
                  <div
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center",
                      activity.type === "publish"
                        ? "bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd]"
                        : activity.type === "checkin"
                          ? "bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0]"
                          : "bg-gradient-to-br from-[#f3e8ff] to-[#e9d5ff]",
                    )}
                  >
                    {activity.type === "publish" && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#0284c7]" />}
                    {activity.type === "checkin" && <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-[#16a34a]" />}
                    {activity.type === "register" && <User className="w-4 h-4 md:w-5 md:h-5 text-[#9333ea]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] md:text-[15px] text-[#1d1d1f] leading-snug">{activity.text}</p>
                    <p className="text-[11px] md:text-[13px] text-[#86868b] mt-0.5">{timeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default OrgHomePage;