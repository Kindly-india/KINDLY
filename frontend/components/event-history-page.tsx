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
  Loader2 // Added Loader icon
} from "lucide-react"
import { api } from "@/lib/api"

type FilterType = "all" | "attended" | "missed" | "certificate"

export function EventHistoryPage() {
  // State for dynamic data
  const [historyEvents, setHistoryEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // --- NEW: Fetch Data Logic ---
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        // Ensure you have added getEventHistory to your api.ts file!
        const response = await api.getEventHistory()
        setHistoryEvents(response.history || [])
      } catch (error) {
        console.error("Failed to fetch history", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const filteredEvents = historyEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      activeFilter === "all"
        ? true
        : activeFilter === "attended"
          ? event.status === "attended"
          : activeFilter === "missed"
            ? event.status === "missed"
            : activeFilter === "certificate"
              ? event.hasCertificate
              : true
    return matchesSearch && matchesFilter
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
      case "pending":
        return (
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#fff3e0] text-[#f57c00] text-[9px] md:text-xs font-medium rounded-full">
            Pending
          </span>
        )
      default:
        return null
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5e5e7]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-11 md:h-14 flex items-center justify-between">
          <Link href="/home" className="flex items-center">
            <span className="text-[14px] md:text-[17px] font-bold text-[#1d1d1f] tracking-tight">KINDLY</span>
          </Link>

          <div className="relative">
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
                    href="/history"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-[#f5f5f7] transition-colors"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#2e7d32]" />
                    </div>
                    <span className="text-[12px] md:text-[13px] font-medium text-[#1d1d1f]">Event History</span>
                  </Link>
                </div>
              </>
            )}
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
              onClick={() => event.status === "attended" && setSelectedEvent(event)}
              disabled={event.status !== "attended"}
              className={`w-full bg-white rounded-xl p-3 md:p-4 shadow-sm border border-[#f5f5f7] flex items-center gap-3 md:gap-4 text-left transition-all ${
                event.status === "attended" ? "hover:shadow-md hover:border-[#e5e5e7] cursor-pointer" : "opacity-80"
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
                {event.hasCertificate && event.status === "attended" && (
                  <span className="inline-flex items-center gap-1 text-[9px] md:text-[11px] text-[#b8860b] mt-0.5">
                    <Download className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    Certificate
                  </span>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-1 md:gap-2">
                {getStatusBadge(event.status, event.hasCertificate)}
                {event.status === "attended" && <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#86868b]" />}
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

      {/* Post-Event Summary Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#f5f5f7] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between rounded-t-2xl">
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

                  <div className="relative aspect-video rounded-xl border-2 border-[#d4af37] bg-gradient-to-br from-[#fefcf8] via-white to-[#fefcf8] p-4 md:p-6 shadow-lg overflow-hidden">
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#d4af37]" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#d4af37]" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#d4af37]" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#d4af37]" />

                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-1 md:space-y-2">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center mb-1">
                        <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-white" />
                      </div>

                      <h5 className="text-[10px] md:text-sm font-serif text-[#86868b] tracking-wide">
                        Certificate of Volunteering
                      </h5>

                      <p className="text-[11px] md:text-base font-medium text-[#1d1d1f]">Presented to</p>

                      <p className="text-sm md:text-xl font-bold text-[#1d1d1f]">Volunteer Name</p>

                      <p className="text-[9px] md:text-xs text-[#86868b] max-w-[90%]">
                        For contributing{" "}
                        <span className="font-semibold text-[#2e7d32]">{selectedEvent.hours} Hours</span> at
                      </p>

                      <p className="text-[10px] md:text-sm font-semibold text-[#1d1d1f]">{selectedEvent.title}</p>

                      <div className="pt-2 md:pt-3 text-[8px] md:text-[10px] text-[#86868b]">
                        <p>Signed by President, {selectedEvent.org}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    <button className="h-10 md:h-11 bg-gradient-to-r from-[#0066cc] to-[#0077ed] rounded-xl text-[13px] md:text-[14px] font-semibold text-white shadow-lg shadow-[#0066cc]/25 hover:shadow-xl hover:shadow-[#0066cc]/30 transition-all flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download PDF
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