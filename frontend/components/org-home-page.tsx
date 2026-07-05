"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Clock,
  MapPin,
  Users,
  Sparkles,
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
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { InstagramIcon, LinkedinIcon, WhatsappIcon } from "@/components/ui/social-icons"

export function OrgHomePage() {
  const eventsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
        // 1. Authenticate with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // 2. Redirect to login if unauthorized
        if (!user || authError) {
          router.push('/login')
          return // Stop execution here
        }

        // 3. Begin loading your existing data
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

        // Process Events Basic Stats — exclude cancelled events from all counts
        fetchedEvents.forEach((event: any) => {
          if (event.status === 'cancelled') return

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
  }, [router])

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
      nature_outdoors: "bg-emerald-500",
      food_hunger: "bg-orange-500",
      animal_welfare: "bg-amber-500",
      elderly_care: "bg-purple-500",
      education_mentoring: "bg-blue-500",
      health_medical: "bg-red-500",
      art_culture: "bg-pink-500",
      civic_community: "bg-cyan-500",
      women_empowerment: "bg-rose-500",
      youth_sports: "bg-lime-500",
      mental_wellness: "bg-indigo-500",
      donation_drives: "bg-yellow-500",
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff6b6b] animate-spin" />
      </div>
    )
  }

  const floatingOrnaments = [
    { icon: Building2, color: "text-[#0066cc]", pos: "top-4 left-4 md:top-8 md:left-20", delay: 0 },
    { icon: Sparkles, color: "text-amber-500", pos: "top-10 right-6 md:top-16 md:right-32", delay: 0.6 },
    { icon: Users, color: "text-emerald-500", pos: "bottom-14 left-6 md:bottom-20 md:left-32", delay: 1.2 },
    { icon: Heart, color: "text-[#ff6b6b]", pos: "bottom-8 right-4 md:bottom-12 md:right-20", delay: 1.8 },
  ]

  return (
    <div className="min-h-screen bg-background dark:bg-black relative">
      {/* Hero Section — same peach/mint gradient + white ambient glow as
          the volunteer home page hero, for a consistent welcome moment
          across both portals. */}
      <section className="relative bg-gradient-to-br from-[#fef5f0] dark:from-black via-[#fff8f5] dark:via-black to-[#f5fcf8] dark:to-black py-8 md:py-16 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] max-w-[200vw] bg-gradient-to-b from-white/70 dark:from-white/15 to-transparent blur-3xl pointer-events-none"
        />

        {/* Floating ornaments */}
        {floatingOrnaments.map(({ icon: Icon, color, pos, delay }, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
            className={cn("absolute w-8 h-8 md:w-12 md:h-12 bg-card rounded-xl shadow-lg flex items-center justify-center", pos)}
          >
            <Icon className={cn("w-4 h-4 md:w-5 md:h-5", color)} />
          </motion.div>
        ))}

        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center relative">
          <ScrollReveal>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-full shadow-sm mb-4 md:mb-6">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] md:text-[13px] text-foreground font-medium">
                {stats.upcomingEventsCount} events upcoming
              </span>
            </div>

            <h1 className="text-[24px] md:text-[56px] font-bold text-foreground dark:text-white tracking-tight leading-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-[#ff6b6b] via-[#f59e0b] to-[#10b981] bg-clip-text text-transparent">
                {profile?.name || "Partner"}
              </span>
              .
            </h1>
            <p className="text-[14px] md:text-[19px] text-muted-foreground dark:text-neutral-400 mt-2 md:mt-3">
              Ready to make an impact in your society?
            </p>
          </ScrollReveal>

          <div className="flex justify-center gap-2 md:gap-4 mt-6 md:mt-8">
            <ScrollReveal delay={0}>
              <Card className="gap-0 px-3 md:px-6 py-3 md:py-4">
                <p className="text-[18px] md:text-[28px] font-bold text-[#ff6b6b]">
                  {stats.totalHours.toLocaleString()}
                </p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Total Hours</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <Card className="gap-0 px-3 md:px-6 py-3 md:py-4">
                <p className="text-[18px] md:text-[28px] font-bold text-[#10b981]">
                  {stats.activeVolunteers.toLocaleString()}
                </p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Active Volunteers</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.16}>
              <Card className="gap-0 px-3 md:px-6 py-3 md:py-4">
                <p className="text-[18px] md:text-[28px] font-bold text-[#f59e0b]">
                  {stats.eventsHosted}
                </p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Events Hosted</p>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Quick Actions — asymmetric bento, mirroring the hero-cell pattern
          from the volunteer home page's Impact section: the "hero" tile
          stays a neutral glass Card (not a solid color fill) and earns its
          emphasis from size + a colored icon/CTA accent instead. Create
          Event is the org's core, most frequent action, so it's the larger
          tile; Broadcast is occasional, so it's the smaller supporting one. */}
      <section className="relative bg-gradient-to-br from-[#fffbeb] dark:from-black via-[#fef9f0] dark:via-black to-[#fff7ed] dark:to-black py-6 md:py-10 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-amber-400/[0.06] dark:bg-amber-400/[0.1] rounded-full blur-3xl pointer-events-none"
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <ScrollReveal delay={0.15}>
            <h2 className="text-[18px] md:text-[24px] font-bold text-foreground dark:text-white mb-4">Quick Actions</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
            <ScrollReveal delay={0.2} className="md:col-span-3">
              <Card className="h-full p-5 md:p-8">
                <Link href="/org-events/create" className="group block">
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-[#ff6b6b]/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5 md:w-7 md:h-7 text-[#ff6b6b]" />
                  </div>
                  <h3 className="text-[16px] md:text-[22px] font-bold text-foreground dark:text-white">Create Event</h3>
                  <p className="text-[12px] md:text-[14px] text-muted-foreground dark:text-neutral-400 mt-1 max-w-md">Draft a new volunteer drive and get it in front of your community</p>
                  <span className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-[#ff6b6b] text-white rounded-full font-semibold text-sm hover:bg-[#ee5a5a] transition-all shadow-sm shadow-[#ff6b6b]/20 hover:-translate-y-0.5 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border dark:border-white/10 dark:rounded-xl dark:shadow-none">
                    Get Started <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.25} className="md:col-span-2">
              <Card className="h-full p-5 md:p-8">
                <Link href="/org-events?tab=active" className="group block">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Megaphone className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                  </div>
                  <h3 className="text-[14px] md:text-[17px] font-semibold text-foreground dark:text-white">Broadcast</h3>
                  <p className="text-[11px] md:text-[13px] text-muted-foreground dark:text-neutral-400 mt-0.5">Message all volunteers</p>
                </Link>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Your Events */}
      <section className="bg-muted dark:bg-black py-6 md:py-12 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#0066cc]/[0.05] dark:bg-[#0066cc]/[0.1] rounded-full blur-3xl pointer-events-none"
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <ScrollReveal className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h2 className="text-[20px] md:text-[36px] font-bold text-foreground dark:text-white tracking-tight">Your Events</h2>
              <p className="text-[12px] md:text-[15px] text-muted-foreground dark:text-neutral-400 mt-0.5">Manage and track your volunteer drives</p>
            </div>
            <Link href="/org-events" className="text-[12px] md:text-[14px] font-semibold text-[#ff6b6b] hover:text-[#ee5a5a] flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>

          {events.filter(e => e.status !== 'cancelled').length === 0 ? (
            <ScrollReveal delay={0.1}>
              <Card className="text-center py-12 dark:bg-neutral-900/50 dark:backdrop-blur-md dark:border-neutral-800/60 dark:rounded-2xl dark:shadow-none">
                <Calendar className="w-12 h-12 text-muted-foreground dark:text-neutral-500 mx-auto mb-3" />
                <p className="text-muted-foreground dark:text-neutral-400">No events yet. Create your first event!</p>
                <Link href="/org-events/create" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white rounded-full text-sm font-semibold hover:scale-105 transition-all self-center">
                  <Plus className="w-4 h-4" /> Create Event
                </Link>
              </Card>
            </ScrollReveal>
          ) : (
            <>
              {/* items-stretch forces all cards to equal height */}
              <ScrollReveal delay={0.1}>
                <div
                  ref={eventsRef}
                  className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide items-stretch"
                >
                  {events.filter(e => e.status !== 'cancelled').map((event) => (
                    <Link
                      key={event.id}
                      href={`/org-events/${event.id}`}
                      className="shrink-0 w-64 md:w-auto snap-start group bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl md:rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 hover:shadow-lg hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col self-stretch"
                    >
                      {/* Fixed 16:9 Image Container */}
                      <div className="relative aspect-video w-full overflow-hidden bg-muted shrink-0">
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-muted flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}

                        <div className={cn("absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] md:text-[11px] font-semibold text-white capitalize z-10", getCategoryColor(event.category))}>
                          {event.category}
                        </div>

                        <div className={cn("absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] md:text-[11px] font-semibold capitalize z-10", event.status === "published" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300")}>
                          {event.status}
                        </div>

                        {event.is_urgent && (
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500 text-white rounded text-[9px] md:text-[11px] font-semibold flex items-center gap-1 z-10">
                            <AlertTriangle className="w-3 h-3" /> Urgent
                          </div>
                        )}
                      </div>

                      {/* Content area flex-1 pushes the progress bar to the bottom */}
                      <div className="p-3 md:p-4 flex flex-col flex-1">
                        <h3 className="text-[13px] md:text-[15px] font-semibold text-foreground dark:text-white mb-1.5 line-clamp-1">
                          {event.title}
                        </h3>

                        <div className="space-y-0.5 mb-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] md:text-[12px] font-medium">{formatDate(event.event_date)} • {formatTime(event.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] md:text-[12px] font-medium line-clamp-1">{event.location}</span>
                          </div>
                        </div>

                        {/* mt-auto ensures the progress section stays pinned to the bottom */}
                        <div className="mt-auto pt-2 border-t border-black/5 dark:border-white/10">
                          {event.total_slots == null ? (
                            <div className="flex items-center justify-between text-[10px] md:text-[11px]">
                              <span className="text-muted-foreground">{event.registered_count} registered</span>
                              <span className="font-semibold text-[#10b981]">Unlimited</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-[10px] md:text-[11px] mb-1">
                                <span className="text-muted-foreground">{event.registered_count}/{event.total_slots} registered</span>
                                <span className="font-semibold text-[#10b981]">{Math.round((event.registered_count / event.total_slots) * 100) || 0}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full transition-all"
                                  style={{ width: `${(event.registered_count / event.total_slots) * 100}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
              {/* Pagination */}
              {events.length > 4 && (
                <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-6 md:mt-10">
                  <button onClick={() => scrollEvents("left")} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
                  </button>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((page) => (
                      <button key={page} className={cn("w-7 h-7 md:w-8 md:h-8 rounded-full text-[11px] md:text-[13px] font-semibold transition-colors", page === 1 ? "bg-[#ff6b6b] text-white" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5")}>
                        {page}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => scrollEvents("right")} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Recent Activity — soft violet pastel section, mirroring the
          Stories section's own pastel-gradient-plus-side-glow treatment
          on the volunteer home page. */}
      <section className="relative bg-gradient-to-br from-[#f5f3ff] dark:from-black via-[#faf5ff] dark:via-black to-[#fdf4ff] dark:to-black py-6 md:py-10 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-purple-500/[0.05] dark:bg-purple-500/[0.1] rounded-full blur-3xl pointer-events-none"
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <ScrollReveal>
            <h2 className="text-[18px] md:text-[24px] font-bold text-foreground dark:text-white mb-4">Recent Activity</h2>
          </ScrollReveal>

          {recentActivity.length === 0 ? (
            <ScrollReveal delay={0.1}>
              <Card className="p-6 text-center text-muted-foreground dark:text-neutral-400 text-sm">
                No recent activity yet.
              </Card>
            </ScrollReveal>
          ) : (
            <ScrollReveal delay={0.1}>
              <Card className="gap-0 py-0 overflow-hidden divide-y divide-black/5 dark:divide-white/10">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3.5 md:p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    <div
                      className={cn(
                        "w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 flex items-center justify-center",
                        activity.type === "publish"
                          ? "bg-blue-500/10"
                          : activity.type === "checkin"
                            ? "bg-emerald-500/10"
                            : "bg-purple-500/10",
                      )}
                    >
                      {activity.type === "publish" && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />}
                      {activity.type === "checkin" && <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />}
                      {activity.type === "register" && <User className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] md:text-[15px] text-foreground dark:text-white leading-snug">{activity.text}</p>
                      <p className="text-[11px] md:text-[13px] font-medium text-muted-foreground dark:text-neutral-400 mt-0.5">{timeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-[#1d1d1f] dark:bg-black py-10 md:py-20 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-[450px] h-[260px] bg-gradient-to-t from-indigo-500/20 to-transparent blur-3xl pointer-events-none"
        />
        <ScrollReveal className="relative max-w-2xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-[20px] md:text-[36px] font-bold text-white tracking-tight">
            Ready to make a difference?
          </h2>
          <p className="text-[13px] md:text-[15px] text-muted-foreground dark:text-neutral-400 mt-2">
            Join thousands of volunteers creating positive change.
          </p>
        </ScrollReveal>
      </section>

      {/* Footer — Luma-style: one clean band (brand + links + icons), not a
          boxy 4-column directory. */}
      <footer className="bg-[#1d1d1f] dark:bg-black border-t border-white/10 py-8 md:py-10 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-[450px] h-[300px] bg-gradient-to-b from-indigo-500/20 to-transparent blur-3xl pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <Image src="/logowhite.png" alt="KINDLY" width={188} height={44} className="h-5 w-auto self-start shrink-0" />

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              <a href="/how-it-works" className="text-neutral-400 hover:text-white transition-colors">How it Works</a>
              <a href="/for-volunteers" className="text-neutral-400 hover:text-white transition-colors">For Volunteers</a>
              <a href="/for-organisations" className="text-neutral-400 hover:text-white transition-colors">For Organisations</a>
              <a href="/company/about" className="text-neutral-400 hover:text-white transition-colors">About</a>
              <a href="/company/careers" className="text-neutral-400 hover:text-white transition-colors">Careers</a>
              <a href="/company/press" className="text-neutral-400 hover:text-white transition-colors">Press</a>
              <a href="/resources/blog" className="text-neutral-400 hover:text-white transition-colors">Blog</a>
              <a href="/resources/help-center" className="text-neutral-400 hover:text-white transition-colors">Help Center</a>
              <a href="/resources/community" className="text-neutral-400 hover:text-white transition-colors">Community</a>
            </nav>

            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/kindly.india"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <LinkedinIcon className="w-5 h-5" />
              </a>
              <a
                href="https://chat.whatsapp.com/JLTD1iP3m8p63Mnz7SjISt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <WhatsappIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 mt-6 pt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-neutral-500">
            <span className="whitespace-nowrap">manasdhivare@gmail.com</span>
            <span className="whitespace-nowrap">+91 7517018954</span>
            <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="w-3 h-3" /> Nashik, India</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default OrgHomePage;