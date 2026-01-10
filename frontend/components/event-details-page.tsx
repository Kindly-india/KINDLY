"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Share2,
  Heart,
  Clock,
  MapPin,
  Footprints,
  User,
  CheckCircle2,
  Navigation,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await api.getPublicEventById(eventId)
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

  // Handle registration
  const handleBookSlot = async () => {
    try {
      setIsRegistering(true)

      // Check if user is logged in
      const user = await api.getCurrentUser()
      if (!user) {
        alert('Please login to register for events')
        router.push('/login')
        return
      }

      await api.registerForEvent(eventId)

      // Update local state
      setIsRegistered(true)
      setEvent((prev: any) => ({
        ...prev,
        registered_count: prev.registered_count + 1
      }))

      alert('Successfully registered for the event! 🎉')
    } catch (err: any) {
      if (err.message.includes('login')) {
        router.push('/login')
      } else {
        alert(err.message || 'Failed to register for event')
      }
    } finally {
      setIsRegistering(false)
    }
  }

  // Format helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
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
          <Link href="/events" className="text-sm text-blue-600 hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }


  const isRegistrationOpen = event?.registration_deadline ? new Date(event.registration_deadline) > new Date() : true // ADD THIS LINE
  const slotsLeft = event.total_slots - event.registered_count
  const isFull = slotsLeft <= 0
  const canRegister = isRegistrationOpen && !isFull && !isRegistered // ADD THIS LINE

  const shortDescription = event.description?.length > 150
    ? event.description.slice(0, 150) + "..."
    : event.description


  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      {/* Desktop Layout Container */}
      <div className="md:flex md:max-w-6xl md:mx-auto md:gap-8 md:py-8 md:px-6">
        {/* Left Content Column */}
        <div className="md:flex-1">
          {/* Hero Image with Overlay Navigation */}
          <div className="relative">
            <div className="relative h-70 md:h-100 md:rounded-2xl md:overflow-hidden">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Calendar className="w-16 h-16 text-gray-400" />
                </div>
              )}

              {/* Overlay Navigation Buttons */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                {/* Back Button */}
                <Link href="/events">
                  <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-800" />
                  </button>
                </Link>

                {/* Share & Save Buttons */}
                <div className="flex gap-2">
                  <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                    <Share2 className="w-4 h-4 md:w-5 md:h-5 text-gray-800" />
                  </button>
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-gray-800"}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Title & Main Info Block */}
          <div className="px-4 md:px-0 pt-5 pb-4">
            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">{event.title}</h1>

            {/* Badges Row */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full capitalize">
                {event.category}
              </span>
              {event.is_urgent && (
                <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Urgent
                </span>
              )}
            </div>

            {/* Organizer Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-semibold">
                  {event.organization_profiles?.name?.charAt(0) || 'O'}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-900">
                    {event.organization_profiles?.name || 'Organization'}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Know Before You Go Grid */}
          <div className="px-4 md:px-0 pb-5">
            <div className="bg-[#F5F5F7] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Know Before You Go</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Date & Time */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <Clock className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">When</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(event.event_date)} • {formatTime(event.start_time)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <MapPin className="w-4 h-4 text-coral-500" style={{ color: "#FF6B6B" }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Where</p>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-30">{event.location}</p>
                  </div>
                </div>

                {/* Dress Code */}
                {event.dress_code && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Footprints className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Dress</p>
                      <p className="text-sm font-medium text-gray-900">{event.dress_code}</p>
                    </div>
                  </div>
                )}

                {/* Age Limit */}
                {event.minimum_age && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Age</p>
                      <p className="text-sm font-medium text-gray-900">{event.minimum_age}+ Only</p>
                    </div>
                  </div>
                )}
              </div>

              {/* --- ADDED MAP PREVIEW --- */}
              <div className="rounded-lg overflow-hidden h-32 relative group border border-gray-200">
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
                    Get Directions
                  </div>
                </a>
              </div>

            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="px-4 md:px-0 pb-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">About This Event</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {showFullDescription ? event.description : shortDescription}
              </p>
              {event.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-1"
                >
                  {showFullDescription ? "Show Less" : "Read More"}
                </button>
              )}
            </div>
          )}

          {/* Things to Bring */}
          {event.things_to_bring && (
            <div className="px-4 md:px-0 pb-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Things to Bring</h3>
              <p className="text-sm text-gray-600">{event.things_to_bring}</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Desktop Booking Card */}
        <div className="hidden md:block md:w-85">
          <div className="sticky top-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  {!isFull && (
                    <p className="text-xs text-red-500 font-medium mb-0.5">
                      Only {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left!
                    </p>
                  )}
                  <p className="text-2xl font-bold text-gray-900">{formatDate(event.event_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Starts at</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(event.start_time)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{event.registered_count} joined</span>
                  <span>{event.total_slots} total</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all"
                    style={{ width: `${(event.registered_count / event.total_slots) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <Button
                onClick={handleBookSlot}
                disabled={isRegistering || !canRegister}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-full text-base shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering ? 'Booking...'
                  : isRegistered ? 'Registered ✓'
                    : !isRegistrationOpen ? 'Registration Closed'
                      : isFull ? 'Event Full'
                        : 'Book Your Slot'}
              </Button>

              <p className="text-center text-xs text-gray-500 mt-3">
                {isFull ? 'No slots available' : 'Free to join • Instant confirmation'}
              </p>

              {!isRegistrationOpen && (
                <p className="text-center text-xs text-red-600 mt-2">
                  Registration closed on {new Date(event.registration_deadline).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              )}
            </div>

            {/* Card Footer */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <Calendar className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs font-medium text-amber-800">Add to Calendar</p>
                  <p className="text-xs text-amber-600">Get reminded before the event</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            {!isFull && (
              <p className="text-xs text-red-500 font-medium">{slotsLeft} Slot{slotsLeft !== 1 ? 's' : ''} Left</p>
            )}
            <p className="text-base font-bold text-gray-900">{formatDate(event.event_date)}</p>
          </div>
          <Button
            onClick={handleBookSlot}
            disabled={isRegistering || !canRegister}
            className="h-11 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-full text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {isRegistering ? 'Booking...'
              : isRegistered ? 'Registered ✓'
                : !isRegistrationOpen ? 'Closed'
                  : isFull ? 'Full'
                    : 'Book Slot'}
          </Button>
        </div>
      </div>
    </div>
  )
}