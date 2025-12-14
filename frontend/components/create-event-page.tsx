"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ImageIcon,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Heart,
  Building2,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
  { id: "environment", name: "Environment", color: "bg-emerald-500", icon: "🌿" },
  { id: "education", name: "Education", color: "bg-blue-500", icon: "📚" },
  { id: "health", name: "Health", color: "bg-red-500", icon: "❤️" },
  { id: "animals", name: "Animals", color: "bg-amber-500", icon: "🐾" },
  { id: "elderly", name: "Elderly Care", color: "bg-purple-500", icon: "👴" },
  { id: "community", name: "Community", color: "bg-cyan-500", icon: "🏘️" },
]

export function CreateEventPage() {
  const [step, setStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handlePublish = () => {
    setShowSuccess(true)
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#f0fdf4] via-white to-[#f0f7ff] flex items-center justify-center p-4 overflow-hidden relative">
        {/* Floating icons */}
        <div className="absolute top-8 left-8 md:top-16 md:left-24 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
        </div>
        <div className="absolute top-12 right-8 md:top-20 md:right-32 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
          <Heart className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
        </div>
        <div className="absolute bottom-20 left-8 md:bottom-24 md:left-32 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
          <Users className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
        </div>
        <div className="absolute bottom-16 right-8 md:bottom-20 md:right-24 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
        </div>

        <div className="text-center max-w-md">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-[#1d1d1f] mb-3">Event Published!</h1>
          <p className="text-[#86868b] text-sm md:text-base mb-8">
            Your event is now live and visible to volunteers in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/org-events"
              className="px-6 py-3 bg-[#1d1d1f] text-white rounded-xl font-medium hover:bg-[#424245] transition-colors"
            >
              View My Events
            </Link>
            <Link
              href="/org-home"
              className="px-6 py-3 bg-white text-[#1d1d1f] rounded-xl font-medium border border-[#d2d2d7] hover:bg-[#f5f5f7] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#fef7f0] via-white to-[#f0fdf4] overflow-x-hidden">
      {/* Floating decorative icons */}
      <div className="fixed top-20 left-4 md:left-12 w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center z-10 opacity-60">
        <Heart className="w-5 h-5 text-rose-400" />
      </div>
      <div className="fixed top-32 right-4 md:right-16 w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center z-10 opacity-60">
        <Sparkles className="w-5 h-5 text-amber-400" />
      </div>
      <div className="fixed bottom-32 left-4 md:left-16 w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center z-10 opacity-60">
        <Building2 className="w-5 h-5 text-blue-400" />
      </div>
      <div className="fixed bottom-20 right-4 md:right-12 w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center z-10 opacity-60">
        <Users className="w-5 h-5 text-emerald-400" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#f5f5f7]">
        <div className="max-w-3xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <Link
            href="/org-events"
            className="flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Back to Events</span>
          </Link>
          <h1 className="text-base md:text-lg font-semibold text-[#1d1d1f]">Create Event</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-[#f5f5f7]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: "Details" },
              { num: 2, label: "Schedule" },
              { num: 3, label: "Capacity" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                      step >= s.num
                        ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                        : "bg-[#f5f5f7] text-[#86868b]",
                    )}
                  >
                    {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={cn(
                      "text-xs md:text-sm font-medium hidden sm:inline",
                      step >= s.num ? "text-[#1d1d1f]" : "text-[#86868b]",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2 rounded-full transition-all",
                      step > s.num ? "bg-linear-to-r from-emerald-500 to-teal-500" : "bg-[#e5e5e7]",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        {step === 1 && (
          <div className="space-y-6 md:space-y-8">
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Cover Image</label>
              <div className="aspect-video bg-linear-to-br from-[#f0fdf4] to-[#e0f2fe] rounded-2xl border-2 border-dashed border-[#d2d2d7] hover:border-emerald-400 transition-colors cursor-pointer flex flex-col items-center justify-center group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-[#1d1d1f] font-medium">Click to upload cover image</p>
                <p className="text-xs text-[#86868b] mt-1">16:9 ratio recommended • PNG, JPG up to 5MB</p>
              </div>
            </div>

            {/* Event Title */}
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Event Title</label>
              <input
                type="text"
                placeholder="Give your event a catchy name"
                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      selectedCategory === cat.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-[#e5e5e7] bg-white hover:border-[#d2d2d7]",
                    )}
                  >
                    <span className="text-2xl mb-2 block">{cat.icon}</span>
                    <span className="text-sm font-medium text-[#1d1d1f]">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Urgent Toggle */}
            <div className="flex items-center justify-between p-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1d1d1f]">Mark as Urgent</p>
                  <p className="text-xs text-[#86868b]">Highlight this event for immediate action</p>
                </div>
              </div>
              <button
                onClick={() => setIsUrgent(!isUrgent)}
                className={cn(
                  "w-12 h-7 rounded-full transition-all relative",
                  isUrgent ? "bg-amber-500" : "bg-[#e5e5e7]",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all",
                    isUrgent ? "right-1" : "left-1",
                  )}
                />
              </button>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Description</label>
              <textarea
                placeholder="What will volunteers be doing? What's the cause? Share the details..."
                rows={5}
                className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none text-sm md:text-base"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 md:space-y-8">
            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                  <Calendar className="w-4 h-4 inline mr-2 text-emerald-500" />
                  Event Date
                </label>
                <input
                  type="date"
                  className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                  <Clock className="w-4 h-4 inline mr-2 text-emerald-500" />
                  Start Time
                </label>
                <input
                  type="time"
                  className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                <Clock className="w-4 h-4 inline mr-2 text-emerald-500" />
                End Time
              </label>
              <input
                type="time"
                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                <MapPin className="w-4 h-4 inline mr-2 text-emerald-500" />
                Location
              </label>
              <input
                type="text"
                placeholder="Search for a location or enter address"
                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
              />
              <div className="mt-3 aspect-2/1 bg-[#f5f5f7] rounded-xl overflow-hidden">
                <div className="w-full h-full bg-linear-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-[#86868b]">Map preview will appear here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                  Dress Code
                  <span className="text-xs text-[#86868b] font-normal ml-2">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Comfortable clothes"
                  className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                  Things to Bring
                  <span className="text-xs text-[#86868b] font-normal ml-2">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Water bottle, gloves"
                  className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 md:space-y-8">
            {/* Volunteer Slots */}
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                <Users className="w-4 h-4 inline mr-2 text-emerald-500" />
                Total Volunteer Slots
              </label>
              <input
                type="number"
                placeholder="50"
                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
              />
            </div>

            {/* Registration Deadline */}
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Registration Deadline</label>
              <div className="grid grid-cols-3 gap-3">
                {["1 hour before", "1 day before", "1 week before"].map((option) => (
                  <button
                    key={option}
                    className="p-3 md:p-4 rounded-xl border-2 border-[#e5e5e7] bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all text-xs md:text-sm font-medium text-[#1d1d1f] text-center"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Age */}
            <div>
              <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                Minimum Age
                <span className="text-xs text-[#86868b] font-normal ml-2">(Optional)</span>
              </label>
              <input
                type="number"
                placeholder="18"
                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
              />
            </div>

            {/* Preview Card */}
            <div className="p-4 md:p-6 bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">Event Preview</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="aspect-video bg-linear-to-br from-[#f5f5f7] to-[#e5e5e7] rounded-lg mb-3" />
                <div className="h-4 w-2/3 bg-[#e5e5e7] rounded mb-2" />
                <div className="h-3 w-1/2 bg-[#f5f5f7] rounded mb-3" />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                  <div className="h-2 flex-1 bg-[#f5f5f7] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Actions */}
      <footer className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-[#f5f5f7]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12 md:h-14 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-semibold hover:bg-[#e5e5e7] transition-colors text-sm md:text-base"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < 3) setStep(step + 1)
              else handlePublish()
            }}
            className="flex-1 h-12 md:h-14 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg text-sm md:text-base"
          >
            {step === 3 ? "Publish Event" : "Continue"}
          </button>
        </div>
      </footer>
    </div>
  )
}
