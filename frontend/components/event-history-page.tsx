"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  ChevronRight,
  X,
  Download,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  Menu,
  Clock,
  Sparkles,
  Trophy,
  Linkedin,
  Loader2
} from "lucide-react"
import { api } from "@/lib/api"

type FilterType = "all" | "attended" | "missed" | "certificate" | "registered"

export function EventHistoryPage() {
  const [historyEvents, setHistoryEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  
  // ✅ Added Profile State
  const [profile, setProfile] = useState<any>(null)
  const [volunteerName, setVolunteerName] = useState("Volunteer")

  // --- Helper to Calculate Exact Hours ---
  const calculateExactHours = (start: string, end: string) => {
    if(!start || !end) return "0";
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
        setLoading(true)
        
        // Fetch Profile & Registrations in parallel
        const [profileRes, response] = await Promise.all([
            api.getUserProfile(),
            api.getVolunteerRegistrations()
        ])

        // ✅ Set Profile State
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
            
            // Allows Certificate if 'Checked In' OR 'Completed'
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
  }, [])

  // Helper: Map Backend Status to UI Status
  const mapBackendStatusToUI = (regStatus: string, eventStatus: string) => {
      if (regStatus === 'completed') return 'attended';
      if (regStatus === 'missed') return 'missed';
      if (regStatus === 'checked_in') return 'attended'; 
      if (regStatus === 'registered') return 'registered';
      return 'pending';
  }

  const filteredEvents = historyEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "certificate") return matchesSearch && event.hasCertificate;
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

  // ✅ Profile Display Logic
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
      {/* ✅ UPDATED NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5e5e7]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-11 md:h-14 flex items-center justify-between relative">
          
          {/* 1. Logo */}
          <Link href="/home" className="flex items-center shrink-0">
            <Image 
                src="/logo.png" 
                alt="Kindly" 
                width={120} 
                height={40} 
                className="h-8 md:h-10 w-auto" 
                priority 
            />
          </Link>

          {/* 2. Desktop Navigation (Centered) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/events" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">
              Events
            </Link>
            <Link href="/history" className="text-[13px] md:text-[15px] text-[#0066cc] font-semibold transition-colors">
              History
            </Link>
            <Link href="/social" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">
              Social
            </Link>
            <Link href="/volunteer-impact" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium flex items-center gap-1.5">
              Impact
            </Link>
          </div>

          {/* 3. Right Section */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Desktop Profile Avatar */}
            <Link
                href={profile?.id ? `/volunteers/${profile.id}` : '#'}
                className="hidden md:block group"
            >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-gray-200 group-hover:border-gray-400 group-active:scale-95 transition-all bg-gray-50 flex items-center justify-center shadow-sm">
                    {displayImage ? (
                        <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
                            {displayInitial}
                        </span>
                    )}
                </div>
            </Link>

            {/* Mobile Menu Button */}
            <div className="relative md:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
              >
                {menuOpen ? (
                  <X className="w-4 h-4 md:w-5 md:h-5 text-[#1d1d1f]" />
                ) : (
                  <Menu className="w-4 h-4 md:w-5 md:h-5 text-[#1d1d1f]" />
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 md:top-12 z-50 w-44 md:w-48 bg-white rounded-xl shadow-xl border border-[#e5e5e7] overflow-hidden">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]"
                    >
                      <span className="text-[12px] md:text-[13px] font-medium text-[#1d1d1f]">Profile</span>
                    </Link>
                    <Link
                      href="/home"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]"
                    >
                      <span className="text-[12px] md:text-[13px] font-medium text-[#1d1d1f]">Home</span>
                    </Link>
                    <Link
                      href="/events"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]"
                    >
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#fef3c7] to-[#fde68a] flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#f59e0b]" />
                      </div>
                      <span className="text-[12px] md:text-[13px] font-medium text-[#1d1d1f]">Discover Events</span>
                    </Link>
                    <Link
                        href="/volunteer-impact"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-[#f5f5f7] transition-colors"
                    >
                        <span className="text-[12px] md:text-[13px] font-medium text-[#1d1d1f]">Impact</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

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

        <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === "all"
                ? "bg-[#1d1d1f] text-white"
                : "bg-white text-[#1d1d1f] border border-[#e5e5e7] hover:border-[#86868b]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("registered")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === "registered"
                ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-white text-blue-600 border border-blue-100 hover:border-blue-300"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveFilter("attended")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === "attended"
                ? "bg-[#e8f5e9] text-[#2e7d32] border border-[#2e7d32]"
                : "bg-white text-[#2e7d32] border border-[#c8e6c9] hover:border-[#2e7d32]"
            }`}
          >
            Attended
          </button>
          <button
            onClick={() => setActiveFilter("missed")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === "missed"
                ? "bg-[#f5f5f5] text-[#86868b] border border-[#86868b]"
                : "bg-white text-[#86868b] border border-[#e5e5e7] hover:border-[#86868b]"
            }`}
          >
            Missed
          </button>
          <button
            onClick={() => setActiveFilter("certificate")}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === "certificate"
                ? "bg-gradient-to-r from-[#fef9e7] to-[#fff8e1] text-[#b8860b] border border-[#daa520]"
                : "bg-white text-[#b8860b] border border-[#f5deb3] hover:border-[#daa520]"
            }`}
          >
            Certificate Available
          </button>
        </div>

        <div className="space-y-2 md:space-y-3">
          {filteredEvents.map((event) => (
            <button
              key={event.id}
              // Only open modal if Attended/Completed
              onClick={() => (event.status === "attended" || event.hasCertificate) && setSelectedEvent(event)}
              disabled={event.status === "missed" || event.status === "registered"}
              className={`w-full bg-white rounded-xl p-3 md:p-4 shadow-sm border border-[#f5f5f7] flex items-center gap-3 md:gap-4 text-left transition-all ${
                (event.status === "attended" || event.hasCertificate) ? "hover:shadow-md hover:border-[#e5e5e7] cursor-pointer" : "opacity-90 cursor-default"
              }`}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
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

      {/* Post-Event Summary Modal (Only for Attended/Completed) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#f5f5f7] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between rounded-t-2xl z-20">
              <h2 className="text-[15px] md:text-lg font-semibold text-[#1d1d1f]">Event Summary</h2>
              <button
                onClick={() => {
                  setSelectedEvent(null)
                  setRating(0)
                  setReview("")
                }}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-[#86868b]" />
              </button>
            </div>

            <div className="px-4 md:px-6 py-4 md:py-6 space-y-5 md:space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <CheckCircle2 className="w-7 h-7 md:w-10 md:h-10 text-[#2e7d32]" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-[#1d1d1f] mb-1 md:mb-2">You made a difference!</h3>
                <p className="text-[13px] md:text-[15px] text-[#86868b]">
                  You contributed{" "}
                  <span className="text-[#2e7d32] font-bold text-lg md:text-2xl">{selectedEvent.hours} Hours</span> at{" "}
                  {selectedEvent.title}
                </p>
              </div>

              <div className="bg-[#f5f5f7] rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden">
                    <Image
                      src={selectedEvent.image || "/placeholder.svg"}
                      alt={selectedEvent.title}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[13px] md:text-[15px] font-semibold text-[#1d1d1f]">{selectedEvent.title}</h4>
                    <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-[12px] text-[#86868b] mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        {selectedEvent.date}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        {selectedEvent.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedEvent.hasCertificate && (
                <div className="space-y-3 md:space-y-4">
                  <h4 className="text-[13px] md:text-[15px] font-semibold text-[#1d1d1f]">Your Certificate</h4>

                  {/* --- CERTIFICATE DESIGN --- */}
                  <div className="relative aspect-video rounded-xl border-[8px] border-double border-[#1d1d1f] bg-white p-6 shadow-2xl overflow-hidden flex flex-col justify-between text-center select-none">
                    
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {/* Header */}
                    <div className="relative z-10">
                        <div className="flex justify-center mb-2">
                            {/* KINDLY LOGO PLACEHOLDER */}
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black tracking-tighter text-[#1d1d1f]">KINDLY</span>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1d1d1f] mb-1">CERTIFICATE</h2>
                        <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-gray-500">OF VOLUNTEERING</p>
                    </div>

                    {/* Body */}
                    <div className="relative z-10 py-2">
                        <p className="text-[10px] md:text-xs text-gray-500 italic mb-2">This is to certify that</p>
                        <h3 className="text-xl md:text-2xl font-bold text-[#0066cc] mb-2 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                            {volunteerName}
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-600 leading-relaxed max-w-[80%] mx-auto">
                            has successfully completed <span className="font-bold text-[#1d1d1f]">{selectedEvent.hours} Hours</span> of community service at 
                            <br/>
                            <span className="font-bold text-[#1d1d1f]">{selectedEvent.title}</span>
                        </p>
                        <p className="text-[9px] md:text-[10px] text-gray-400 mt-2">
                            {selectedEvent.date} • {selectedEvent.location}
                        </p>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="relative z-10 flex justify-between items-end px-4 mt-2">
                        
                        {/* 1. Kindly Director Signature */}
                        <div className="flex flex-col items-center">
                            <div className="h-8 md:h-10 flex items-end">
                                <span className="font-cursive text-lg md:text-xl text-[#1d1d1f]" style={{ fontFamily: 'cursive' }}>Manas Dhivare</span>
                            </div>
                            <div className="w-20 md:w-24 h-[1px] bg-gray-300 mt-1"></div>
                            <p className="text-[8px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Director, Kindly</p>
                        </div>

                        {/* Seal */}
                        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 opacity-80">
                             <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-emerald-500/50 flex items-center justify-center bg-emerald-50">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                </div>
                             </div>
                        </div>

                        {/* 2. Organization Signature */}
                        <div className="flex flex-col items-center">
                             <div className="h-8 md:h-10 flex items-end justify-center">
                                <span className="font-cursive text-sm text-gray-400 italic">Signed Digitally</span>
                             </div>
                             <div className="w-20 md:w-24 h-[1px] bg-gray-300 mt-1"></div>
                             <p className="text-[8px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Organizer</p>
                        </div>

                    </div>
                  </div>
                  {/* --- END CERTIFICATE DESIGN --- */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    <button onClick={handlePrint} className="h-10 md:h-11 bg-gradient-to-r from-[#0066cc] to-[#0077ed] rounded-xl text-[13px] md:text-[14px] font-semibold text-white shadow-lg shadow-[#0066cc]/25 hover:shadow-xl hover:shadow-[#0066cc]/30 transition-all flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download / Print
                    </button>
                    <button className="h-10 md:h-11 bg-white rounded-xl text-[13px] md:text-[14px] font-semibold text-[#0066cc] border-2 border-[#0066cc] hover:bg-[#0066cc] hover:text-white transition-all flex items-center justify-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      Share on LinkedIn
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-4 md:p-5 border border-[#e5e5e7]">
                <h4 className="text-[13px] md:text-[15px] font-semibold text-[#1d1d1f] mb-1">Rate the Organizer</h4>
                <p className="text-[11px] md:text-[12px] text-[#86868b] mb-3">{selectedEvent.org}</p>

                <div className="flex items-center gap-1 md:gap-2 mb-3 md:mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                      <Star
                        className={`w-7 h-7 md:w-9 md:h-9 ${
                          star <= rating ? "text-[#f59e0b] fill-[#f59e0b]" : "text-[#e5e5e7]"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Write a review (Optional)..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full h-16 md:h-20 p-3 bg-[#f5f5f7] rounded-xl text-[12px] md:text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] resize-none focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                />
              </div>

              <button className="w-full h-11 md:h-12 bg-gradient-to-r from-[#f97316] to-[#fb923c] rounded-xl text-[14px] md:text-[15px] font-semibold text-white shadow-lg shadow-[#f97316]/25 hover:shadow-xl hover:shadow-[#f97316]/30 transition-all">
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}