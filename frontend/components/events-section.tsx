"use client"

import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const events = [
  {
    id: 1,
    title: "Beach Cleanup Drive",
    date: "Sat, Dec 14",
    time: "8:00 AM",
    location: "Marina Beach",
    image: "/beach-cleanup-volunteers-ocean.jpg",
  },
  {
    id: 2,
    title: "Food Distribution",
    date: "Sun, Dec 15",
    time: "10:00 AM",
    location: "Community Center",
    image: "/food-distribution-charity-volunteers.jpg",
  },
  {
    id: 3,
    title: "Tree Plantation",
    date: "Sat, Dec 21",
    time: "7:00 AM",
    location: "Central Park",
    image: "/tree-planting-volunteers-nature.jpg",
  },
  {
    id: 4,
    title: "Blood Donation Camp",
    date: "Sun, Dec 22",
    time: "9:00 AM",
    location: "City Hospital",
    image: "/blood-donation-medical-volunteers.jpg",
  },
]

export function EventsSection() {
  const scrollToHero = () => {
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="events" className="bg-linear-to-b from-[#faf5ff] to-[#f5f3ff] py-10 md:py-24">
      <div className="max-w-245 mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-5 md:mb-12">
          <div>
            <p className="text-[#8b5cf6] text-[10px] md:text-sm font-medium mb-1 md:mb-2">Events</p>
            <h2 className="text-[20px] md:text-[48px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
              Explore upcoming
              <br className="hidden md:block" />
              <span className="md:hidden"> </span>opportunities.
            </h2>
          </div>
          <a href="#" className="hidden md:flex items-center text-[#8b5cf6] text-[17px] hover:underline">
            View all events
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-5">
          {events.map((event) => (
            <div
              key={event.id}
              className="group bg-white rounded-xl md:rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#8b5cf6]/10 transition-all duration-300 border border-transparent hover:border-[#8b5cf6]/20"
            >
              {/* Image */}
              <div className="aspect-4/3 overflow-hidden">
                <img
                  src={event.image || "/placeholder.svg"}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Content - smaller on mobile */}
              <div className="p-2.5 md:p-5">
                <h3 className="text-[11px] md:text-[17px] font-semibold text-[#1d1d1f] mb-1.5 md:mb-3 line-clamp-1">
                  {event.title}
                </h3>

                <div className="space-y-0.5 md:space-y-1.5 mb-2.5 md:mb-5">
                  <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[13px] text-[#86868b]">
                    <Calendar className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0" />
                    <span className="truncate">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[13px] text-[#86868b]">
                    <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[13px] text-[#86868b]">
                    <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                <Button
                  onClick={scrollToHero}
                  variant="outline"
                  className="w-full h-7 md:h-9 text-[9px] md:text-[13px] text-[#8b5cf6] border-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white rounded-full bg-transparent px-2 md:px-4"
                >
                  Sign up to book
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="md:hidden mt-4 text-center">
          <a href="#" className="inline-flex items-center text-[#8b5cf6] text-[12px] hover:underline">
            View all events
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
