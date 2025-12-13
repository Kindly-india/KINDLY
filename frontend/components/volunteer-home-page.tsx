"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import {
  Clock,
  MapPin,
  Heart,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Quote,
  TrendingUp,
  Award,
  Target,
  Users,
  Sparkles,
  Leaf,
  Menu,
  X,
} from "lucide-react"

const events = [
  {
    id: 1,
    title: "River Godavari Cleanup",
    category: "Environment",
    categoryColor: "bg-emerald-500",
    date: "Dec 25",
    time: "6 AM",
    location: "College Road",
    image: "/river-cleanup-volunteers-garbage-bags-nature.jpg",
    joined: 5,
    spotsLeft: 2,
  },
  {
    id: 2,
    title: "Tree Plantation Drive",
    category: "Environment",
    categoryColor: "bg-emerald-500",
    date: "Dec 25",
    time: "7 AM",
    location: "City Garden",
    image: "/tree-planting-volunteers-nature-green.jpg",
    joined: 11,
    spotsLeft: null,
  },
  {
    id: 3,
    title: "Teach Kids to Read",
    category: "Teaching",
    categoryColor: "bg-blue-500",
    date: "Dec 25",
    time: "8 AM",
    location: "Community Center",
    image: "/teaching-children-classroom-education.jpg",
    joined: 9,
    spotsLeft: 5,
  },
  {
    id: 4,
    title: "Senior Care Visit",
    category: "Elderly",
    categoryColor: "bg-purple-500",
    date: "Dec 25",
    time: "9 AM",
    location: "Sunshine Home",
    image: "/elderly-care-volunteers-seniors-happy.jpg",
    joined: 17,
    spotsLeft: null,
  },
  {
    id: 5,
    title: "Animal Shelter Help",
    category: "Animals",
    categoryColor: "bg-amber-500",
    date: "Dec 26",
    time: "10 AM",
    location: "Paws Shelter",
    image: "/animal-shelter-dogs-cats-volunteers.jpg",
    joined: 9,
    spotsLeft: 5,
  },
  {
    id: 6,
    title: "Blood Donation Camp",
    category: "Health",
    categoryColor: "bg-red-500",
    date: "Dec 26",
    time: "11 AM",
    location: "City Hospital",
    image: "/blood-donation-medical-volunteers.jpg",
    joined: 14,
    spotsLeft: null,
  },
  {
    id: 7,
    title: "Beach Cleanup Drive",
    category: "Environment",
    categoryColor: "bg-emerald-500",
    date: "Dec 26",
    time: "12 PM",
    location: "Miramar Beach",
    image: "/beach-cleanup-volunteers-ocean.jpg",
    joined: 21,
    spotsLeft: 1,
  },
  {
    id: 8,
    title: "Food Distribution",
    category: "Community",
    categoryColor: "bg-orange-500",
    date: "Dec 26",
    time: "2 PM",
    location: "Railway Station",
    image: "/food-distribution-charity-volunteers.jpg",
    joined: 24,
    spotsLeft: null,
  },
]

const stories = [
  {
    id: 1,
    quote:
      "Volunteering at the river cleanup changed my perspective. Seeing the community come together was truly inspiring.",
    author: "Priya Sharma",
    role: "Environmental Volunteer",
    category: "Environmental Volunteer",
    categoryColor: "bg-teal-500",
    image: "/happy-indian-woman-volunteer-nature-outdoor.jpg",
  },
  {
    id: 2,
    quote:
      "Teaching underprivileged children has been the most rewarding experience of my life. Their curiosity is infectious.",
    author: "Amit Patel",
    role: "Education Volunteer",
    category: "Education Volunteer",
    categoryColor: "bg-pink-500",
    image: "/indian-man-teaching-children-classroom-happy.jpg",
  },
  {
    id: 3,
    quote: "Every weekend at the animal shelter reminds me why compassion matters. These animals deserve our love.",
    author: "Sneha Kulkarni",
    role: "Animal Care Volunteer",
    category: "Animal Care Volunteer",
    categoryColor: "bg-amber-500",
    image: "/indian-woman-environment-volunteer-river-cleanup.jpg",
  },
]

