"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  ChevronRight,
  X,
  Download,
  Trophy,
  Menu,
  Sparkles,
  Loader2
} from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// ✅ Updated: Removed 'certificate' from types
type FilterType = "all" | "attended" | "missed" | "registered"

export function EventHistoryPage() {
  const router = useRouter()

  const [historyEvents, setHistoryEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [menuOpen, setMenuOpen] = useState(false)

  const [profile, setProfile] = useState<any>(null)
  const [volunteerName, setVolunteerName] = useState("Volunteer")

  // --- Helper to Calculate Exact Hours ---
  const calculateExactHours = (start: string, end: string) => {
    if (!start || !end) return "0";
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTotalMins = (startH * 60) + startM;
    const endTotalMins = (endH * 60) + endM;

    const diffMins = Math.max(0, endTotalMins - startTotalMins);
    const hours = diffMins / 60;

    return parseFloat(hours.toFixed(1));
  }

  // --- Fetch Data Logic ---
  useEffect(() => {
    const fetchHistory = async () => {
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

        const [profileRes, response] = await Promise.all([
          api.getUserProfile(),
          api.getVolunteerRegistrations()
        ])

        if (profileRes?.profile) {
          setProfile(profileRes.profile)
          if (profileRes.profile.full_name) {
            setVolunteerName(profileRes.profile.full_name)
          }
        }

        const formattedEvents = response.events.map((ev: any) => ({
          id: ev.id,
          title: ev.title,
          date: new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          image: ev.cover_image_url,
          location: ev.location,
          status: mapBackendStatusToUI(ev.registration_status, ev.status),
          org: ev.organization_profiles?.name || "Organizer",
          hours: calculateExactHours(ev.start_time, ev.end_time),
          hasCertificate: !!ev.certificates_issued && (ev.registration_status === 'completed' || ev.registration_status === 'checked_in')
        }))

        setHistoryEvents(formattedEvents)
      } catch (error) {
        console.error("Failed to fetch history", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [router]) // Make sure to add router here

  // ✅ UPDATED: Maps 'absent' from DB directly to 'missed' in UI
  const mapBackendStatusToUI = (regStatus: string, eventStatus: string) => {
    if (regStatus === 'completed' || regStatus === 'checked_in') return 'attended';
    
    // ✅ Logic for Missed Events
    if (regStatus === 'absent' || regStatus === 'cancelled') return 'missed';
    
    if (regStatus === 'registered') return 'registered';
    return 'pending';
  }

  const filteredEvents = historyEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "attended") return matchesSearch && event.status === "attended";
    if (activeFilter === "missed") return matchesSearch && event.status === "missed";
    if (activeFilter === "registered") return matchesSearch && event.status === "registered";

    return matchesSearch
  })

  const getStatusBadge = (status: string, hasCertificate: boolean) => {
    if (status === "attended" && hasCertificate) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 bg-[#FFFBEB] text-[#B45309] text-[9px] md:text-xs font-semibold rounded-full">
          <Trophy className="w-2.5 h-2.5 md:w-3 md:h-3" />
          Certificate Ready
        </span>
      )
    }

    switch (status) {
      case "attended":
        return (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#e8f5e9] text-[#2e7d32] text-[9px] md:text-xs font-medium rounded-full">
            Attended
          </span>
        )
      case "missed":
        return (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#f5f5f5] text-[#86868b] text-[9px] md:text-xs font-medium rounded-full">
            Missed
          </span>
        )
      case "registered":
        return (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-blue-50 text-blue-600 text-[9px] md:text-xs font-medium rounded-full">
            Registered
          </span>
        )
      default:
        return null
    }
  }

  const handlePrint = () => {
    window.print();
  }

  const displayImage = profile?.avatar_url || profile?.logo_url
  const displayName = profile?.full_name || profile?.name || "User"
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] overflow-x-hidden">
      
      <main className="max-w-[600px] mx-auto px-4 md:px-6 py-4 md:py-8">
        <h1 className="text-xl md:text-3xl font-bold text-[#1d1d1f] mb-4 md:mb-6">Event History</h1>

        <div className="relative mb-3 md:mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#86868b]" />
          <input
            type="text"
            placeholder="Search past events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 md:h-12 pl-9 md:pl-11 pr-4 bg-white rounded-xl text-[13px] md:text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] border border-[#e5e5e7] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] transition-all"
          />
        </div>

        {/* ✅ UPDATED: Removed Certificate Filter Button */}
        <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${activeFilter === "all"
              ? "bg-[#1d1d1f] text-white"
              : "bg-white text-[#1d1d1f] border border-[#e5e5e7] hover:border-[#86868b]"
              }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("registered")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${activeFilter === "registered"
              ? "bg-blue-50 text-blue-600 border border-blue-200"
              : "bg-white text-blue-600 border border-blue-100 hover:border-blue-300"
              }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveFilter("attended")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${activeFilter === "attended"
              ? "bg-[#e8f5e9] text-[#2e7d32] border border-[#2e7d32]"
              : "bg-white text-[#2e7d32] border border-[#c8e6c9] hover:border-[#2e7d32]"
              }`}
          >
            Attended
          </button>
          <button
            onClick={() => setActiveFilter("missed")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${activeFilter === "missed"
              ? "bg-[#f5f5f5] text-[#86868b] border border-[#86868b]"
              : "bg-white text-[#86868b] border border-[#e5e5e7] hover:border-[#86868b]"
              }`}
          >
            Missed
          </button>
        </div>

        <div className="space-y-2 md:space-y-3">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => {
                if (event.status === "attended" || event.hasCertificate) {
                  window.location.href = `/events/${event.id}/showcase`;
                }
              }}
              disabled={event.status === "missed" || event.status === "registered"}
              className={`w-full bg-white rounded-xl p-3 md:p-4 shadow-sm border border-[#f5f5f7] flex items-center gap-3 md:gap-4 text-left transition-all ${(event.status === "attended" || event.hasCertificate) ? "hover:shadow-md hover:border-[#e5e5e7] cursor-pointer" : "opacity-90 cursor-default"
                }`}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img
                  src={event.image || "/placeholder.svg"}
                  alt={event.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-[13px] md:text-[15px] font-semibold text-[#1d1d1f] truncate">{event.title}</h3>
                <p className="text-[11px] md:text-[13px] text-[#86868b]">{event.date}</p>
                {event.hasCertificate && (
                  <span className="inline-flex items-center gap-1 text-[9px] md:text-[11px] text-[#b8860b] mt-0.5">
                    <Download className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    Certificate
                  </span>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-1 md:gap-2">
                {getStatusBadge(event.status, event.hasCertificate)}
                {(event.status === "attended" || event.hasCertificate) && <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#86868b]" />}
              </div>
            </button>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#86868b] text-sm">No events found</p>
          </div>
        )}
      </main>
    </div>
  )
}