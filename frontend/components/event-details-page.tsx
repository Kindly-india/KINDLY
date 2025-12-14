"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
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

export default function EventDetailsPage() {
  const [isSaved, setIsSaved] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const event = {
    id: 1,
    title: "River Godavari Cleanup Drive",
    image: "/river-cleanup-volunteers-garbage-bags-nature.jpg",
    category: "Environment",
    isUrgent: true,
    organizer: {
      name: "Green Earth NGO",
      avatar: "/green-earth-ngo-logo.jpg",
      isVerified: true,
    },
    date: "Sun, 25 Dec",
    time: "07:00 AM",
    location: "College Road Ghat",
    dress: "Wear Sports Shoes",
    ageLimit: "16+ Only",
    description:
      "Join us for a meaningful morning by the banks of River Godavari. We'll be cleaning up plastic waste, debris, and helping restore the natural beauty of our sacred river. All equipment will be provided including gloves, bags, and refreshments. This is a great opportunity to give back to nature and meet like-minded individuals who care about our environment.",
    slotsLeft: 5,
    totalSlots: 25,
    attendees: [
      { name: "Rahul", avatar: "/indian-man-avatar.png" },
      { name: "Priya", avatar: "/indian-woman-avatar.png" },
      { name: "Amit", avatar: "/young-indian-man-avatar.jpg" },
    ],
    totalGoing: 15,
    mapPreview: "/map-preview-college-road-ghat-nashik.jpg",
  }

  const shortDescription = event.description.slice(0, 150) + "..."

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      {/* Desktop Layout Container */}
      <div className="md:flex md:max-w-6xl md:mx-auto md:gap-8 md:py-8 md:px-6">
        {/* Left Content Column */}
        <div className="md:flex-1">
          {/* Hero Image with Overlay Navigation */}
          <div className="relative">
            <div className="relative h-70 md:h-100 md:rounded-2xl md:overflow-hidden">
              <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" priority />

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
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                {event.category}
              </span>
              {event.isUrgent && (
                <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Urgent
                </span>
              )}
            </div>

            {/* Organizer Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={event.organizer.avatar || "/placeholder.svg"}
                    alt={event.organizer.name}
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                </div>
                <Link href="/org-profile" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                  <span className="text-sm font-medium text-gray-900">{event.organizer.name}</span>
                  {event.organizer.isVerified && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />}
                </Link>
              </div>
            </div>
          </div>

          {/* Know Before You Go Grid */}
          <div className="px-4 md:px-0 pb-5">
            <div className="bg-[#F5F5F7] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Know Before You Go</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Date & Time */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <Clock className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">When</p>
                    <p className="text-sm font-medium text-gray-900">
                      {event.date} • {event.time}
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
                    <p className="text-sm font-medium text-gray-900">{event.location}</p>
                  </div>
                </div>

                {/* Dress Code */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <Footprints className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dress</p>
                    <p className="text-sm font-medium text-gray-900">{event.dress}</p>
                  </div>
                </div>

                {/* Age Limit */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="text-sm font-medium text-gray-900">{event.ageLimit}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-4 md:px-0 pb-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">About This Event</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {showFullDescription ? event.description : shortDescription}
            </p>
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-1"
            >
              {showFullDescription ? "Show Less" : "Read More"}
            </button>
          </div>

          {/* Map Preview */}
          <div className="px-4 md:px-0 pb-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Location</h3>
            <div className="relative rounded-xl overflow-hidden">
              <div className="h-40 md:h-50 bg-gray-100">
                <Image
                  src={event.mapPreview || "/placeholder.svg"}
                  alt="Event location map"
                  fill
                  className="object-cover"
                />
              </div>
              <button className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Get Directions</span>
              </button>
            </div>
          </div>

          {/* Social Proof */}
          <div className="px-4 md:px-0 pb-6">
            <div className="flex items-center gap-3 py-4 border-t border-gray-100">
              {/* Avatar Stack */}
              <div className="flex -space-x-2">
                {event.attendees.map((attendee, index) => (
                  <div key={index} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                    <Image
                      src={attendee.avatar || "/placeholder.svg"}
                      alt={attendee.name}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{event.attendees[0].name}</span> and{" "}
                <span className="font-medium text-gray-900">{event.totalGoing - 1} others</span> are going
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop Booking Card */}
        <div className="hidden md:block md:w-85">
          <div className="sticky top-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-red-500 font-medium mb-0.5">Only {event.slotsLeft} slots left!</p>
                  <p className="text-2xl font-bold text-gray-900">{event.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Starts at</p>
                  <p className="text-lg font-semibold text-gray-900">{event.time}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{event.totalSlots - event.slotsLeft} joined</span>
                  <span>{event.totalSlots} total</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-teal-400 to-teal-500 rounded-full"
                    style={{ width: `${((event.totalSlots - event.slotsLeft) / event.totalSlots) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <Button className="w-full h-12 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-full text-base shadow-lg shadow-blue-500/25">
                Book Your Slot
              </Button>

              <p className="text-center text-xs text-gray-500 mt-3">Free to join • Instant confirmation</p>
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
            <p className="text-xs text-red-500 font-medium">{event.slotsLeft} Slots Left</p>
            <p className="text-base font-bold text-gray-900">{event.date}</p>
          </div>
          <Button className="h-11 px-8 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-full text-sm shadow-lg shadow-blue-500/25">
            Book Slot
          </Button>
        </div>
      </div>
    </div>
  )
}
