"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, ChevronRight, Loader2, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { api } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD"
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ""
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }

  // This handles the smooth scroll back to the hero section
  const handleSignUpClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (window.location.pathname === '/' || window.location.pathname === '') {
      const heroSection = document.querySelector('#hero') || document.querySelector('main')
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      router.push('/#hero')
    }
  }

  return (
    // Boosted mobile padding for better breathing room
    <section id="events" className="bg-gradient-to-b from-purple-50 dark:from-black to-purple-100 dark:to-black py-20 md:py-32 overflow-hidden relative">
      {/* Ambient side glow — this section's own dominant color (the purple
          "Events" accent), on the left to alternate with How It Works's right. */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-purple-600/[0.07] dark:bg-purple-500/[0.12] rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative">

        {/* Header - Centered on mobile for better balance */}
        <ScrollReveal className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-16 gap-4">
          <div>
            <p className="text-purple-600 text-[12px] md:text-sm font-medium mb-1 md:mb-2 uppercase tracking-wide">Events</p>
            <h2 className="text-[28px] md:text-5xl font-semibold text-foreground dark:text-white tracking-tight leading-tight">
              Explore upcoming
              <br className="hidden md:block" />
              <span> opportunities.</span>
            </h2>
          </div>
          {/* Desktop View All Link */}
          <div className="hidden md:block">
            <Button
              onClick={handleSignUpClick}
              variant="outline"
              className="inline-flex items-center text-purple-600 text-sm hover:underline bg-transparent border-0 hover:bg-transparent p-0"
            >
              view all events
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          /* MOBILE CAROUSEL MAGIC:
             - items-stretch ensures all cards in the row match the tallest card's height
             DESKTOP BENTO: first event spans 2 columns (featured), rest are 1x1 —
             grid auto-placement handles any event count gracefully.
          */
          <div
            className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none md:grid-cols-4 gap-4 md:gap-5 pb-8 -mx-6 px-6 md:mx-0 md:px-0 items-stretch"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hides default scrollbar
          >
            {events.length > 0 ? (
              events.map((event, index) => (
                <Card
                  key={event.id}
                  /* CARD MAGIC:
                     - self-stretch completely fixes the iOS Safari height bug
                  */
                  className={cn(
                    "w-[85vw] sm:w-[300px] md:w-auto shrink-0 snap-center md:snap-none group p-0 gap-0 overflow-hidden hover:shadow-xl hover:shadow-purple-600/10 transition-all duration-300 hover:border-purple-600/20 flex flex-col self-stretch",
                    index === 0 && "md:col-span-2"
                  )}
                >
                  {/* Fixed height (not aspect-ratio) so the bento-featured wider
                      first card doesn't inflate its image height and stretch
                      the whole grid row to match — every card's image band
                      stays the same height regardless of column span. */}
                  <Link href={`/events/${event.id}`} className="h-44 md:h-48 w-full overflow-hidden bg-muted block shrink-0 relative">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                  </Link>

                  {/* Content: Boosted padding to p-5 for mobile */}
                  <CardContent className="p-5 flex flex-col flex-1">
                    <Link href={`/events/${event.id}`}>
                      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3 line-clamp-2 hover:text-purple-600 transition-colors">
                        {event.title}
                      </h3>
                    </Link>

                    <div className="space-y-2 md:space-y-1.5 mb-5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-neutral-400">
                        <Calendar className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" />
                        <span className="truncate">{formatDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-neutral-400">
                        <Clock className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" />
                        <span>{formatTime(event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-neutral-400">
                        <MapPin className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      {event.connect_plan && (
                        <div className="flex items-center gap-2 text-sm">
                          <Coffee className="w-4 h-4 md:w-3.5 md:h-3.5 text-amber-500 shrink-0" />
                          <span className="text-amber-700 font-medium truncate">The After: {event.connect_plan}</span>
                        </div>
                      )}
                    </div>

                    {/* mt-auto pushes everything below it to the very bottom, keeping buttons aligned perfectly */}
                    <div className="mt-auto pt-2">
                      {event.registered_count > 0 && (
                        <div className="mb-4 md:mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-500/15 text-purple-700">
                            {event.registered_count} registered
                          </span>
                        </div>
                      )}

                      {/* Button: Increased height to h-11 on mobile for better tap accessibility */}
                      <Button
                        onClick={handleSignUpClick}
                        variant="outline-pill"
                        className="w-full h-11 md:h-9 text-sm text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white active:scale-[0.98]"
                      >
                        Sign up to book
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm font-medium">
                No upcoming events found.
              </div>
            )}
          </div>
        )}

        {/* Mobile View All Link: Styled as a proper footer button for mobile */}
        <div className="md:hidden mt-2 text-center">
          <Button
            onClick={handleSignUpClick}
            variant="outline-pill"
            className="text-purple-600 text-sm font-bold border-purple-100 w-full h-12 shadow-sm"
          >
            View all events
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  )
}