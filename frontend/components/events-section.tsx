"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function EventsSection() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.getTopEvents()
        setEvents(response.events || [])
      } catch (error) {
        console.error("Failed to load events", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Helper to format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD"
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Helper to format time
  const formatTime = (timeStr: string) => {
    if (!timeStr) return ""
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }

  // Handle sign up button click
  const handleSignUpClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Check if we're on the home page
    if (window.location.pathname === '/' || window.location.pathname === '') {
      // Scroll to hero section (signup area)
      const heroSection = document.querySelector('#hero') || document.querySelector('main')
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // Navigate to home page with hash
      router.push('/#hero')
    }
  }

  return (
    <section id="events" className="bg-gradient-to-b from-purple-50 to-purple-100 py-10 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 md:mb-12">
          <div>
            <p className="text-purple-600 text-xs md:text-sm font-medium mb-1 md:mb-2">Events</p>
            <h2 className="text-xl md:text-5xl font-semibold text-gray-900 tracking-tight leading-tight">
              Explore upcoming
              <br className="hidden md:block" />
              <span className="md:hidden"> </span>opportunities.
            </h2>
          </div>
          <Link href="/events">
            <Button
              variant="outline"
              className="inline-flex items-center text-purple-600 text-xs hover:underline bg-transparent border-0 hover:bg-transparent"
            >
              view all events
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-5">
            {events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="group bg-white rounded-xl md:rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-purple-600/10 transition-all duration-300 border border-transparent hover:border-purple-600/20 flex flex-col"
                >
                  {/* Image - Clickable to details */}
                  <Link href={`/events/${event.id}`} className="aspect-4/3 overflow-hidden bg-gray-100 block">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-2.5 md:p-5 flex flex-col flex-1">
                    <Link href={`/events/${event.id}`}>
                      <h3 className="text-xs md:text-lg font-semibold text-gray-900 mb-1.5 md:mb-3 line-clamp-2 hover:text-purple-600 transition-colors">
                        {event.title}
                      </h3>
                    </Link>

                    <div className="space-y-0.5 md:space-y-1.5 mb-2.5 md:mb-5">
                      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
                        <Calendar className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0" />
                        <span className="truncate">{formatDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
                        <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0" />
                        <span>{formatTime(event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
                        <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Registered count badge */}
                    {event.registered_count > 0 && (
                      <div className="mb-2 md:mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          {event.registered_count} registered
                        </span>
                      </div>
                    )}

                    {/* Sign up button that scrolls to signup section */}
                    <button
                      onClick={handleSignUpClick}
                      className="mt-auto w-full h-7 md:h-9 text-xs md:text-sm text-purple-600 border border-purple-600 hover:bg-purple-600 hover:text-white rounded-full bg-transparent px-2 md:px-4 transition-colors"
                    >
                      Sign up to book
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                No upcoming events found.
              </div>
            )}
          </div>
        )}

        {/* Mobile View All Link */}
        <div className="md:hidden mt-4 text-center">
          <Link href="/events">
            <Button
              variant="outline"
              className="inline-flex items-center text-purple-600 text-xs hover:underline bg-transparent border-0"
            >
              view all events
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}