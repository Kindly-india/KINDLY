"use client"

import { useState } from "react"
import {
  Calendar,
  MapPin,
  Users,
  QrCode,
  MessageSquare,
  Phone,
  Plus,
  ChevronLeft,
  Search,
  Clock,
  AlertTriangle,
  Send,
  Check,
  ImageIcon,
  Sparkles,
  Heart,
  Building2,
  Star,
  Award,
  Upload,
  Camera,
  Wand2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type ViewType = "LIBRARY" | "CREATE_WIZARD" | "MISSION_CONTROL" | "COMPLETED_VIEW" | "CERTIFICATE_BUILDER"
type LibraryTab = "active" | "completed"
type MissionTab = "roster" | "broadcast" | "settings"
type AttendanceFilter = "present" | "absent"

const activeEvents = [
  {
    id: 1,
    title: "River Godavari Cleanup",
    date: "Dec 25",
    time: "7 AM",
    image: "/river-cleanup-volunteers.png",
    registered: 42,
    total: 50,
    checkedIn: 12,
  },
  {
    id: 2,
    title: "Tree Plantation Drive",
    date: "Dec 28",
    time: "6 AM",
    image: "/tree-planting-volunteers.png",
    registered: 28,
    total: 40,
    checkedIn: 0,
  },
]

const completedEvents = [
  {
    id: 3,
    title: "Beach Cleanup Initiative",
    date: "Nov 15",
    time: "6 AM",
    image: "/beach-cleanup-ocean.png",
    turnout: 58,
    total: 70,
    hours: 126,
    rating: 4.9,
  },
  {
    id: 4,
    title: "Blood Donation Camp",
    date: "Nov 10",
    time: "9 AM",
    image: "/blood-donation-medical.jpg",
    turnout: 45,
    total: 50,
    hours: 90,
    rating: 4.7,
  },
]

const volunteers = [
  { id: 1, name: "Priya Patel", avatar: "/indian-woman-face.jpg", status: "present" as const },
  { id: 2, name: "Amit Kumar", avatar: "/indian-man-face.jpg", status: "absent" as const },
  { id: 3, name: "Sneha Desai", avatar: "/indian-woman-smiling.png", status: "present" as const },
  { id: 4, name: "Vikram Singh", avatar: "/indian-professional-man.png", status: "present" as const },
  { id: 5, name: "Rahul Sharma", avatar: "/young-indian-man.png", status: "absent" as const },
  { id: 6, name: "Neha Gupta", avatar: "/indian-woman-professional.png", status: "present" as const },
]

const rosterVolunteers = [
  { id: 1, name: "Priya Patel", avatar: "/indian-woman-face.jpg", checkedIn: true, phone: "+91 98765 43210" },
  { id: 2, name: "Amit Kumar", avatar: "/indian-man-face.jpg", checkedIn: false, phone: "+91 98765 43211" },
  { id: 3, name: "Sneha Desai", avatar: "/indian-woman-smiling.png", checkedIn: false, phone: "+91 98765 43212" },
  { id: 4, name: "Vikram Singh", avatar: "/indian-professional-man.png", checkedIn: true, phone: "+91 98765 43213" },
]

const galleryImages = [
  "/river-cleanup-volunteers.png",
  "/tree-planting-nature.jpg",
  "/beach-cleanup-ocean.png",
  "/food-distribution-charity.jpg",
]

export function OrgEventManagement() {
  const [view, setView] = useState<ViewType>("LIBRARY")
  const [libraryTab, setLibraryTab] = useState<LibraryTab>("active")
  const [missionTab, setMissionTab] = useState<MissionTab>("roster")
  const [selectedEvent, setSelectedEvent] = useState(activeEvents[0])
  const [selectedCompletedEvent, setSelectedCompletedEvent] = useState(completedEvents[0])
  const [wizardStep, setWizardStep] = useState(1)
  const [volunteerSearch, setVolunteerSearch] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [checkedInVolunteers, setCheckedInVolunteers] = useState<number[]>([1, 4])
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>("present")
  const [certificateTheme, setCertificateTheme] = useState("classic")

  const toggleCheckIn = (id: number) => {
    setCheckedInVolunteers((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const openMissionControl = (event: (typeof activeEvents)[0]) => {
    setSelectedEvent(event)
    setView("MISSION_CONTROL")
  }

  const openCompletedView = (event: (typeof completedEvents)[0]) => {
    setSelectedCompletedEvent(event)
    setView("COMPLETED_VIEW")
  }

  const filteredRoster = rosterVolunteers.filter((v) => v.name.toLowerCase().includes(volunteerSearch.toLowerCase()))

  const filteredVolunteersByStatus = volunteers.filter((v) => v.status === attendanceFilter)

  return (
    <section className="min-h-screen bg-linear-to-br from-[#fef7f0] via-white to-[#f0fdf4] overflow-x-hidden relative">
      {/* Decorative Floating Icons - Desktop only */}
      <div className="hidden md:flex absolute top-32 left-8 w-12 h-12 bg-white rounded-2xl shadow-lg items-center justify-center">
        <Heart className="w-6 h-6 text-rose-400" />
      </div>
      <div className="hidden md:flex absolute top-48 right-12 w-12 h-12 bg-white rounded-2xl shadow-lg items-center justify-center">
        <Sparkles className="w-6 h-6 text-amber-400" />
      </div>
      <div className="hidden md:flex absolute bottom-32 left-16 w-10 h-10 bg-white rounded-xl shadow-lg items-center justify-center">
        <Building2 className="w-5 h-5 text-teal-500" />
      </div>
      <div className="hidden md:flex absolute bottom-48 right-20 w-10 h-10 bg-white rounded-xl shadow-lg items-center justify-center">
        <Users className="w-5 h-5 text-blue-500" />
      </div>

      {/* VIEW 1: LIBRARY */}
      {view === "LIBRARY" && (
        <div className="min-h-screen">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
              <Link
                href="/org-home"
                className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden md:inline">Home</span>
              </Link>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-linear-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-xs md:text-sm font-bold">GE</span>
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="px-4 md:px-8 lg:px-16 pt-6 md:pt-10 pb-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900">My Events</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your volunteering events</p>

              {/* Filter Tabs */}
              <div className="flex gap-2 mt-5">
                {[
                  { key: "active", label: "Active" },
                  { key: "completed", label: "Completed" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setLibraryTab(tab.key as LibraryTab)}
                    className={`px-4 md:px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      libraryTab === tab.key
                        ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Event List - Row Style like Screenshot */}
          <div className="px-4 md:px-8 lg:px-16 pb-24">
            <div className="max-w-6xl mx-auto space-y-3">
              {libraryTab === "active"
                ? activeEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => openMissionControl(event)}
                      className="w-full bg-white rounded-2xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 md:gap-4 border border-gray-100"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0">
                        <Image
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{event.title}</h3>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full shrink-0">
                            Published
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.date} • {event.time}
                        </p>
                        {/* Progress */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>
                              {event.registered}/{event.total} Registered
                            </span>
                            <span className="font-medium text-emerald-600">
                              {Math.round((event.registered / event.total) * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-emerald-400 to-teal-500 rounded-full"
                              style={{ width: `${(event.registered / event.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                : completedEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => openCompletedView(event)}
                      className="w-full bg-white rounded-2xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3 md:gap-4 border border-gray-100"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0">
                        <Image
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{event.title}</h3>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full shrink-0">
                            Completed
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.date} • {event.time}
                        </p>
                        {/* Stats Row */}
                        <div className="flex items-center gap-3 md:gap-4 mt-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-teal-500" />
                            <span className="text-gray-600">
                              {event.turnout}/{event.total}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-gray-600">{event.hours}h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-gray-600">{event.rating}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
            </div>
          </div>

          {/* FAB */}
          <button
            onClick={() => {
              setWizardStep(1)
              setView("CREATE_WIZARD")
            }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform z-50"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* VIEW 2: CREATE WIZARD - Full Page on Mobile, Modal on Desktop */}
      {view === "CREATE_WIZARD" && (
        <div className="fixed inset-0 bg-linear-to-br from-[#fef7f0] via-white to-[#f0fdf4] md:bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white w-full md:rounded-3xl md:max-w-lg md:max-h-[90vh] min-h-screen md:min-h-0 md:m-4 overflow-hidden flex flex-col md:shadow-2xl">
            {/* Header */}
            <div className="px-4 md:px-5 pt-4 md:pt-5 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setView("LIBRARY")}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-900 text-base md:text-lg">Create Event</span>
                <div className="w-9 md:w-10" />
              </div>

              {/* Step Progress */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      step <= wizardStep ? "bg-linear-to-r from-orange-400 to-rose-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span className={wizardStep >= 1 ? "text-orange-600 font-medium" : ""}>Details</span>
                <span className={wizardStep >= 2 ? "text-orange-600 font-medium" : ""}>Logistics</span>
                <span className={wizardStep >= 3 ? "text-orange-600 font-medium" : ""}>Capacity</span>
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-4 md:px-5 py-5">
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                    <div className="aspect-video border-2 border-dashed border-gray-200 rounded-2xl bg-linear-to-br from-orange-50 to-rose-50 flex flex-col items-center justify-center hover:border-orange-300 transition-colors cursor-pointer">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
                        <ImageIcon className="w-7 h-7 text-orange-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Click to upload</span>
                      <span className="text-xs text-gray-400 mt-1">16:9 recommended</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                    <input
                      type="text"
                      placeholder="Give your event a catchy name"
                      className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500">
                        <option>Environment</option>
                        <option>Education</option>
                        <option>Health</option>
                        <option>Animals</option>
                        <option>Elderly Care</option>
                        <option>Community</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Urgent</label>
                      <button className="w-full h-12 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-200 transition-colors">
                        <AlertTriangle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">No</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      placeholder="What will volunteers be doing? What's the cause?"
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for a location..."
                        className="w-full h-12 pl-11 pr-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dress Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Wear comfortable shoes"
                      className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Things to Bring (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Water bottle, gloves"
                      className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Volunteer Slots</label>
                    <input
                      type="number"
                      placeholder="50"
                      className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registration Deadline</label>
                    <select className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500">
                      <option>1 hour before event</option>
                      <option>1 day before event</option>
                      <option>1 week before event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Age (Optional)</label>
                    <input
                      type="number"
                      placeholder="18"
                      className="w-full h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  {/* Preview Card */}
                  <div className="mt-4 p-4 bg-linear-to-br from-orange-50 to-rose-50 rounded-2xl border border-orange-100">
                    <p className="text-xs font-medium text-orange-600 mb-3">Event Preview</p>
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="w-full h-16 bg-linear-to-r from-gray-100 to-gray-50 rounded-lg mb-2" />
                      <div className="h-3 w-2/3 bg-gray-200 rounded" />
                      <div className="h-2 w-1/2 bg-gray-100 rounded mt-1.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 md:px-5 py-4 border-t border-gray-100 bg-white flex gap-3">
              {wizardStep > 1 && (
                <button
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (wizardStep < 3) setWizardStep(wizardStep + 1)
                  else setView("LIBRARY")
                }}
                className="flex-1 h-12 bg-linear-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
              >
                {wizardStep === 3 ? "Publish Event" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MISSION CONTROL (Active Event) */}
      {view === "MISSION_CONTROL" && (
        <div className="min-h-screen">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
              <button
                onClick={() => setView("LIBRARY")}
                className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700 transition-colors mb-3"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Events</span>
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{selectedEvent.title}</h1>
            </div>
          </div>

          {/* Stats Row */}
          <div className="px-4 md:px-8 py-4 bg-linear-to-b from-teal-50/50 to-transparent">
            <div className="max-w-4xl mx-auto flex flex-wrap gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
                <Users className="w-3.5 h-3.5 text-teal-500" />
                <span className="font-medium text-gray-700">{selectedEvent.registered} Registered</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium text-gray-700">{checkedInVolunteers.length} Checked In</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100 text-xs md:text-sm">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium text-gray-700">
                  {selectedEvent.total - selectedEvent.registered} Slots
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 md:px-8 py-2">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {[
                  { key: "roster", label: "Roster", icon: Users },
                  { key: "broadcast", label: "Broadcast", icon: MessageSquare },
                  { key: "settings", label: "Settings", icon: Calendar },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMissionTab(tab.key as MissionTab)}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      missionTab === tab.key ? "bg-white text-teal-600 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 md:px-8 pb-24">
            <div className="max-w-4xl mx-auto">
              {/* Roster Tab */}
              {missionTab === "roster" && (
                <div className="py-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search volunteers..."
                      value={volunteerSearch}
                      onChange={(e) => setVolunteerSearch(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-white rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredRoster.map((volunteer) => (
                      <div
                        key={volunteer.id}
                        className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <Image
                              src={volunteer.avatar || "/placeholder.svg"}
                              alt={volunteer.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{volunteer.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <button className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center">
                                <Phone className="w-3 h-3 text-teal-600" />
                              </button>
                              <button className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCheckIn(volunteer.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            checkedInVolunteers.includes(volunteer.id)
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {checkedInVolunteers.includes(volunteer.id) ? "Checked In" : "Check In"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Broadcast Tab */}
              {missionTab === "broadcast" && (
                <div className="py-4 space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <textarea
                      placeholder="Send a message to all registered volunteers..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                    <button className="mt-3 w-full h-11 bg-linear-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Broadcast
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Previous Messages</p>
                    <div className="space-y-2">
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700">Bring umbrellas, light rain expected</p>
                        <p className="text-xs text-gray-400 mt-1">2h ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {missionTab === "settings" && (
                <div className="py-4 space-y-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm mb-3">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {selectedEvent.date} • {selectedEvent.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">College Road Ghat, Nashik</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{selectedEvent.total} volunteer slots</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 h-11 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium">
                      Edit Event
                    </button>
                    <button className="flex-1 h-11 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                      Cancel Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Scan QR Button */}
          <button className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-xl flex items-center gap-2 z-50">
            <QrCode className="w-5 h-5" />
            <span className="font-medium text-sm">Scan QR</span>
          </button>
        </div>
      )}

      {/* VIEW 4: COMPLETED EVENT DASHBOARD */}
      {view === "COMPLETED_VIEW" && (
        <div className="min-h-screen">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
              <button
                onClick={() => setView("LIBRARY")}
                className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700 transition-colors mb-3"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Events</span>
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{selectedCompletedEvent.title}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {selectedCompletedEvent.date} • {selectedCompletedEvent.time}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 md:px-8 pb-24">
            <div className="max-w-4xl mx-auto space-y-4 pt-4">
              {/* ROI Stats Cards */}
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Turnout</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">
                    {selectedCompletedEvent.turnout}
                    <span className="text-gray-400 text-sm">/{selectedCompletedEvent.total}</span>
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Impact</p>
                  <p className="text-lg md:text-2xl font-bold text-emerald-600">{selectedCompletedEvent.hours}h</p>
                </div>
                <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-lg md:text-2xl font-bold text-amber-500">
                      {selectedCompletedEvent.rating}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Volunteer Attendance</h3>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setAttendanceFilter("present")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      attendanceFilter === "present" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Present ({volunteers.filter((v) => v.status === "present").length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter("absent")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      attendanceFilter === "absent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Absent ({volunteers.filter((v) => v.status === "absent").length})
                  </button>
                </div>

                {/* Simple Name List - No action buttons */}
                <div className="space-y-2">
                  {filteredVolunteersByStatus.map((volunteer) => (
                    <div key={volunteer.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={volunteer.avatar || "/placeholder.svg"}
                          alt={volunteer.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-gray-900">{volunteer.name}</span>
                    </div>
                  ))}
                  {filteredVolunteersByStatus.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No volunteers in this category</p>
                  )}
                </div>
              </div>

              {/* Certificates */}
              <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Certificates</h3>
                    <p className="text-xs text-gray-500">Issue to attendees</p>
                  </div>
                </div>
                <button
                  onClick={() => setView("CERTIFICATE_BUILDER")}
                  className="w-full h-11 bg-linear-to-r from-orange-500 to-rose-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Design & Issue
                </button>
              </div>

              {/* Gallery */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Event Memories</h3>
                  <button className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Add
                  </button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`Memory ${idx + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  <button className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                    <Camera className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: CERTIFICATE BUILDER */}
      {view === "CERTIFICATE_BUILDER" && (
        <div className="fixed inset-0 bg-linear-to-br from-[#fef7f0] via-white to-[#f0fdf4] md:bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white w-full md:rounded-3xl md:max-w-2xl md:max-h-[90vh] min-h-screen md:min-h-0 md:m-4 overflow-hidden flex flex-col md:shadow-2xl">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <button
                onClick={() => setView("COMPLETED_VIEW")}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="font-semibold text-gray-900">Certificate Builder</span>
              <div className="w-9" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {["classic", "eco", "modern"].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setCertificateTheme(theme)}
                      className={`h-14 rounded-xl border-2 transition-all capitalize text-sm ${
                        certificateTheme === theme
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Title</label>
                <input
                  type="text"
                  defaultValue="Certificate of Appreciation"
                  className="w-full h-11 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signatory Name</label>
                <input
                  type="text"
                  placeholder="Name of authorized person"
                  className="w-full h-11 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Signature</label>
                <div className="h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">PNG format</span>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs font-medium text-orange-600 mb-3">Preview</p>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-amber-200">
                  <div className="text-center">
                    <p className="text-xs text-amber-600 font-medium">CERTIFICATE OF APPRECIATION</p>
                    <p className="text-sm font-semibold mt-2">Volunteer Name</p>
                    <p className="text-xs text-gray-500 mt-1">For participating in {selectedCompletedEvent.title}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-100 bg-white">
              <button className="w-full h-11 bg-linear-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium">
                Generate & Send Certificates
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
