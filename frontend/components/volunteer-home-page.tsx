"use client"

import { useState, useRef, useEffect } from "react"
import { cn, formatLabel, eventHours, formatHoursTotal } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import {
  Clock,
  MapPin,
  Heart,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Quote,
  TrendingUp,
  Award,
  Zap,
  Target,
  Users,
  Sparkles,
  Leaf,
  Loader2
} from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { InstagramIcon, LinkedinIcon, WhatsappIcon } from "@/components/ui/social-icons"

// --- STATIC STORIES (Unchanged) ---
const stories = [
  {
    id: 1,
    quote: "the only acceptable reason to be awake at 6am on a sunday",
    author: "Manas Dhivare",
    role: "Founder - Kindly",
    image: "FullSizeRender.JPG",
  },
  {
    id: 2,
    quote: "It starts as one event. Somehow it becomes the plan for every weekend.",
    author: "Aditya Dhongade",
    role: "Co-Founder - Kindly",
    image: "riya.jpeg",
  },
  {
    id: 3,
    quote: "Less time on the feed. More time actually living it.",
    author: "Sarah Jenkins",
    role: "Animal Shelter Volunteer",
    image: "IMG_6205.jpg",
  },
  {
    id: 4,
    quote: "Connections through shared efforts.",
    author: "Rahul Verma",
    role: "Community Leader",
    image: "IMG_7299.JPEG",
  },
  {
    id: 5,
    quote: "You come for the cause. You stay for the people.",
    author: "Neha Gupta",
    role: "Elderly Care Assistant",
    image: "IMG_6559.jpg",
  },
  {
    id: 6,
    quote: "Stay for the events. Live for the afters.",
    author: "Dr. Arjun K.",
    role: "Medical Volunteer",
    category: "Health",
    categoryColor: "bg-red-500",
    image: "yoyo.jpeg",
  },
]

