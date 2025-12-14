"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft,
  Users,
  Check,
  Clock,
  Search,
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  Send,
  QrCode,
  Sparkles,
  Heart,
} from "lucide-react"
import { api } from "@/lib/api"

type MissionTab = "roster" | "broadcast" | "settings"

export function OrgEventDetail() {
  const params = useParams()
  const eventId = params?.id as string

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missionTab, setMissionTab] = useState<MissionTab>("roster")
  const [volunteerSearch, setVolunteerSearch] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [checkedInVolunteers, setCheckedInVolunteers] = useState<number[]>([])

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await api.getEventById(eventId)
        setEvent(response.event)
      } catch (err: any) {
        setError(err.message || 'Failed to load event')
        console.error('Error fetching event:', err)
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const toggleCheckIn = (volunteerId: number) => {
    setCheckedInVolunteers((prev) =>
      prev.includes(volunteerId) ? prev.filter((id) => id !== volunteerId) : [...prev, volunteerId],
    )
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Format time helper
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error || 'Event not found'}</p>
          <Link
            href="/org-events"
            className="text-sm text-teal-600 hover:underline"
          >
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  // Placeholder volunteers (since we don't have registrations table yet)
  const volunteers: any[] = []
  const filteredRoster = volunteers.filter((v: any) =>
    v.name.toLowerCase().includes(volunteerSearch.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-linear-to-br from-[#f0f7ff] via-white to-[#f0fdf4] overflow-x-hidden">
      {/* Floating decorative icons */}
      <div className="fixed top-20 left-8 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center pointer-events-none md:flex">
        <Heart className="w-5 h-5 text-[#ff6b6b]" />
      </div>
      <div className="fixed top-32 right-16 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center pointer-events-none md:flex">
        <Sparkles className="w-5 h-5 text-[#f59e0b]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4">
          <Link
            href="/org-events"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{event.title}</h1>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 md:px-8 py-4 bg-linear-to-b from-teal-50/50 to-transparent">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
            <Users className="w-3.5 h-3.5 text-teal-500" />
            <span className="font-medium text-gray-700">{event.registered_count} Registered</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-gray-700">{event.checked_in_count} Checked In</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium text-gray-700">{event.total_slots - event.registered_count} Slots Left</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { key: "roster", label: "Roster", icon: Users },
              { key: "broadcast", label: "Broadcast", icon: MessageSquare },
              { key: "settings", label: "Settings", icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMissionTab(tab.key as MissionTab)}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  missionTab === tab.key ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 pb-32">
        <div className="max-w-5xl mx-auto">
          {/* Roster Tab */}
          {missionTab === "roster" && (
            <div className="py-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search volunteers..."
                  value={volunteerSearch}
                  onChange={(e) => setVolunteerSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {volunteers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No volunteers registered yet</p>
                  <p className="text-gray-400 text-xs mt-1">Volunteers will appear here once they register</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRoster.map((volunteer: any) => (
                    <div
                      key={volunteer.id}
                      className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 bg-linear-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white font-semibold">
                          {volunteer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm md:text-base">{volunteer.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <button className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-teal-50 flex items-center justify-center hover:bg-teal-100 transition-colors">
                              <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 text-teal-600" />
                            </button>
                            <button className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors">
                              <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleCheckIn(volunteer.id)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                          checkedInVolunteers.includes(volunteer.id)
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {checkedInVolunteers.includes(volunteer.id) ? "Checked In" : "Check In"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Broadcast Tab */}
          {missionTab === "broadcast" && (
            <div className="py-4 space-y-4">
              <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Message</label>
                <textarea
                  placeholder="Send a message to all registered volunteers..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
                <button className="mt-3 w-full h-11 bg-linear-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:shadow-md transition-shadow">
                  <Send className="w-4 h-4" />
                  Send Broadcast
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-3 px-1">Previous Messages</p>
                <div className="text-center py-8 bg-white rounded-xl">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No messages sent yet</p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {missionTab === "settings" && (
            <div className="py-4 space-y-4">
              <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-4">Event Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Date & Time</p>
                      <p className="text-gray-900 font-medium">
                        {formatDate(event.event_date)} • {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Location</p>
                      <p className="text-gray-900 font-medium">{event.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Capacity</p>
                      <p className="text-gray-900 font-medium">{event.total_slots} volunteer slots</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex-1 h-11 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                  Edit Event
                </button>
                <button className="flex-1 h-11 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                  Cancel Event
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Scan QR Button */}
      <button className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-linear-to-br from-emerald-500 to-teal-500 text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all z-40">
        <QrCode className="w-6 h-6 md:w-7 md:h-7" />
      </button>
    </div>
  )
}