export function VolunteerHomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentStory, setCurrentStory] = useState(0)
  const storiesRef = useRef<HTMLDivElement>(null)
  const eventsRef = useRef<HTMLDivElement>(null)
  const totalPages = 13

  const scrollStories = (direction: "left" | "right") => {
    if (storiesRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400
      storiesRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const scrollEvents = (direction: "left" | "right") => {
    if (eventsRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300
      eventsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Top Navbar - Reduced height on mobile */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#f5f5f7]">
        <div className="max-w-300 mx-auto px-4 md:px-8 h-12 md:h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-[15px] md:text-[17px] font-bold text-[#1d1d1f] tracking-tight">KINDLY</span>
          </Link>

          <div className="hidden md:flex gap-4">
            <Link
              href="/events"
              className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors"
            >
              Events
            </Link>
            <Link
              href="/history"
              className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors"
            >
              History
            </Link>
          </div>

          {/* Desktop - Profile Photo */}
          <Link href="/profile" className="hidden md:block">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#f5f5f7] hover:ring-[#0066cc] transition-all">
              <Image src="/IMG_2048.jpeg" alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
            </div>
          </Link>

          {/* Mobile - Hamburger Menu */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5 text-[#1d1d1f]" /> : <Menu className="w-5 h-5 text-[#1d1d1f]" />}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                {/* Menu */}
                <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-xl shadow-xl border border-[#e5e5e7] overflow-hidden">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#f5f5f7]">
                      <Image
                        src="/IMG_2048.jpeg"
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Profile</span>
                  </Link>
                  <Link
                    href="/events"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]"
                  >
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#fef3c7] to-[#fde68a] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Discover Events</span>
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#e8f5e9] to-[#c8e6c9] flex items-center justify-center">
                      <Clock className="w-4 h-4 text-[#2e7d32]" />
                    </div>
                    <span className="text-[13px] font-medium text-[#1d1d1f]">Event History</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Reduced padding and element sizes on mobile */}
      <section className="relative bg-linear-to-br from-[#fef5f0] via-[#fff8f5] to-[#f5fcf8] py-8 md:py-16 overflow-hidden">
        {/* Floating decorative icons - Smaller on mobile */}
        <div className="absolute top-4 left-4 md:top-8 md:left-20 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Heart className="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" />
        </div>
        <div className="absolute top-10 right-6 md:top-16 md:right-32 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" />
        </div>
        <div className="absolute bottom-14 left-6 md:bottom-20 md:left-32 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Users className="w-4 h-4 md:w-5 md:h-5 text-[#0066cc]" />
        </div>
        <div className="absolute bottom-8 right-4 md:bottom-12 md:right-20 w-8 h-8 md:w-12 md:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
          <Leaf className="w-4 h-4 md:w-5 md:h-5 text-[#10b981]" />
        </div>

        <div className="max-w-300 mx-auto px-4 md:px-8 text-center relative">
          {/* Active volunteers badge - Smaller on mobile */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm mb-4 md:mb-6">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] md:text-[13px] text-[#1d1d1f] font-medium">12 volunteers active near you</span>
          </div>

          <h1 className="text-[24px] md:text-[56px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
            Welcome back,{" "}
            <span className="bg-linear-to-r from-[#ff6b6b] via-[#f59e0b] to-[#10b981] bg-clip-text text-transparent">
              Manas
            </span>
            .
          </h1>
          <p className="text-[14px] md:text-[19px] text-[#86868b] mt-2 md:mt-3">
            Ready to spread some kindness today in <span className="text-[#1d1d1f] font-semibold">Nashik</span>?
          </p>

          {/* Quick stats cards - Smaller on mobile with tighter spacing */}
          <div className="flex justify-center gap-2 md:gap-4 mt-6 md:mt-8">
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <p className="text-[18px] md:text-[28px] font-bold text-[#ff6b6b]">127</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Events This Week</p>
            </div>
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <p className="text-[18px] md:text-[28px] font-bold text-[#10b981]">2,451</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Active Volunteers</p>
            </div>
            <div className="bg-white rounded-xl px-3 md:px-6 py-3 md:py-4 shadow-sm border border-[#f5f5f7]">
              <p className="text-[18px] md:text-[28px] font-bold text-[#f59e0b]">15K+</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Hours Contributed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Event Feed - Smaller cards, horizontal scroll on mobile */}
      <section className="bg-[#f5f5f7] py-6 md:py-12">
        <div className="max-w-300 mx-auto px-4 md:px-8">
          {/* Registered Events Section */}
          <div className="mb-4 md:mb-8">
            <h2 className="text-[20px] md:text-[36px] font-bold text-[#1d1d1f] tracking-tight">Registered Events</h2>
            <p className="text-[12px] md:text-[15px] text-[#86868b] mt-0.5">Find your next way to make a difference</p>
          </div>

          <div
            ref={eventsRef}
            className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide"
          >
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="shrink-0 w-50 md:w-auto snap-start group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-4/3 overflow-hidden">
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    width={300}
                    height={225}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div
                    className={cn(
                      "absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] md:text-[11px] font-semibold text-white",
                      event.categoryColor,
                    )}
                  >
                    {event.category}
                  </div>
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="text-[13px] md:text-[15px] font-semibold text-[#1d1d1f] mb-1.5 line-clamp-1">
                    {event.title}
                  </h3>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[#86868b]">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] md:text-[12px]">
                        {event.date} • {event.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#86868b]">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[10px] md:text-[12px] line-clamp-1">{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f5f5f7]">
                    <div className="flex items-center gap-1 text-[#10b981]">
                      <Users className="w-3 h-3" />
                      <span className="text-[10px] md:text-[11px] font-medium">{event.joined} joined</span>
                    </div>
                    {event.spotsLeft && (
                      <span className="text-[10px] md:text-[11px] font-medium text-[#ff6b6b]">
                        {event.spotsLeft} spots left
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination - Smaller on mobile */}
          <div className="flex items-center justify-center gap-1.5 md:gap-2 mt-6 md:mt-10">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1))
                scrollEvents("left")
              }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#d2d2d7] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-[#1d1d1f]" />
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    currentPage === page ? "bg-[#0066cc] w-5" : "bg-[#d2d2d7] hover:bg-[#86868b]",
                  )}
                />
              ))}
              <span className="text-[11px] md:text-[13px] text-[#86868b] mx-1.5">...</span>
            </div>
            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1))
                scrollEvents("right")
              }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#d2d2d7] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#1d1d1f]" />
            </button>
          </div>
          <p className="text-center text-[11px] md:text-[13px] text-[#86868b] mt-2">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </section>

      {/* Impact Section - Smaller on mobile */}
      <section className="bg-linear-to-br from-[#f0fdf4] via-[#ecfdf5] to-[#d1fae5] py-8 md:py-16">
        <div className="max-w-300 mx-auto px-4 md:px-8">
          <h2 className="text-[24px] md:text-[40px] font-bold text-[#1d1d1f] tracking-tight mb-6 md:mb-10">
            Your Impact.
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
            {/* Progress Ring - Smaller on mobile */}
            <div className="relative w-36 h-36 md:w-56 md:h-56 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#d1fae5" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(15 / 20) * 264} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[36px] md:text-[56px] font-bold text-[#10b981]">15</span>
                <span className="text-[12px] md:text-[15px] text-[#86868b]">hours</span>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-[18px] md:text-[28px] font-bold text-[#1d1d1f]">15 Volunteer Hours</h3>
              <p className="text-[13px] md:text-[15px] text-[#86868b] mt-0.5">this month</p>
              <p className="text-[13px] md:text-[15px] text-[#1d1d1f] mt-3 max-w-md">
                You're making a real difference in Nashik. Keep up the amazing work and inspire others to join the
                movement.
              </p>
              <button className="mt-4 md:mt-5 px-5 py-2.5 bg-[#ff6b6b] text-white rounded-full text-[13px] md:text-[14px] font-semibold hover:bg-[#ee5a5a] transition-colors">
                View Full Impact Report
              </button>
            </div>
          </div>

          {/* Stats cards - Smaller on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8 md:mt-12">
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#ff6b6b]/10 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" />
              </div>
              <p className="text-[20px] md:text-[28px] font-bold text-[#1d1d1f]">5</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Events Completed</p>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#0066cc]/10 flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#0066cc]" />
              </div>
              <p className="text-[20px] md:text-[28px] font-bold text-[#1d1d1f]">3</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Upcoming Events</p>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center mb-2">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-[#f59e0b]" />
              </div>
              <p className="text-[20px] md:text-[28px] font-bold text-[#1d1d1f]">2</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Total Hours</p>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#a855f7]/10 flex items-center justify-center mb-2">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-[#a855f7]" />
              </div>
              <p className="text-[20px] md:text-[28px] font-bold text-[#1d1d1f]">75%</p>
              <p className="text-[10px] md:text-[12px] text-[#86868b]">Attendance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Section - Fixed scroll with working navigation */}
      <section className="bg-linear-to-br from-[#fef7f0] via-[#fef5f0] to-[#fdf2f8] py-8 md:py-16 overflow-hidden">
        <div className="max-w-300 mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <div>
              <h2 className="text-[20px] md:text-[36px] font-bold text-[#1d1d1f] tracking-tight">
                Stories from Nashik.
              </h2>
              <p className="text-[12px] md:text-[15px] text-[#86868b] mt-0.5">
                Real stories from volunteers making a difference
              </p>
            </div>
            <div className="flex gap-1.5 md:gap-2">
              <button
                onClick={() => scrollStories("left")}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-[#d2d2d7] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-[#1d1d1f]" />
              </button>
              <button
                onClick={() => scrollStories("right")}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border border-[#d2d2d7] flex items-center justify-center hover:bg-[#f5f5f7] transition-colors"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#1d1d1f]" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={storiesRef}
          className="flex gap-3 md:gap-5 overflow-x-auto pb-4 px-4 md:px-8 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        >
          {stories.map((story, index) => (
            <div key={story.id} className="shrink-0 snap-start w-70 md:w-150">
              <div className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-md">
                <div className="relative aspect-4/3 overflow-hidden">
                  <Image
                    src={story.image || "/placeholder.svg"}
                    alt={story.author}
                    width={600}
                    height={450}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={cn(
                      "absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] md:text-[12px] font-semibold text-white",
                      story.categoryColor,
                    )}
                  >
                    {story.category}
                  </div>
                </div>
                <div className="p-4 md:p-6 relative">
                  <div className="absolute top-3 right-3 w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                    <Quote className="w-4 h-4 text-[#86868b]" />
                  </div>
                  <p className="text-[12px] md:text-[16px] text-[#1d1d1f] leading-relaxed mb-4 pr-10 line-clamp-3">
                    "{story.quote}"
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-linear-to-br from-[#10b981] to-[#0d9488]" />
                    <div>
                      <p className="text-[12px] md:text-[14px] font-semibold text-[#1d1d1f]">{story.author}</p>
                      <p className="text-[10px] md:text-[12px] text-[#86868b]">{story.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section - Smaller on mobile */}
      <section className="bg-[#1d1d1f] py-10 md:py-20">
        <div className="max-w-175 mx-auto px-4 md:px-8 text-center">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-linear-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center mx-auto mb-4 md:mb-5">
            <Heart className="w-6 h-6 md:w-7 md:h-7 text-white fill-white" />
          </div>
          <h2 className="text-[20px] md:text-[36px] font-bold text-white tracking-tight">
            Ready to make a difference?
          </h2>
          <p className="text-[13px] md:text-[15px] text-[#86868b] mt-2">
            Join thousands of volunteers creating positive change.
          </p>
          <button className="mt-6 px-6 py-3 bg-[#f59e0b] text-white rounded-full text-[13px] md:text-[15px] font-semibold hover:bg-[#d97706] transition-colors inline-flex items-center gap-1.5">
            Get started
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer - Smaller on mobile */}
      <footer className="bg-[#1d1d1f] border-t border-[#424245] py-8 md:py-12">
        <div className="max-w-300 mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            <div>
              <h4 className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    For Volunteers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    For Organisations
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[12px] md:text-[13px] text-[#f5f5f7] hover:text-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                Contact
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-[#f5f5f7]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  hello@kindly.org
                </li>
                <li className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-[#f5f5f7]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  +91 98765 43210
                </li>
                <li className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-[#f5f5f7]">
                  <MapPin className="w-3.5 h-3.5" />
                  Nashik, India
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#424245] mt-8 pt-6 text-center">
            <p className="text-[10px] md:text-[12px] text-[#86868b]">© 2025 Kindly. Made with love in Nashik.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
