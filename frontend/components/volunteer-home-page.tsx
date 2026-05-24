"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
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
    image: "disha.jpg",
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
    image: "IMG_7299.JEPG",
  },
  {
    id: 5,
    quote: "You come for the cause. You stay for the people.",
    author: "Neha Gupta",
    role: "Elderly Care Assistant",
    image: "IMG_8180.JPG",
  },
  {
    id: 6,
    quote: "Stay for the events. Live for the afters.",
    author: "Dr. Arjun K.",
    role: "Medical Volunteer",
    category: "Health",
    categoryColor: "bg-red-500",
    image: "dclassic 2024-08-04 213104.880.JPG",
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

  // --- Helper to Calculate Exact Hours (with minutes) ---
  const calculateExactHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTotalMins = (startH * 60) + startM;
    const endTotalMins = (endH * 60) + endM;

    const diffMins = Math.max(0, endTotalMins - startTotalMins);
    return diffMins / 60;
  }

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
            const eventHours = calculateExactHours(ev.start_time, ev.end_time);
            totalHours += (eventHours > 0 ? eventHours : 1);
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
          hoursContributed: parseFloat(totalHours.toFixed(1)),
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
    const [h, m] = timeStr.split(':')
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

  const displayImage = profile?.avatar_url || profile?.logo_url
  const displayName = profile?.full_name || profile?.name || "User"
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U"

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0066cc] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#fef5f0] via-[#fff8f5] to-[#f5fcf8] py-8 md:py-16 overflow-hidden">
        {/* Decorative Icons */}
        <div className="absolute top-4 left-4 md:top-8 md:left-20 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Heart className="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" />
        </div>
        <div className="absolute top-10 right-6 md:top-16 md:right-32 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" />
        </div>
        <div className="absolute bottom-14 left-6 md:bottom-20 md:left-32 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Users className="w-4 h-4 md:w-5 md:h-5 text-[#0066cc]" />
        </div>
        <div className="absolute bottom-8 right-4 md:bottom-12 md:right-20 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm mb-4 md:mb-6 max-w-full">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <span className="text-[11px] md:text-[13px] text-[#1d1d1f] font-medium truncate">
              {stats.supportedCauses.length > 0
                ? `Supporting ${stats.supportedCauses.slice(0, 2).join(', ')}${stats.supportedCauses.length > 2 ? '...' : ''}`
                : "Start your journey today!"}
            </span>
          </div>
          <h1 className="text-[24px] md:text-[56px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-[#ff6b6b] via-[#f59e0b] to-[#10b981] bg-clip-text text-transparent">
              {profile?.full_name?.split(' ')[0] || "Volunteer"}
            </span>
            .
          </h1>
          <p className="text-[14px] md:text-[19px] text-[#86868b] mt-2 md:mt-3">
            Ready to spread some kindness today in <span className="text-[#1d1d1f] font-semibold">{profile?.city || "your city"}</span>?
          </p>

          <div className="flex justify-center gap-2 md:gap-4 mt-6 md:mt-8">
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <p className="text-[18px] md:text-[28px] font-bold text-[#ff6b6b]">
                {stats.eventsThisWeek}
              </p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Events This Week</p>
            </div>
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <div className="flex items-center justify-center gap-1">
                <p className="text-[18px] md:text-[28px] font-bold text-[#f59e0b]">
                  {stats.impactScore}
                </p>
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b] fill-current" />
              </div>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Impact Score</p>
            </div>
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <p className="text-[18px] md:text-[28px] font-bold text-[#10b981]">
                {stats.hoursContributed}
              </p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Hours Contributed</p>
            </div>
          </div>
        </div>
      </section>

