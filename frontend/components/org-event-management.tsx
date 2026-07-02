"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronLeft,
  Heart,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  Hourglass, // Added for pending state
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import Image from "next/image"

type EventTab = "pending" | "active" | "completed" | "cancelled"

interface Event {
  id: string
  title: string
  description: string
  cover_image_url: string | null
  category: string
  event_date: string
  start_time: string
  end_time: string
  location: string
  total_slots: number
  registered_count: number
  checked_in_count: number
  status: string // 'pending', 'published', 'completed', 'cancelled'
  created_at: string
}

export function OrgEventManagement() {
  const router = useRouter()
  const pathname = usePathname()

  // --- Navbar State ---
  const [profile, setProfile] = useState<any>(null)

  // --- Page State ---
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<EventTab>("active") // Default to active
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [eventsRes, profileRes] = await Promise.all([
        api.getMyEvents(),
        api.getUserProfile()
      ])

      setEvents(eventsRes.events || [])
      setProfile(profileRes?.profile || null)

    } catch (err: any) {
      setError(err.message || 'Failed to load data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingEventId(eventId)
      await api.cancelEvent(eventId)
      const response = await api.getMyEvents()
      setEvents(response.events || [])
      alert('Event cancelled successfully')
    } catch (err: any) {
      alert(err.message || 'Failed to cancel event')
    } finally {
      setDeletingEventId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour} ${ampm}`
  }

  const isEventCompleted = (event: Event) => {
    const eventDate = new Date(event.event_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return eventDate < today || event.status === 'completed'
  }

  const getRegistrationPercentage = (event: Event) => {
    if (!event.total_slots) return 0
    return Math.round((event.registered_count / event.total_slots) * 100)
  }

  // Navbar Helper
  const isActive = (path: string) =>
    pathname === path ? "text-[#0066cc] font-medium" : "text-foreground hover:text-[#0066cc]"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const pendingEvents = events.filter(e => e.status === 'pending')
  const activeEvents = events.filter(e => e.status === 'published' && !isEventCompleted(e))
  const completedEvents = events.filter(e => e.status === 'completed' || (e.status === 'published' && isEventCompleted(e)))
  const cancelledEvents = events.filter(e => e.status === 'cancelled')

  let displayEvents: Event[] = []
  if (activeTab === "pending") displayEvents = pendingEvents
  else if (activeTab === "active") displayEvents = activeEvents
  else if (activeTab === "cancelled") displayEvents = cancelledEvents
  else displayEvents = completedEvents

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-blue-50/10 via-white dark:via-background to-green-50 dark:to-green-50/10 pb-24">

      <div className="fixed top-20 left-8 w-12 h-12 bg-card rounded-xl shadow-lg hidden md:flex items-center justify-center pointer-events-none">
        <Heart className="w-5 h-5 text-red-400" />
      </div>
      <div className="fixed top-32 right-16 w-12 h-12 bg-card rounded-xl shadow-lg hidden md:flex items-center justify-center pointer-events-none">
        <Sparkles className="w-5 h-5 text-amber-500" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 md:py-8 relative">
        <Link href="/org-home" className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 md:mb-4">
          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">My Events</h1>
          <p className="text-[13px] md:text-base text-muted-foreground">Manage your volunteering events</p>
        </div>

        {/* --- UPDATED TABS WITH PENDING SECTION --- */}
        <div className="flex gap-2 md:gap-3 mb-4 md:mb-6 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-medium text-[12px] md:text-sm transition-all whitespace-nowrap ${activeTab === "pending"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-card text-muted-foreground border border-border md:border-transparent hover:bg-muted"
              }`}
          >
            Pending {pendingEvents.length > 0 && `(${pendingEvents.length})`}
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-medium text-[12px] md:text-sm transition-all whitespace-nowrap ${activeTab === "active"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-card text-muted-foreground border border-border md:border-transparent hover:bg-muted"
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-medium text-[12px] md:text-sm transition-all whitespace-nowrap ${activeTab === "completed"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-card text-muted-foreground border border-border md:border-transparent hover:bg-muted"
              }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`px-4 py-1.5 md:px-6 md:py-2.5 rounded-full font-medium text-[12px] md:text-sm transition-all whitespace-nowrap ${activeTab === "cancelled"
                ? "bg-red-500 text-white shadow-md"
                : "bg-card text-red-500 border border-red-100 md:border-transparent hover:bg-red-50 dark:bg-red-500/15"
              }`}
          >
            Cancelled Drops {cancelledEvents.length > 0 && `(${cancelledEvents.length})`}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/15 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Event List */}
        {displayEvents.length === 0 ? (
          <div className="text-center py-10 md:py-16 bg-card rounded-2xl shadow-sm border border-border">
            {activeTab === "pending" ? (
              <Hourglass className="w-10 h-10 md:w-16 md:h-16 text-amber-300 mx-auto mb-3 md:mb-4" />
            ) : (
              <Calendar className="w-10 h-10 md:w-16 md:h-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
            )}
            <h3 className="text-[15px] md:text-lg font-semibold text-foreground mb-1.5 md:mb-2">
              No {activeTab === "cancelled" ? "cancelled" : activeTab} events
            </h3>
            <p className="text-[13px] md:text-sm text-muted-foreground mb-5 md:mb-6">
              {activeTab === "pending"
                ? "When you create an event, it will appear here for review."
                : activeTab === "active"
                ? "Create your first event to get started!"
                : activeTab === "cancelled"
                ? "No events have been cancelled. Keep it up!"
                : "Your completed events will appear here"}
            </p>
            {activeTab === "active" && (
              <Link
                href="/org-events/create"
                className="inline-flex items-center gap-2 px-5 py-2 md:px-6 md:py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-[13px] md:text-base font-medium hover:shadow-lg transition-shadow"
              >
                Create Event
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 md:space-y-4">
            {displayEvents.map((event) => (
              <div
                key={event.id}
                className="bg-card rounded-2xl md:rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  
                  {/* Desktop Image */}
                  <div className="hidden md:flex w-48 bg-gradient-to-br from-teal-400 to-emerald-400 items-center justify-center shrink-0">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Calendar className="w-12 h-12 text-white/50" />
                    )}
                  </div>

                  <div className="flex-1 p-3.5 md:p-6">
                    <div className="flex gap-3 md:gap-0 md:block items-start mb-0 md:mb-3">
                      
                      {/* Mobile Image Thumbnail */}
                      <div className="w-16 h-16 md:hidden rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Calendar className="w-6 h-6 text-white/50" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1 md:mb-2">
                          <h3 className="text-[15px] md:text-xl font-bold text-foreground truncate leading-tight mt-0.5 md:mt-0">
                            {event.title}
                          </h3>
                          
                          {/* --- UPDATED STATUS BADGES --- */}
                          <span className={cn(
                            "px-2 py-0.5 md:px-3 md:py-1 text-[9px] md:text-xs font-bold rounded-full shrink-0 border uppercase tracking-wider",
                            event.status === 'pending'
                              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-600 border-amber-100"
                              : event.status === 'cancelled'
                              ? "bg-red-50 dark:bg-red-500/15 text-red-500 border-red-100"
                              : (event.status === 'completed' || isEventCompleted(event))
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 border-emerald-100"
                          )}>
                            {event.status === 'pending'
                              ? 'Pending Review'
                              : event.status === 'cancelled'
                              ? 'Cancelled'
                              : (event.status === 'completed' || isEventCompleted(event))
                              ? 'Completed'
                              : 'Published'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-[11px] md:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5 truncate">
                            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{formatDate(event.event_date)} • {formatTime(event.start_time)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 md:mb-4 mt-3 md:mt-0">
                      <div className="flex items-center justify-between text-[11px] md:text-sm mb-1.5 md:mb-2">
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{event.registered_count}</span>/{event.total_slots} Registered
                        </span>
                        <span className="font-bold text-teal-600">
                          {getRegistrationPercentage(event)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all rounded-full"
                          style={{ width: `${getRegistrationPercentage(event)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 md:gap-2">
                      <Link
                        href={activeTab === "completed"
                          ? `/org-events/${event.id}/report`
                          : `/org-events/${event.id}`}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-teal-50 dark:bg-teal-500/15 text-teal-600 rounded-lg text-[11px] md:text-sm font-semibold hover:bg-teal-100 dark:bg-teal-500/15 transition-colors inline-flex items-center gap-1.5 md:gap-2 border border-teal-100/50"
                      >
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        View
                      </Link>

                      {/* Edit only available for pending events */}
                      {(activeTab === "pending" || event.status === 'pending') && (
                        <Link
                          href={`/edit-event/${event.id}`}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 dark:bg-blue-500/15 text-blue-600 rounded-lg text-[11px] md:text-sm font-semibold hover:bg-blue-100 dark:bg-blue-500/15 transition-colors inline-flex items-center gap-1.5 md:gap-2 border border-blue-100/50"
                        >
                          <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          Edit
                        </Link>
                      )}

                      {/* Cancel only available for active and pending events */}
                      {(activeTab === "active" || activeTab === "pending") && (
                        <button
                          onClick={() => handleCancelEvent(event.id)}
                          disabled={deletingEventId === event.id}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-red-50 dark:bg-red-500/15 text-red-600 rounded-lg text-[11px] md:text-sm font-semibold hover:bg-red-100 dark:bg-red-500/15 transition-colors inline-flex items-center gap-1.5 md:gap-2 disabled:opacity-50 border border-red-100/50 ml-auto md:ml-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          {deletingEventId === event.id ? "Wait..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}