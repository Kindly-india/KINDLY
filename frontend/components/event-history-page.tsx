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
  Loader2,
} from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { downloadFromUrl } from "@/lib/utils"

type FilterType = "all" | "attended" | "missed" | "cancelled" | "registered"

export function EventHistoryPage() {
  const router = useRouter()

  const [historyEvents, setHistoryEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [menuOpen, setMenuOpen] = useState(false)

  const [profile, setProfile] = useState<any>(null)
  const [volunteerName, setVolunteerName] = useState("Volunteer")

  // cert_id keyed by event_id
  const [certMap, setCertMap] = useState<Record<string, string>>({})
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

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

        const [profileRes, response, certRes] = await Promise.all([
          api.getUserProfile(),
          api.getVolunteerRegistrations(),
          api.getMyCertificates().catch(() => ({ certificates: [] })),
        ])

        if (profileRes?.profile) {
          setProfile(profileRes.profile)
          if (profileRes.profile.full_name) {
            setVolunteerName(profileRes.profile.full_name)
          }
        }

        // Build a map of event_id -> certificate_id
        const map: Record<string, string> = {}
        for (const cert of certRes.certificates) {
          map[cert.event_id] = cert.id
        }
        setCertMap(map)

        const formattedEvents = response.events.map((ev: any) => ({
          id: ev.id,
          title: ev.title,
          date: new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          image: ev.cover_image_url,
          location: ev.location,
          status: mapBackendStatusToUI(ev.registration_status, ev.event_date, ev.end_time, ev.status),
          // True when the event itself was cancelled by the org (not by the volunteer)
          cancelledByHost: ev.status === 'cancelled',
          org: ev.organization_profiles?.name || "Organizer",
          hours: calculateExactHours(ev.start_time, ev.end_time),
          certId: map[ev.id] || null,
          event_date: ev.event_date,
          start_time: ev.start_time,
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

  const mapBackendStatusToUI = (regStatus: string, eventDate: string, endTime: string, eventStatus?: string) => {
    if (regStatus === 'completed' || regStatus === 'checked_in') return 'attended';
    if (regStatus === 'cancelled') return 'cancelled';
    // 'missed' or 'absent' = org explicitly marked no-show
    if (regStatus === 'missed' || regStatus === 'absent') return 'missed';
    // Org cancelled the event — never the volunteer's fault, treat as cancelled
    if (eventStatus === 'cancelled') return 'cancelled';
    if (regStatus === 'registered') {
      // If the event has already ended AND the event was not cancelled, treat as missed
      if (eventDate && endTime) {
        const eventEnd = new Date(`${eventDate}T${endTime}`)
        if (eventEnd < new Date()) return 'missed'
      }
      return 'registered';
    }
    return 'pending';
  }

  const filteredEvents = historyEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeFilter === "all") return matchesSearch;
    return matchesSearch && event.status === activeFilter;
  })

  const getStatusBadge = (status: string, cancelledByHost?: boolean) => {
    switch (status) {
      case "attended":
        return (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#e8f5e9] text-[#2e7d32] text-[9px] md:text-xs font-medium rounded-full">
            Attended
          </span>
        )
      case "missed":
        return (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-orange-50 text-orange-600 text-[9px] md:text-xs font-medium rounded-full">
            Missed
          </span>
        )
      case "cancelled":
        return cancelledByHost ? (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-red-50 text-red-500 text-[9px] md:text-xs font-medium rounded-full">
            Cancelled by Host
          </span>
        ) : (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#f5f5f5] text-[#86868b] text-[9px] md:text-xs font-medium rounded-full">
            Cancelled
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

  const isWithin24Hours = (eventDate: string, startTime: string) => {
    if (!eventDate || !startTime) return false
    const eventStart = new Date(`${eventDate}T${startTime}`)
    return eventStart.getTime() - Date.now() < 24 * 60 * 60 * 1000
  }

  const handleCancelRsvp = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to cancel your registration?')) return
    setCancellingId(eventId)
    try {
      await api.cancelRsvp(eventId)
      setHistoryEvents(prev => prev.filter(ev => ev.id !== eventId))
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration')
    } finally {
      setCancellingId(null)
    }
  }

  const handleDownload = async (e: React.MouseEvent, certId: string) => {
    e.stopPropagation()
    setDownloadingCertId(certId)
    try {
      const { signedUrl } = await api.downloadCertificate(certId)
      await downloadFromUrl(signedUrl, 'kindly-certificate.pdf')
    } catch (err: any) {
      alert(err.message || "Failed to get download link")
    } finally {
      setDownloadingCertId(null)
    }
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
              ? "bg-orange-50 text-orange-600 border border-orange-300"
              : "bg-white text-orange-600 border border-orange-100 hover:border-orange-300"
              }`}
          >
            Missed
          </button>
          <button
            onClick={() => setActiveFilter("cancelled")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${activeFilter === "cancelled"
              ? "bg-[#f5f5f5] text-[#86868b] border border-[#86868b]"
              : "bg-white text-[#86868b] border border-[#e5e5e7] hover:border-[#86868b]"
              }`}
          >
            Cancelled
          </button>
        </div>

        <div className="space-y-2 md:space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="w-full bg-white rounded-xl p-3 md:p-4 shadow-sm border border-[#f5f5f7] flex items-center gap-3 md:gap-4 transition-all hover:shadow-md hover:border-[#e5e5e7]"
            >
              <button
                onClick={() => { if (event.status === "attended") window.location.href = `/events/${event.id}/showcase` }}
                disabled={event.status === "missed" || event.status === "registered" || event.status === "cancelled"}
                className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 text-left disabled:cursor-default"
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
                </div>
              </button>

              <div className="flex-shrink-0 flex items-center gap-2">
                {getStatusBadge(event.status, event.cancelledByHost)}
                {event.certId ? (
                  <button
                    onClick={(e) => handleDownload(e, event.certId)}
                    disabled={downloadingCertId === event.certId}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] md:text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {downloadingCertId === event.certId
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Download className="w-3 h-3" />
                    }
                    Certificate
                  </button>
                ) : event.status === "registered" ? (
                  isWithin24Hours(event.event_date, event.start_time) ? (
                    <span
                      title="Less than 24 hours to the event. Contact the organiser directly for emergency cancellations."
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-400 text-[10px] md:text-xs font-semibold rounded-lg cursor-not-allowed select-none"
                    >
                      🔒 Locked
                    </span>
                  ) : (
                    <button
                      onClick={(e) => handleCancelRsvp(e, event.id)}
                      disabled={cancellingId === event.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] md:text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {cancellingId === event.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <X className="w-3 h-3" />
                      }
                      Cancel
                    </button>
                  )
                ) : (
                  event.status === "attended" && (
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#86868b]" />
                  )
                )}
              </div>
            </div>
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