{/* Main Event Feed */}
      <section className="bg-[#f5f5f7] py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-4 md:mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-[20px] md:text-[36px] font-bold text-[#1d1d1f] tracking-tight">Registered Events</h2>
              <p className="text-[12px] md:text-[15px] text-[#86868b] mt-0.5">Find your next way to make a difference</p>
            </div>
          </div>

          {myEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">You don't have any active registrations.</p>
              <Link href="/events" className="mt-4 inline-block px-6 py-2 bg-[#0066cc] text-white rounded-full font-medium text-sm">
                Browse Events
              </Link>
            </div>
          ) : (
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
                  className="shrink-0 w-64 md:w-auto snap-start group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col self-stretch"
                >
                  {/* Swapped aspect-4/3 to bulletproof 16:9 aspect ratio container */}
                  <div className="relative aspect-video aspect-[16/9] w-full overflow-hidden bg-gray-100 shrink-0">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-300">
                        <Sparkles className="w-10 h-10" />
                      </div>
                    )}

                    <div className={cn("absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] md:text-[11px] font-semibold text-white capitalize z-10", getCategoryColor(event.category))}>
                      {event.category}
                    </div>
                  </div>
                  
                  {/* Added flex-1 and flex-col so the content area expands to fill empty space */}
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <h3 className="text-[13px] md:text-[15px] font-semibold text-[#1d1d1f] mb-1.5 line-clamp-1">{event.title}</h3>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[#86868b]">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] md:text-[12px]">{formatDate(event.event_date)} • {formatTime(event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#86868b]">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[10px] md:text-[12px] line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                    
                    {/* Added mt-auto and slightly more top padding to align badges at the absolute bottom */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f5f5f7]">
                      <div className={cn("text-[10px] md:text-[11px] font-medium px-2 py-1 rounded-full", "bg-blue-100 text-blue-700")}>
                        Registered
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Impact Section */}
      <section className="bg-gradient-to-br from-[#f0fdf4] via-[#ecfdf5] to-[#d1fae5] py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-[24px] md:text-[40px] font-bold text-[#1d1d1f] tracking-tight mb-6 md:mb-10">Your Impact.</h2>

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="relative w-36 h-36 md:w-56 md:h-56 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#d1fae5" strokeWidth="10" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(Math.min(stats.hoursContributed, 20) / 20) * 264} 264`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[36px] md:text-[56px] font-bold text-[#10b981]">{stats.hoursContributed}</span>
                <span className="text-[12px] md:text-[15px] text-[#86868b]">hours</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-[18px] md:text-[28px] font-bold text-[#1d1d1f]">{stats.hoursContributed} Volunteer Hours</h3>
              <p className="text-[13px] md:text-[15px] text-[#86868b] mt-0.5">Total Contribution</p>
              <p className="text-[13px] md:text-[15px] text-[#1d1d1f] mt-3 max-w-md">You're making a real difference in {profile?.city || "Nashik"}. Keep up the amazing work!</p>

              <Link
                href="/volunteer-impact"
                className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#10b981] text-white rounded-full font-semibold text-sm hover:bg-[#059669] transition-all shadow-sm shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5"
              >
                View Full Impact Report <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8 md:mt-12">
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#ff6b6b]/10 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" />
              </div>
              <p className="text-[20px] md:text-[28px] font-bold text-[#1d1d1f]">{stats.completedEvents}</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Events Completed</p>
            </div>

            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#0066cc]/10 flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#0066cc]" />
              </div>
              <p className="text-[20px] md:text-[28px] font-bold text-[#1d1d1f]">{stats.upcomingEvents}</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Upcoming Events</p>
            </div>

            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center mb-2">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" />
              </div>
              <p className="text-[20px] md:text-[28px] font-bold text-[#1d1d1f]">{stats.hoursContributed}</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Total Hours</p>
            </div>

            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#a855f7]/10 flex items-center justify-center mb-2">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-[#a855f7]" />
              </div>
              <p className="text-[20px] md:text-[28px] font-bold text-[#1d1d1f]">{stats.attendance}%</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Attendance</p>
            </div>

          </div>
        </div>
      </section>

      {/* Stories Section */}
      <section className="bg-gradient-to-br from-[#fef7f0] via-[#fef5f0] to-[#fdf2f8] py-8 md:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[20px] md:text-[36px] font-bold text-[#1d1d1f]">Archives.</h2>
            <div className="flex gap-2">
              <button onClick={() => scrollStories('left')} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => scrollStories('right')} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center hover:bg-gray-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div ref={storiesRef} className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide scroll-smooth snap-x">
            {stories.map(story => (
              <div key={story.id} className="min-w-[320px] md:min-w-100 snap-center bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <div className="h-64 md:h-80 shrink-0">
                  <img src={story.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <Quote className="w-6 h-6 text-gray-300 mb-4" />
                  <p className="text-gray-700 italic">"{story.quote}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#1d1d1f] py-10 md:py-20">
        <div className="max-w-2xl mx-auto px-4 md:px-8 text-center">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center mx-auto mb-4 md:mb-5">
            <Heart className="w-6 h-6 md:w-7 md:h-7 text-white fill-white" />
          </div>
          <h2 className="text-[20px] md:text-[36px] font-bold text-white tracking-tight">
            Ready to make a difference?
          </h2>
          <p className="text-[13px] md:text-[15px] text-[#86868b] mt-2">
            Join thousands of volunteers creating positive change.
          </p>
        </div>
      </section>

      {/* Footer / Contact Section */}
      <footer className="bg-[#1d1d1f] border-t border-[#424245] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            <div>
              <h4 className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="/how-it-works" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="/for-volunteers" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    For Volunteers
                  </a>
                </li>
                <li>
                  <a href="/for-organisations" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    For Organisations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="/company/about" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="/company/careers" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/company/press" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="/resources/blog" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/resources/help-center" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/resources/community" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                Contact
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-[#f5f5f7]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  manasdhivare@gmail.com
                </li>
                <li className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-[#f5f5f7]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  +91 7517018954
                </li>
                <li className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-[#f5f5f7]">
                  <MapPin className="w-3.5 h-3.5" />
                  Nashik, India
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#424245] mt-8 pt-6 text-center">
            <p className="text-[10px] md:text-[12px] text-[#86868b]">© 2025 Kindly. Made with love in Nashik.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default VolunteerHomePage