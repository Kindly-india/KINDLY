"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Upload,
  X,
  Type,
  AlertTriangle,
  Search,
  Navigation
} from "lucide-react"
import { api } from "@/lib/api"

const categories = [
  { value: "environment", label: "Environment" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "animals", label: "Animals" },
  { value: "elderly", label: "Elderly Care" },
  { value: "community", label: "Community" },
]

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // New State for Location Feature
  const [gettingLocation, setGettingLocation] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    isUrgent: false,
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    dressCode: "",
    thingsToBring: "",
    totalSlots: "",
    registrationDeadline: "", // Updated default
    minimumAge: "",
    coverImageUrl: "",
  })

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  // 1. Fetch Existing Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await api.getEventById(eventId)
        const event = response.event

        // Helper to safely format datetime for input
        let formattedDeadline = ""
        if (event.registration_deadline) {
            const dateVal = new Date(event.registration_deadline)
            if (!isNaN(dateVal.getTime())) {
                // Adjust to local ISO string for input value
                const offset = dateVal.getTimezoneOffset()
                const localDate = new Date(dateVal.getTime() - (offset*60*1000))
                formattedDeadline = localDate.toISOString().slice(0, 16)
            }
        }

        setFormData({
          title: event.title || "",
          description: event.description || "",
          category: event.category || "",
          isUrgent: event.is_urgent || false,
          eventDate: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : "",
          startTime: event.start_time || "",
          endTime: event.end_time || "",
          location: event.location || "",
          dressCode: event.dress_code || "",
          thingsToBring: event.things_to_bring || "",
          totalSlots: event.total_slots?.toString() || "",
          registrationDeadline: formattedDeadline,
          minimumAge: event.minimum_age?.toString() || "",
          coverImageUrl: event.cover_image_url || "",
        })

        if (event.cover_image_url) {
          setImagePreview(event.cover_image_url)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) fetchEvent()
  }, [eventId])

  // New Handler for Current Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setGettingLocation(false);
            // In a real app, you'd reverse geocode here. For now, we simulate success.
            alert(`Location detected (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Please type the specific building name or street address to confirm on the map.`);
        },
        () => {
            setGettingLocation(false);
            alert("Unable to retrieve your location");
        }
    );
  };

  // 2. Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 3. Submit Updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      setError(null)

      // --- LOGIC CHECKS ---
      const eventStartDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
      const eventEndDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
      const deadlineDateTime = new Date(formData.registrationDeadline);

      // 1. Check if End Time is before Start Time
      if (eventEndDateTime <= eventStartDateTime) {
        throw new Error("Event End Time must be after Start Time.");
      }

      // 2. Check if Registration Deadline is AFTER Event Start
      // Allow a small buffer or enforce 1 hour rule strictly
      const oneHourBeforeStart = new Date(eventStartDateTime.getTime() - 60 * 60 * 1000);
      
      if (deadlineDateTime > oneHourBeforeStart) {
         throw new Error("Registration Deadline must be at least 1 hour before the event starts.");
      }
      // --------------------

      let coverImageUrl = formData.coverImageUrl

      if (imageFile) {
        coverImageUrl = await api.uploadEventImage(imageFile)
      }

      await api.updateEvent(eventId, {
        title: formData.title,
        description: formData.description,
        coverImageUrl,
        category: formData.category,
        isUrgent: formData.isUrgent,
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        dressCode: formData.dressCode || undefined,
        thingsToBring: formData.thingsToBring || undefined,
        totalSlots: parseInt(formData.totalSlots),
        registrationDeadline: formData.registrationDeadline, 
        minimumAge: formData.minimumAge ? parseInt(formData.minimumAge) : undefined,
      })

      alert("Event updated successfully!")
      router.push(`/org-events/${eventId}`)
    } catch (err: any) {
      setError(err.message || "Failed to update event")
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-sm text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/org-events/${eventId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Cancel
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Edit Event</h1>
          <div className="w-16"></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Basic Info & Image */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Type className="w-4 h-4 text-teal-500" />
              Basic Details
            </h2>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Cover Image
              </label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview("")
                          setFormData({ ...formData, coverImageUrl: "" })
                        }}
                        className="p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-red-500/80 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 transition-all">
                    <div className="p-3 bg-teal-50 rounded-full mb-3">
                      <Upload className="w-6 h-6 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Click to upload image</span>
                    <span className="text-xs text-gray-400 mt-1">JPG or PNG (Max 5MB)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Event Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgent Toggle */}
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex gap-3">
                <div className="p-2 bg-amber-100 rounded-lg h-fit">
                   <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <label htmlFor="isUrgent" className="text-sm font-bold text-amber-900 cursor-pointer">
                    Mark as Urgent Need
                  </label>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Adds a "Critical" badge to attract volunteers faster.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

          </div>

          {/* Section 2: Date, Time & Location */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Time & Location
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Event Date
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* --- UPDATED PRECISE LOCATION SECTION --- */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Exact Location
              </label>
              
              <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                          type="text"
                          required
                          placeholder="Enter specific venue, building, or street address"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full h-12 px-4 pl-10 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                  </div>
                  <button 
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      className="h-12 px-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 text-gray-700"
                      title="Use my current location"
                  >
                      <Navigation className={`w-4 h-4 text-teal-600 ${gettingLocation ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline text-sm font-medium">Locate Me</span>
                  </button>
              </div>

              {/* Map Preview Embed */}
              <div className="aspect-2/1 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                  {formData.location ? (
                      <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps?q=${encodeURIComponent(formData.location)}&output=embed`}
                          allowFullScreen
                          loading="lazy"
                          className="w-full h-full"
                      ></iframe>
                  ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                              <MapPin className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-500">Enter a location to verify on map</p>
                      </div>
                  )}
              </div>
            </div>
          </div>

          {/* Section 3: Requirements & Capacity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Requirements
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Total Slots
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalSlots}
                  onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Minimum Age
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minimumAge}
                  onChange={(e) => setFormData({ ...formData, minimumAge: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Registration Deadline - UPDATED with MAX DATE Logic */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                <Clock className="w-3 h-3 inline mr-1 text-teal-500" />
                Registration Deadline
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                // Min time: current time
                min={new Date().toISOString().slice(0, 16)}
                // Max time: The selected Event Start Time (prevents selecting a date AFTER event)
                max={formData.eventDate && formData.startTime ? `${formData.eventDate}T${formData.startTime}` : undefined}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-2">
                Must be at least 1 hour before event start time
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Dress Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.dressCode}
                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g. Blue T-shirt"
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Things to Bring (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.thingsToBring}
                    onChange={(e) => setFormData({ ...formData, thingsToBring: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g. Water bottle"
                  />
               </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving Changes..." : "Update Event"}
            </button>
            <Link
               href={`/org-events/${eventId}`}
               className="sm:w-32 h-14 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}