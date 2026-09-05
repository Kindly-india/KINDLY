"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Upload,
  X,
  Type,
  AlertTriangle,
  Search,
  Navigation,
  Lock // Added Lock icon for the "Option C" error state
} from "lucide-react"
import { api } from "@/lib/api"
import { coverObjectPosition, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/utils"
import { CoverFocalPointPicker, type FocalPoint } from "@/components/cover-focal-point-picker"

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

  // OPTION C State: Lock editing if not pending
  const [isLocked, setIsLocked] = useState(false)
  const [limitVolunteers, setLimitVolunteers] = useState(false)
  const [isPaidEvent, setIsPaidEvent] = useState(false)

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
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    dressCode: "",
    thingsToBring: "",
    // --- NEW CLUB FIELDS ---
    pointOfContact: "",
    connectPlan: "",
    // -----------------------
    totalSlots: "",
    registrationDeadline: "", // Updated default
    minimumAge: "",
    coverImageUrl: "",
    ticketPriceRupees: "",
  })

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [coverFocal, setCoverFocal] = useState<FocalPoint>({ x: 50, y: 50 })

  // 1. Fetch Existing Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await api.getEventById(eventId)
        const event = response.event

        // OPTION C CHECK: If the event is already approved/live, lock the page.
        if (event.status !== 'pending') {
          setIsLocked(true)
          setLoading(false)
          return
        }

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
          latitude: event.latitude ?? undefined,
          longitude: event.longitude ?? undefined,
          dressCode: event.dress_code || "",
          thingsToBring: event.things_to_bring || "",
          // --- POPULATE NEW FIELDS ---
          pointOfContact: event.point_of_contact || "",
          connectPlan: event.connect_plan || "",
          // ---------------------------
          totalSlots: event.total_slots != null ? event.total_slots.toString() : "",
          registrationDeadline: formattedDeadline,
          minimumAge: event.minimum_age?.toString() || "",
          coverImageUrl: event.cover_image_url || "",
          ticketPriceRupees: event.ticket_price ? (event.ticket_price / 100).toString() : "",
        })

        setLimitVolunteers(event.total_slots != null)
        setIsPaidEvent(!!event.ticket_price && event.ticket_price > 0)

        if (event.cover_image_url) {
          setImagePreview(event.cover_image_url)
          setCoverFocal({ x: event.cover_focal_x ?? 50, y: event.cover_focal_y ?? 50 })
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
            setFormData(prev => ({ ...prev, latitude, longitude }));
            alert(`Location pinned (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Update the address field if needed.`);
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
      if (file.size > MAX_UPLOAD_BYTES) {
        alert(`Image size must be less than ${MAX_UPLOAD_MB}MB`)
        return
      }
      setImageFile(file)
      setCoverFocal({ x: 50, y: 50 })
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
      if (!formData.pointOfContact) {
        throw new Error("Point of Contact is required.");
      }

      const eventStartDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
      const eventEndDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
      const deadlineDateTime = new Date(formData.registrationDeadline);

      // 1. Check if End Time is before Start Time
      if (eventEndDateTime <= eventStartDateTime) {
        throw new Error("Event End Time must be after Start Time.");
      }

      // 2. Check if Registration Deadline is AFTER Event Start
      const oneHourBeforeStart = new Date(eventStartDateTime.getTime() - 60 * 60 * 1000);
      
      if (deadlineDateTime > oneHourBeforeStart) {
         throw new Error("Registration Deadline must be at least 1 hour before the event starts.");
      }

      if (isPaidEvent && (!formData.ticketPriceRupees || parseFloat(formData.ticketPriceRupees) < 1)) {
        throw new Error('Please set a valid ticket price, or turn off "Paid Event".');
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
        coverFocalX: coverFocal.x,
        coverFocalY: coverFocal.y,
        category: formData.category,
        isUrgent: formData.isUrgent,
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        dressCode: formData.dressCode || undefined,
        thingsToBring: formData.thingsToBring || undefined,
        // --- SEND NEW FIELDS ---
        pointOfContact: formData.pointOfContact,
        connectPlan: formData.connectPlan || undefined,
        // -----------------------
        totalSlots: limitVolunteers ? (parseInt(formData.totalSlots) || undefined) : null,
        registrationDeadline: formData.registrationDeadline,
        minimumAge: formData.minimumAge ? parseInt(formData.minimumAge) : undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        ticketPrice: isPaidEvent && formData.ticketPriceRupees ? Math.round(parseFloat(formData.ticketPriceRupees) * 100) : null,
      })

      alert("Event updated successfully!")
      router.push(`/org-events/${eventId}`)
    } catch (err: any) {
      setError(err.message || "Failed to update event")
      window.scrollTo(0, 0); 
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    )
  }

  // --- OPTION C LOCKOUT SCREEN ---
  if (isLocked) {
    return (
      <div className="min-h-screen bg-muted flex flex-col items-center justify-center px-4">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Event is Live</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This event has already been approved and is currently live. To ensure consistency for our volunteers, live events cannot be edited directly. 
            If you need to make critical changes, please cancel the event or contact support.
          </p>
          <Link
            href="/org-events"
            className="block w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }
  // ------------------------------

  return (
    <div className="min-h-screen bg-muted py-8 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/org-events/${eventId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Cancel
          </Link>
          <h1 className="text-xl font-bold text-foreground">Edit Event</h1>
          <div className="w-16"></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/15 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Basic Info & Image */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-6">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Type className="w-4 h-4 text-teal-500" />
              Basic Details
            </h2>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Cover Image
              </label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted border border-border group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: coverObjectPosition(coverFocal.x, coverFocal.y) }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview("")
                          setCoverFocal({ x: 50, y: 50 })
                          setFormData({ ...formData, coverImageUrl: "" })
                        }}
                        className="p-2 bg-card/20 backdrop-blur-md text-white rounded-full hover:bg-red-500/80 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:bg-teal-500/15/50 transition-all">
                    <div className="p-3 bg-teal-50 dark:bg-teal-500/15 rounded-full mb-3">
                      <Upload className="w-6 h-6 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Click to upload image</span>
                    <span className="text-xs text-muted-foreground mt-1">JPG or PNG (Max {MAX_UPLOAD_MB}MB)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              {imagePreview && (
                <div className="mt-4 p-4 bg-muted/40 rounded-xl border border-border">
                  <CoverFocalPointPicker imageUrl={imagePreview} value={coverFocal} onChange={setCoverFocal} />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Event Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
              />
            </div>

            {/* Description - Rebranded for culture */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                The Cause (Description)
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 rounded-xl">
              <div className="flex gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-500/15 rounded-lg h-fit">
                   <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <label htmlFor="isUrgent" className="text-sm font-bold text-amber-900 cursor-pointer">
                    Mark as Urgent Need
                  </label>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Adds a &quot;Critical&quot; badge to attract volunteers faster.
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
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

          </div>

          {/* Section 2: Date, Time & Location */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-6">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Time & Location
            </h2>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Event Date
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* --- UPDATED PRECISE LOCATION SECTION --- */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Exact Location
              </label>
              
              <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                          type="text"
                          required
                          placeholder="Enter specific venue, building, or street address"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full h-12 px-4 pl-10 bg-muted rounded-xl border border-border focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                  </div>
                  <button 
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
                      className="h-12 px-4 bg-card border border-border hover:bg-muted rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 text-foreground"
                      title="Use my current location"
                  >
                      <Navigation className={`w-4 h-4 text-teal-600 ${gettingLocation ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline text-sm font-medium">Locate Me</span>
                  </button>
              </div>

              {/* Map Preview Embed */}
              <div className="aspect-2/1 bg-muted rounded-xl overflow-hidden border border-border shadow-inner">
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
                          <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-3">
                              <MapPin className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">Enter a location to verify on map</p>
                      </div>
                  )}
              </div>
            </div>
          </div>

          {/* Section 3: Requirements & Capacity */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border space-y-6">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Logistics & Requirements
            </h2>

            {/* --- NEW: POINT OF CONTACT --- */}
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Point of Contact
                </label>
                <input
                    type="text"
                    required
                    placeholder="e.g., Rahul Verma (9876543210)"
                    value={formData.pointOfContact}
                    onChange={(e) => setFormData({ ...formData, pointOfContact: e.target.value })}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
            </div>

            {/* --- THE AFTER --- */}
            <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    The After (Optional)
                </label>
                <input
                    type="text"
                    placeholder="e.g., Grabbing breakfast at Roastery Coffee after!"
                    value={formData.connectPlan}
                    onChange={(e) => setFormData({ ...formData, connectPlan: e.target.value })}
                    className="w-full px-4 py-3 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-2">
                    What&apos;s the after-event hangout? Chai? Walk? Breakfast together? If blank, our team may suggest one.
                </p>
            </div>

            <hr className="border-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Volunteer Limit
                  </label>
                  <button
                    type="button"
                    onClick={() => setLimitVolunteers(v => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${limitVolunteers ? 'bg-teal-500' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow transition-transform ${limitVolunteers ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {limitVolunteers ? (
                  <input
                    type="number"
                    min="1"
                    value={formData.totalSlots}
                    onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                ) : (
                  <p className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-muted-foreground">
                    Unlimited
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Minimum Age
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minimumAge}
                  onChange={(e) => setFormData({ ...formData, minimumAge: e.target.value })}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Paid Event
                </label>
                <button
                  type="button"
                  onClick={() => setIsPaidEvent(v => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isPaidEvent ? 'bg-teal-500' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card shadow transition-transform ${isPaidEvent ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {isPaidEvent ? (
                <>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      value={formData.ticketPriceRupees}
                      onChange={(e) => setFormData({ ...formData, ticketPriceRupees: e.target.value })}
                      className="w-full pl-7 pr-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You&apos;ll keep 92% of every ticket sold — KINDLY retains an 8% platform fee to cover payment processing and platform costs.
                  </p>
                </>
              ) : (
                <p className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-muted-foreground">
                  Free event
                </p>
              )}
            </div>

            {/* Registration Deadline */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
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
                max={formData.eventDate && formData.startTime ? `${formData.eventDate}T${formData.startTime}` : undefined}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Must be at least 1 hour before event start time
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Dress Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.dressCode}
                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g. Blue T-shirt"
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Things to Bring (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.thingsToBring}
                    onChange={(e) => setFormData({ ...formData, thingsToBring: e.target.value })}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
               className="sm:w-32 h-14 bg-card border border-border text-foreground rounded-xl font-medium hover:bg-muted transition-colors flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}