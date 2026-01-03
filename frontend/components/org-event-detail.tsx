"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
  CheckCircle2,
  Navigation, // Added Navigation icon for the map button
} from "lucide-react"
import { api } from "@/lib/api"

type MissionTab = "roster" | "broadcast" | "settings"

interface Volunteer {
  id: string
  full_name: string
  phone: string
  city: string
  interests: string[]
}

interface Registration {
  id: string
  status: string
  registered_at: string
  checked_in_at: string | null
  volunteer_profiles: Volunteer
}

export function OrgEventDetail() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  const [event, setEvent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missionTab, setMissionTab] = useState<MissionTab>("roster")
  const [volunteerSearch, setVolunteerSearch] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [completeLoading, setCompleteLoading] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        const [eventResponse, registrationsResponse] = await Promise.all([
          api.getEventById(eventId),
          api.getEventRegistrations(eventId),
        ])

        if (eventResponse.event?.status === 'completed') {
          router.replace(`/org-events/${eventId}/report`)
          return
        }

        setEvent(eventResponse.event)
        setRegistrations(registrationsResponse.registrations || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load event')
        console.error('Error fetching event:', err)
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEventData()
    }
  }, [eventId, router])

  const handleCompleteEvent = async () => {
    if (!confirm("Are you sure you want to mark this event as completed? This will generate the impact report.")) return;
    
    try {
      setCompleteLoading(true);
      await api.completeEvent(eventId);
      router.push(`/org-events/${eventId}/report`); 
    } catch (err: any) {
      alert(err.message || "Failed to complete event");
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!confirm('Are you sure you want to cancel this event? This action cannot be undone.')) {
      return
    }

    try {
      setCancelLoading(true)
      await api.cancelEvent(eventId)
      alert('Event cancelled successfully')
      router.push('/org-events')
    } catch (err: any) {
      alert(err.message || 'Failed to cancel event')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCheckIn = async (registrationId: string, currentStatus: string) => {
    try {
      setCheckInLoading(registrationId)
      
      if (currentStatus === 'checked_in') {
        await api.undoCheckIn(eventId, registrationId)
      } else {
        await api.checkInVolunteer(eventId, registrationId)
      }

      const registrationsResponse = await api.getEventRegistrations(eventId)
      setRegistrations(registrationsResponse.registrations || [])
    } catch (err: any) {
      alert(err.message || 'Failed to update check-in status')
    } finally {
      setCheckInLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

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
          <Link href="/org-events" className="text-sm text-teal-600 hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const filteredRoster = registrations.filter((reg) =>
    reg.volunteer_profiles.full_name.toLowerCase().includes(volunteerSearch.toLowerCase())
  )

  const checkedInCount = registrations.filter(reg => reg.status === 'checked_in').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="fixed top-20 left-8 w-12 h-12 bg-white rounded-xl shadow-lg hidden md:flex items-center justify-center pointer-events-none">
        <Heart className="w-5 h-5 text-red-400" />
      </div>
      <div className="fixed top-32 right-16 w-12 h-12 bg-white rounded-xl shadow-lg hidden md:flex items-center justify-center pointer-events-none">
        <Sparkles className="w-5 h-5 text-amber-500" />
      </div>

      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4">
          <Link href="/org-events" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-3">
            <ChevronLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{event.title}</h1>
        </div>
      </div>

      <div className="px-4 md:px-8 py-4 bg-gradient-to-b from-teal-50/50 to-transparent">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2 md:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
            <Users className="w-3.5 h-3.5 text-teal-500" />
            <span className="font-medium text-gray-700">{registrations.length} Registered</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-gray-700">{checkedInCount} Checked In</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium text-gray-700">{event.total_slots - registrations.length} Slots Left</span>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setMissionTab("roster")}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                missionTab === "roster" ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Roster
            </button>
            <button
              onClick={() => setMissionTab("broadcast")}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                missionTab === "broadcast" ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Broadcast
            </button>
            <button
              onClick={() => setMissionTab("settings")}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                missionTab === "settings" ? "bg-white text-teal-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-32">
        <div className="max-w-5xl mx-auto">
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

              {registrations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No volunteers registered yet</p>
                  <p className="text-gray-400 text-xs mt-1">Volunteers will appear here once they register</p>
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No volunteers found</p>
                  <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRoster.map((registration) => (
                    <div key={registration.id} className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white font-semibold">
                          {registration.volunteer_profiles.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm md:text-base">
                            {registration.volunteer_profiles.full_name}
                          </p>
                          <p className="text-xs text-gray-500">{registration.volunteer_profiles.city}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <a 
                              href={`tel:${registration.volunteer_profiles.phone}`}
                              className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-teal-50 flex items-center justify-center hover:bg-teal-100 transition-colors"
                            >
                              <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 text-teal-600" />
                            </a>
                            
                            <a 
                              href={`sms:${registration.volunteer_profiles.phone}`}
                              className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" />
                            </a>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCheckIn(registration.id, registration.status)}
                        disabled={checkInLoading === registration.id}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all disabled:opacity-50 ${
                          registration.status === 'checked_in' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {checkInLoading === registration.id ? "Loading..." : registration.status === 'checked_in' ? "Checked In" : "Check In"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                <button
                  disabled={!broadcastMessage.trim() || registrations.length === 0}
                  className="mt-3 w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:shadow-md transition-shadow disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Send Broadcast
                </button>
                {registrations.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">No volunteers registered yet</p>
                )}
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
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Status</p>
                      <p className="text-gray-900 font-medium capitalize">{event.status}</p>
                    </div>
                  </div>
                </div>

                {/* --- ADDED MAP PREVIEW --- */}
                <div className="mt-4 rounded-xl overflow-hidden h-40 relative group border border-gray-100 bg-gray-50">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      className="absolute inset-0 w-full h-full pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity"
                    ></iframe>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 shadow-sm flex items-center gap-1.5 hover:bg-white transition-colors">
                       <Navigation className="w-3 h-3 text-blue-600" />
                       Open in Maps
                    </div>
                  </a>
                </div>

              </div>

              {event.status !== 'cancelled' && event.status !== 'completed' && (
                <div className="flex flex-col gap-3">
                  {/* Mark as Completed Button */}
                  <button
                    onClick={handleCompleteEvent}
                    disabled={completeLoading}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {completeLoading ? "Completing..." : "Mark as Completed"}
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/edit-event/${eventId}`}
                      className="flex-1 h-11 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center"
                    >
                      Edit Event
                    </Link>
                    <button
                      onClick={handleCancelEvent}
                      disabled={cancelLoading}
                      className="flex-1 h-11 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {cancelLoading ? 'Cancelling...' : 'Cancel Event'}
                    </button>
                  </div>
                </div>
              )}

              {(event.status === 'cancelled' || event.status === 'completed') && (
                <div className="text-center py-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm">
                    This event has been {event.status}
                  </p>
                  {event.status === 'completed' && (
                    <Link 
                      href={`/org-events/${eventId}/report`}
                      className="inline-block mt-2 text-emerald-600 font-medium hover:underline text-sm"
                    >
                      View Report
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl hover:scale-105 transition-all z-40">
        <QrCode className="w-6 h-6 md:w-7 md:h-7" />
      </button>
    </div>
  )
}