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
  Menu, // Added for Navbar
  X,    // Added for Navbar
  BarChart3 // Added for Navbar
} from "lucide-react"
import { api } from "@/lib/api"

type EventTab = "active" | "completed"

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
  status: string
  created_at: string
}

export function OrgEventManagement() {
  const router = useRouter()
  const pathname = usePathname()
  
  // --- Navbar State ---
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  // --- Page State ---
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<EventTab>("active")
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch both Events AND Profile (for the navbar)
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
      // Refresh only events
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
    return Math.round((event.registered_count / event.total_slots) * 100)
  }

  // Navbar Helper: Check active link
  const isActive = (path: string) => 
    pathname === path ? "text-[#0066cc] font-medium" : "text-[#1d1d1f] hover:text-[#0066cc]"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const activeEvents = events.filter(e => !isEventCompleted(e) && e.status !== 'cancelled')
  const completedEvents = events.filter(e => isEventCompleted(e) || e.status === 'completed')
  const displayEvents = activeTab === "active" ? activeEvents : completedEvents

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      
      {/* --- INTEGRATED NAVBAR START --- */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#f5f5f7]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-12 md:h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/org-home" className="flex items-center">
            <span className="text-[15px] md:text-[17px] font-bold text-[#1d1d1f] tracking-tight">KINDLY</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-6">
            <Link href="/org-events" className={`text-[13px] md:text-[15px] transition-colors ${isActive('/org-events')}`}>
              My Events
            </Link>
            <Link href="/social" className={`text-[13px] md:text-[15px] transition-colors ${isActive('/social')}`}>
              Social
            </Link>
            <Link href="/org-analytics" className={`text-[13px] md:text-[15px] transition-colors ${isActive('/org-analytics')}`}>
              Analytics
            </Link>
          </div>

          {/* Desktop Profile Icon */}
          <Link href={`/organizations/${profile?.id}`} className="hidden md:block">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#f5f5f7] hover:ring-[#0066cc] transition-all bg-gray-100 flex items-center justify-center text-[#0066cc] font-bold">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span>{profile?.name?.charAt(0) || "O"}</span>
              )}
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <div className="relative md:hidden">
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5 text-[#1d1d1f]" /> : <Menu className="w-5 h-5 text-[#1d1d1f]" />}
            </button>
            
            {/* Mobile Dropdown */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-56 bg-white rounded-xl shadow-xl border border-[#e5e5e7] overflow-hidden">
                  <Link href={`/organizations/${profile?.id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#f5f5f7] bg-gray-100 flex items-center justify-center">
                       {profile?.logo_url ? (
                          <img src={profile.logo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{profile?.name?.charAt(0) || "O"}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-[#1d1d1f]">View Profile</span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{profile?.name}</span>
                    </div>
                  </Link>

                  <Link href="/org-events" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#0284c7]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">My Events</span>
                  </Link>
                  <Link href="/org-volunteers" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#2e7d32]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Volunteers</span>
                  </Link>
                  <Link href="/org-analytics" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f3e8ff] to-[#d8b4fe] flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#9333ea]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Analytics</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
      {/* --- INTEGRATED NAVBAR END --- */}

      {/* Decorative Background Elements */}
      <div className="fixed top-20 left-8 w-12 h-12 bg-white rounded-xl shadow-lg hidden md:flex items-center justify-center pointer-events-none">
        <Heart className="w-5 h-5 text-red-400" />
      </div>
      <div className="fixed top-32 right-16 w-12 h-12 bg-white rounded-xl shadow-lg hidden md:flex items-center justify-center pointer-events-none">
        <Sparkles className="w-5 h-5 text-amber-500" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 relative">
        <Link href="/org-home" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">Manage your volunteering events</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
              activeTab === "active"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${
              activeTab === "completed"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Completed
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Event List */}
        {displayEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {activeTab} events
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === "active" 
                ? "Create your first event to get started!" 
                : "Your completed events will appear here"}
            </p>
            {activeTab === "active" && (
              <Link
                href="/create-event"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
              >
                Create Event
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 h-48 md:h-auto bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center shrink-0">
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

                  <div className="flex-1 p-5 md:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900">
                            {event.title}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                             event.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {event.status === 'completed' || isEventCompleted(event) ? 'Completed' : 'Published'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.event_date)} • {formatTime(event.start_time)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">
                          {event.registered_count}/{event.total_slots} Registered
                        </span>
                        <span className="font-medium text-teal-600">
                          {getRegistrationPercentage(event)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                          style={{ width: `${getRegistrationPercentage(event)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={activeTab === "completed" 
                          ? `/org-events/${event.id}/report` 
                          : `/org-events/${event.id}`}
                        className="px-4 py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors inline-flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Link>
                      
                      {activeTab === "active" && (
                        <>
                          <Link
                            href={`/edit-event/${event.id}`}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Link>
                          
                          <button
                            onClick={() => handleCancelEvent(event.id)}
                            disabled={deletingEventId === event.id}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingEventId === event.id ? "Cancelling..." : "Cancel Event"}
                          </button>
                        </>
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