export function VolunteerHomePage() {

  const router = useRouter()

  const storiesRef = useRef<HTMLDivElement>(null)
  const eventsRef = useRef<HTMLDivElement>(null)

  // --- Dynamic State ---
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [myEvents, setMyEvents] = useState<any[]>([])

  const [stats, setStats] = useState({
    eventsThisWeek: 0,
    impactScore: 0,
    hoursContributed: 0,
    supportedCauses: [] as string[],
    completedEvents: 0,
    upcomingEvents: 0,
    attendance: 0
  })

  // --- Fetch Data ---
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // 1. Auth Check (This does NOT affect your other cookies)
        const { data: { user }, error } = await supabase.auth.getUser()

        if (!user || error) {
          router.push('/login')
          return
        }

        // 2. Onboarding check — redirect if not completed
        const profileCheck = await api.getUserProfile().catch(() => null)
        if (profileCheck?.userType === 'volunteer' && profileCheck?.profile?.onboarding_completed === false) {
          router.push('/onboarding')
          return
        }

        // 3. Start Loading State
        setLoading(true)

        // 3. Fetch Data (Your exact original API calls)
        const [profileRes, eventsRes] = await Promise.all([
          api.getUserProfile(),
          api.getMyRegistrations()
        ])

        const userProfile = profileRes?.profile || {}
        const allEvents = eventsRes.events || []

        setProfile(userProfile)

        const displayList = allEvents.filter((ev: any) => ev.registration_status === 'registered');
        setMyEvents(displayList)

        // --- STATS CALCULATION (Your exact original logic) ---
        let totalHours = 0
        let completed = 0
        let upcomingCount = 0
        let missed = 0
        let thisWeek = 0
        const categoriesSet = new Set<string>()

        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const nextWeek = new Date(now)
        nextWeek.setDate(now.getDate() + 7)
        nextWeek.setHours(23, 59, 59, 999)

        allEvents.forEach((ev: any) => {
          if (ev.category) categoriesSet.add(ev.category)

          const evDate = new Date(ev.event_date)
          evDate.setHours(0, 0, 0, 0)

          const status = ev.registration_status;
          const isCompleted = status === 'completed';
          const isCheckedIn = status === 'checked_in';
          const isMissed = status === 'missed';

          if (isCompleted || isCheckedIn) {
            totalHours += eventHours(ev.start_time, ev.end_time);
            completed += 1
          }

          if (evDate >= now && status === 'registered') {
            upcomingCount += 1
          }

          if (isMissed) {
            missed += 1;
          }

          if (evDate >= now && evDate <= nextWeek) {
            thisWeek += 1
          }
        })

        const totalScorable = completed + missed;
        const attendanceRate = totalScorable > 0
          ? Math.round((completed / totalScorable) * 100)
          : 100;

        setStats({
          hoursContributed: Math.round(totalHours * 100) / 100,
          eventsThisWeek: thisWeek,
          impactScore: Math.round((totalHours * 10) + (completed * 50)),
          supportedCauses: Array.from(categoriesSet),
          completedEvents: completed,
          upcomingEvents: upcomingCount,
          attendance: attendanceRate
        })

      } catch (error) {
        console.error("Failed to load volunteer data", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [router])

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
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
    return map[category?.toLowerCase()] || "bg-gray-500"
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD"
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ""
    const [h] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12} ${ampm}`
  }

  const scrollStories = (direction: "left" | "right") => {
    if (storiesRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400
      storiesRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0066cc] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-black relative">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#fef5f0] dark:from-black via-[#fff8f5] dark:via-black to-[#f5fcf8] dark:to-black py-8 md:py-16 overflow-hidden">
        {/* Ambient glow behind the greeting — white instead of indigo, to
            match the landing page hero. Uses its own top-to-transparent
            fade (not just a blurred blob) so it dies out to nothing well
            before the section's bottom edge — that's what makes the
            transition into the (fully opaque, un-tinted) Events section
            below look seamless instead of hitting a visible clip line.
            The content below is wrapped in its own `relative` div, which is
            load-bearing: without it, this absolute+no-z-index glow paints
            ABOVE the plain static heading/text per CSS stacking rules and
            washes them out (bit us on the landing page hero). */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] max-w-[200vw] bg-gradient-to-b from-white/70 dark:from-white/15 to-transparent blur-3xl pointer-events-none"
        />

        {/* Decorative Icons */}
        <div className="absolute top-4 left-4 md:top-8 md:left-20 w-8 h-8 md:w-12 md:h-12 bg-card rounded-xl shadow-lg flex items-center justify-center">
          <Heart className="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" />
        </div>
        <div className="absolute top-10 right-6 md:top-16 md:right-32 w-8 h-8 md:w-12 md:h-12 bg-card rounded-xl shadow-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" />
        </div>
        <div className="absolute bottom-14 left-6 md:bottom-20 md:left-32 w-8 h-8 md:w-12 md:h-12 bg-card rounded-xl shadow-lg flex items-center justify-center">
          <Users className="w-4 h-4 md:w-5 md:h-5 text-[#0066cc]" />
        </div>
        <div className="absolute bottom-8 right-4 md:bottom-12 md:right-20 w-8 h-8 md:w-12 md:h-12 bg-card rounded-xl shadow-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-full shadow-sm mb-4 md:mb-6 max-w-full">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <span className="text-[11px] md:text-[13px] text-foreground font-medium truncate">
              {stats.supportedCauses.length > 0
                ? `Supporting ${stats.supportedCauses.slice(0, 2).map(formatLabel).join(', ')}${stats.supportedCauses.length > 2 ? '...' : ''}`
                : "Start your journey today!"}
            </span>
          </div>
          <h1 className="text-[24px] md:text-[56px] font-bold text-foreground dark:text-white tracking-tight leading-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-[#ff6b6b] via-[#f59e0b] to-[#10b981] bg-clip-text text-transparent">
              {profile?.full_name?.split(' ')[0] || "Volunteer"}
            </span>
            .
          </h1>
          <p className="text-[14px] md:text-[19px] text-muted-foreground dark:text-neutral-400 mt-2 md:mt-3">
            Ready to spread some kindness today in <span className="text-foreground dark:text-white font-semibold">{profile?.city || "your city"}</span>?
          </p>

          <div className="flex justify-center gap-2 md:gap-4 mt-6 md:mt-8">
            <ScrollReveal delay={0}>
              <Card className="gap-0 px-3 md:px-6 py-3 md:py-4">
                <p className="text-[18px] md:text-[28px] font-bold text-[#ff6b6b]">
                  {stats.eventsThisWeek}
                </p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Events This Week</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <Card className="gap-0 px-3 md:px-6 py-3 md:py-4">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-[18px] md:text-[28px] font-bold text-[#f59e0b]">
                    {stats.impactScore}
                  </p>
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b] fill-current" />
                </div>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Impact Score</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.16}>
              <Card className="gap-0 px-3 md:px-6 py-3 md:py-4">
                <p className="text-[18px] md:text-[28px] font-bold text-[#10b981]">
                  {formatHoursTotal(stats.hoursContributed)}
                </p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Hours Contributed</p>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

{/* Main Event Feed */}
      <section className="bg-muted dark:bg-black py-6 md:py-12 relative overflow-hidden">
        {/* Ambient side glow — this section's own dominant color (the blue
            used on the "Registered" badge below), on the right to alternate
            with Hero's own glow before it. */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#0066cc]/[0.05] dark:bg-[#0066cc]/[0.1] rounded-full blur-3xl pointer-events-none"
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <ScrollReveal>
            <div className="mb-4 md:mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-[20px] md:text-[36px] font-bold text-foreground dark:text-white tracking-tight">Registered Events</h2>
                <p className="text-[12px] md:text-[15px] text-muted-foreground dark:text-neutral-400 mt-0.5">Find your next way to make a difference</p>
              </div>
            </div>
          </ScrollReveal>

          {myEvents.length === 0 ? (
            <ScrollReveal delay={0.1}>
              <Card className="text-center py-12 dark:bg-neutral-900/50 dark:backdrop-blur-md dark:border-neutral-800/60 dark:rounded-2xl dark:shadow-none">
                <Calendar className="w-12 h-12 text-muted-foreground dark:text-neutral-500 mx-auto mb-3" />
                <p className="text-muted-foreground dark:text-neutral-400">You don&apos;t have any active registrations.</p>
                <Button
                  asChild
                  variant="nav-pill"
                  className="mt-4 self-center h-9 px-4 text-sm dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border dark:border-white/10 dark:backdrop-blur-md dark:rounded-xl"
                >
                  <Link href="/events">Browse Events</Link>
                </Button>
              </Card>
            </ScrollReveal>
          ) : (
            <ScrollReveal delay={0.1}>
            <div
              ref={eventsRef}
              /* Added items-stretch to force all cards in the row to be the exact same height */
              className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide items-stretch"
            >
              {myEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}/registered`}
                  /* Added flex flex-col and self-stretch to fix Safari/iOS rendering bugs */
                  className="shrink-0 w-64 md:w-auto snap-start group bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl md:rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 hover:shadow-lg hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col self-stretch"
                >
                  {/* Swapped aspect-4/3 to bulletproof 16:9 aspect ratio container */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted shrink-0">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-muted-foreground">
                        <Sparkles className="w-10 h-10" />
                      </div>
                    )}

                    <div className={cn("absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] md:text-[11px] font-semibold text-white capitalize z-10", getCategoryColor(event.category))}>
                      {event.category}
                    </div>
                  </div>

                  {/* Added flex-1 and flex-col so the content area expands to fill empty space */}
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <h3 className="text-[13px] md:text-[15px] font-semibold text-foreground dark:text-white mb-1.5 line-clamp-1">{event.title}</h3>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground dark:text-neutral-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] md:text-[12px]">{formatDate(event.event_date)} • {formatTime(event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground dark:text-neutral-400">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[10px] md:text-[12px] line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    {/* Added mt-auto and slightly more top padding to align badges at the absolute bottom */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      <div className={cn("text-[10px] md:text-[11px] font-medium px-2 py-1 rounded-full", "bg-blue-100 dark:bg-blue-500/15 text-blue-700")}>
                        Registered
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Impact Section — Bento Grid: one hero highlight (ring + totals + CTA)
          spanning 2x2, four supporting stat cells filling the rest. */}
      <section className="bg-gradient-to-br from-[#f0fdf4] dark:from-black via-[#ecfdf5] dark:via-black to-[#d1fae5] dark:to-black py-8 md:py-16 relative overflow-hidden">
        {/* Ambient side glow — this section's own dominant color (the
            emerald used throughout the ring/CTA below), on the left to
            alternate with the Event Feed's right. */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#10b981]/[0.06] dark:bg-[#10b981]/[0.12] rounded-full blur-3xl pointer-events-none"
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <ScrollReveal>
            <h2 className="text-[24px] md:text-[40px] font-bold text-foreground dark:text-white tracking-tight mb-6 md:mb-10">Your Impact.</h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 md:auto-rows-[minmax(140px,_auto)]">
            {/* Hero cell */}
            <ScrollReveal delay={0} className="col-span-2 md:row-span-2">
              <Card className="h-full p-6 md:p-8 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                <div className="relative w-28 h-28 md:w-40 md:h-40 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#d1fae5" strokeWidth="10" className="dark:stroke-neutral-800" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(Math.min(stats.hoursContributed, 20) / 20) * 264} 264`}
                      className="dark:stroke-emerald-500/80 dark:stroke-[6]"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[28px] md:text-[40px] font-bold text-[#10b981]">{formatHoursTotal(stats.hoursContributed)}</span>
                    <span className="text-[11px] md:text-[13px] text-muted-foreground dark:text-neutral-400">hours</span>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-[18px] md:text-[26px] font-bold text-foreground dark:text-white">{formatHoursTotal(stats.hoursContributed)} Volunteer Hours</h3>
                  <p className="text-[13px] md:text-[15px] text-muted-foreground dark:text-neutral-400 mt-0.5">Total Contribution</p>
                  <p className="text-[13px] md:text-[15px] text-foreground dark:text-neutral-300 mt-3 max-w-md">You&apos;re making a real difference in {profile?.city || "Nashik"}. Keep up the amazing work!</p>

                  <Link
                    href="/volunteer-impact"
                    className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#10b981] text-white rounded-full font-semibold text-sm hover:bg-[#059669] transition-all shadow-sm shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border dark:border-white/10 dark:rounded-xl dark:shadow-none dark:hover:shadow-none"
                  >
                    View Full Impact Report <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            </ScrollReveal>

            {/* Supporting stat cells */}
            <ScrollReveal delay={0.1}>
              <Card className="h-full p-3 md:p-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-800/5 dark:bg-neutral-800/50 flex items-center justify-center mb-2">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" />
                </div>
                <p className="text-[20px] md:text-[28px] font-bold text-foreground dark:text-white">{stats.completedEvents}</p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Events Completed</p>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={0.15}>
              <Card className="h-full p-3 md:p-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-800/5 dark:bg-neutral-800/50 flex items-center justify-center mb-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#0066cc]" />
                </div>
                <p className="text-[20px] md:text-[28px] font-bold text-foreground dark:text-white">{stats.upcomingEvents}</p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Upcoming Events</p>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <Card className="h-full p-3 md:p-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-800/5 dark:bg-neutral-800/50 flex items-center justify-center mb-2">
                  <Award className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" />
                </div>
                <p className="text-[20px] md:text-[28px] font-bold text-foreground dark:text-white">{formatHoursTotal(stats.hoursContributed)}</p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Total Hours</p>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <Card className="h-full p-3 md:p-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-800/5 dark:bg-neutral-800/50 flex items-center justify-center mb-2">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-[#a855f7]" />
                </div>
                <p className="text-[20px] md:text-[28px] font-bold text-foreground dark:text-white">{stats.attendance}%</p>
                <p className="text-[10px] md:text-[12px] text-muted-foreground dark:text-neutral-400">Attendance</p>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stories Section */}
      <section className="bg-gradient-to-br from-[#fef7f0] dark:from-black via-[#fef5f0] dark:via-black to-[#fdf2f8] dark:to-black py-8 md:py-16 overflow-hidden relative">
        {/* Ambient side glow — this section's own dominant color (the pink
            its base gradient fades into), on the right to alternate with
            the Impact section's left. */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#ec4899]/[0.05] dark:bg-[#ec4899]/[0.1] rounded-full blur-3xl pointer-events-none"
        />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[20px] md:text-[36px] font-bold text-foreground dark:text-white">Archives.</h2>
              <div className="flex gap-2">
                <button onClick={() => scrollStories('left')} className="w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:bg-muted dark:bg-neutral-900/50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/60 dark:text-white"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => scrollStories('right')} className="w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:bg-muted dark:bg-neutral-900/50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/60 dark:text-white"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div ref={storiesRef} className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide scroll-smooth snap-x">
              {stories.map(story => (
                <div key={story.id} className="min-w-[320px] md:min-w-100 snap-center bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md border border-neutral-200/60 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 rounded-2xl hover:scale-[1.015] hover:-translate-y-0.5 transition-all duration-300 ease-out overflow-hidden flex flex-col">
                  <div className="h-64 md:h-80 shrink-0">
                    <img src={story.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <Quote className="w-6 h-6 text-muted-foreground mb-4" />
                    <p className="text-foreground italic">&quot;{story.quote}&quot;</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-[#1d1d1f] dark:bg-black py-10 md:py-20 overflow-hidden">
        {/* Bottom-anchored glow, same corner/color as the footer's glow just
            below it — the two fades meet right at the CTA/footer boundary so
            the transition reads as one continuous glow, not two separately
            clipped ones (this section is an "always-dark" band regardless
            of theme, so the glow isn't gated behind `dark:`). */}
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
        {/* Navy ambient glow accent — meets the CTA section's glow above it
            at the shared boundary (same corner/width), so together they read
            as one continuous glow instead of two separately clipped ones. */}
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
                href="https://in.linkedin.com/company/teamkindly"
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
            <span className="whitespace-nowrap">team@kindly.co.in</span>
            <span className="whitespace-nowrap">+91 7517018954</span>
            <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="w-3 h-3" /> Nashik, India</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default VolunteerHomePage