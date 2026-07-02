"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Share2,
  Check,
  Heart,
  Clock,
  MapPin,
  Footprints,
  User,
  CheckCircle2,
  Navigation,
  Calendar,
  AlertCircle,
  Coffee, // Added for The Connect
  ShieldCheck, // Added for Verification
  Sparkles, // Added for Premium Feel
  Info,
  Loader2,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { PhoneVerificationModal } from "@/components/phone-verification-modal"

/**
 * EventDetailsPage Component
 * * This page serves as the primary touchpoint for volunteers to discover
 * and commit to social initiatives in Nashik. It displays full event details,
 * logistics, and the curated "Connect" social activity.
 */
export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  // --- STATE MANAGEMENT ---
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${eventId}`
    const shareData = {
      title: event?.title ?? 'KINDLY Event',
      text: event?.title ? `Join me at "${event.title}" on KINDLY!` : 'Check out this volunteer event on KINDLY!',
      url,
    }
    if (navigator.share) {
      await navigator.share(shareData).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [userPhone, setUserPhone] = useState<string | null>(undefined as any)

  /**
   * Data Fetching Logic
   * Fetches the event details and checks if the current user
   * is already a participant in this specific event.
   */
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)

        // Fetch Public Event Data (includes proposed_connect from DB)
        const response = await api.getPublicEventById(eventId)
        setEvent(response.event)

        // Check if current user is already registered and fetch phone (Safe check)
        try {
          const [registrations, profile] = await Promise.all([
            api.getMyRegistrations(),
            api.getUserProfile(),
          ])
          const myReg = registrations?.events?.find((r: any) => r.id === eventId)
          if (myReg && myReg.registration_status !== 'cancelled') {
            router.replace(`/events/${eventId}/registered`)
            return
          }
          setUserPhone(profile?.profile?.phone ?? null)
        } catch {
          // User not logged in — skip silently, page loads as public view
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load event details')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) fetchEvent()
  }, [eventId])

  /**
   * openConfirmModal
   * Auth-checks the user, then opens the commitment modal.
   * Actual API call happens only after the user ticks the T&C checkbox.
   */
  const openConfirmModal = async () => {
    try {
      const user = await api.getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      // Phone not yet verified — show OTP modal before the commitment modal
      if (!userPhone) {
        setShowPhoneModal(true)
        return
      }
      setAgreedToTerms(false)
      setShowConfirmModal(true)
    } catch {
      router.push('/login')
    }
  }

  /**
   * executeRegistration
   * Called when the user confirms in the modal.
   */
  const executeRegistration = async () => {
    try {
      setIsRegistering(true)
      setShowConfirmModal(false)

      await api.registerForEvent(eventId)

      setIsRegistered(true)
      setEvent((prev: any) => ({
        ...prev,
        registered_count: (prev.registered_count || 0) + 1
      }))
    } catch (err: any) {
      alert(err.message || 'Failed to register for event')
    } finally {
      setIsRegistering(false)
    }
  }

  // --- UI FORMATTING HELPERS ---

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // --- LOADING & ERROR STATES ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm font-medium text-muted-foreground tracking-wide">CURATING DETAILS...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-lg font-bold text-foreground mb-2">{error || 'Event not found'}</p>
          <p className="text-sm text-muted-foreground mb-6">The event might have been cancelled or the link is invalid.</p>
          <Link href="/events">
            <Button className="w-full bg-primary text-primary-foreground rounded-xl">
              Explore Other Events
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // --- LOGIC CALCULATIONS ---

  const isRegistrationOpen = event?.registration_deadline
    ? new Date(event.registration_deadline) > new Date()
    : true

  const isUnlimited = event.total_slots == null
  const slotsLeft = isUnlimited ? Infinity : Math.max(0, event.total_slots - (event.registered_count || 0))
  const isFull = !isUnlimited && slotsLeft <= 0
  const canRegister = isRegistrationOpen && !isFull && !isRegistered

  const shortDescription = event.description?.length > 150
    ? event.description.slice(0, 150) + "..."
    : event.description

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">

      {/* LAYOUT STRUCTURE:
          - Left Column (md:flex-1): Visuals, Logistics, Description, The Connect.
          - Right Sidebar (md:w-85): Fixed Booking Widget.
      */}
      <div className="md:flex md:max-w-6xl md:mx-auto md:gap-10 md:py-10 md:px-8">

        {/* --- LEFT CONTENT COLUMN --- */}
        <div className="md:flex-1">

          {/* HERO IMAGE SECTION */}
          <div className="relative">
            <div className="relative h-72 md:h-110 md:rounded-[32px] md:overflow-hidden md:shadow-2xl md:border border-border">
              {event.cover_image_url ? (
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-border flex items-center justify-center">
                  <Calendar className="w-20 h-20 text-muted-foreground" />
                </div>
              )}

              {/* OVERLAY NAVIGATION */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <Link href="/events">
                  <button className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-card/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                </Link>

                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-card/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    {copied
                      ? <Check className="w-5 h-5 text-green-600" />
                      : <Share2 className="w-5 h-5 text-foreground" />}
                  </button>
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-card/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:scale-105 transition-all"
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-foreground"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Image Overlay Gradient for mobile title legibility */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
            </div>
          </div>

          {/* MAIN HEADER INFO */}
          <div className="px-5 md:px-0 pt-6 pb-6 border-b border-border md:border-0">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-emerald-100">
                  {event.category}
                </span>
                {event.is_urgent && (
                  <span className="px-3 py-1 bg-red-50 dark:bg-red-500/15 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-100 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-foreground leading-tight mt-2">
                {event.title}
              </h1>
            </div>

            {/* ORGANIZER PROFILE */}
            <div className="flex items-center justify-between mt-4">
              <Link href={`/organizations/${event.organization_id}`}>
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                    {event.organization_profiles?.name?.charAt(0) || 'O'}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm md:text-base font-bold text-foreground group-hover:text-blue-600 transition-colors">
                        {event.organization_profiles?.name || 'Organization'}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Verified Organization</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* LOGISTICS & INFO GRID */}
          <div className="px-5 md:px-0 py-6">
            <div className="bg-muted rounded-[24px] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Know Before You Go</h3>
                <Sparkles className="w-4 h-4 text-amber-500 opacity-50" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {/* DATE LOGISTIC */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm border border-border shrink-0">
                    <Clock className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Timeline</p>
                    <p className="text-sm font-bold text-foreground">
                      {formatDate(event.event_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(event.start_time)} — {formatTime(event.end_time)}
                    </p>
                  </div>
                </div>

                {/* LOCATION LOGISTIC */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm border border-border shrink-0">
                    <MapPin className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Location</p>
                    <p className="text-sm font-bold text-foreground truncate max-w-[180px]">{event.location}</p>
                    <p className="text-xs text-muted-foreground">Tap map for directions</p>
                  </div>
                </div>

                {/* DRESS CODE LOGISTIC */}
                {event.dress_code && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm border border-border shrink-0">
                      <Footprints className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Dress Code</p>
                      <p className="text-sm font-bold text-foreground">{event.dress_code}</p>
                    </div>
                  </div>
                )}

                {/* POINT OF CONTACT LOGISTIC (Added for Concierge flow) */}
                {event.point_of_contact && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm border border-border shrink-0">
                      <User className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">On-Site Host</p>
                      <p className="text-sm font-bold text-foreground">{event.point_of_contact}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* MAP EMBED */}
              <div className="rounded-2xl overflow-hidden h-40 relative group border border-border shadow-inner">
                <a
                  href={
                    event.latitude && event.longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
                      : `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full"
                >
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={
                      event.latitude && event.longitude
                        ? `https://maps.google.com/maps?q=${event.latitude},${event.longitude}&t=&z=17&ie=UTF8&iwloc=&output=embed`
                        : `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                    }
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                  ></iframe>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold text-foreground shadow-xl flex items-center gap-2 hover:bg-card transition-all transform group-hover:translate-y-[-2px]">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    Open Maps
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* --- THE AFTER: KINDLY EXCLUSIVE --- */}
          {event.connect_plan && (
            <div className="px-5 md:px-0 pb-10 mt-4">
              <div className="bg-[#064e3b] rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-emerald-800">
                <div className="absolute -top-8 -right-8 opacity-10">
                  <Coffee className="w-44 h-44 text-emerald-400" />
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-700/50">
                    <Coffee className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">The After</h3>
                    <p className="text-emerald-400/90 text-[10px] font-bold uppercase tracking-widest">Official Post-Event Hangout</p>
                  </div>
                </div>

                <p className="text-emerald-200 text-sm italic mb-4 font-medium pr-4">
                  Because the community is built after the work is done. Join your fellow volunteers to chill, network, and hang out.
                </p>

                <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-2xl p-5 mb-6 shadow-inner">
                  <p className="text-emerald-50 text-base md:text-lg leading-relaxed font-bold">
                    {event.connect_plan}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-black text-emerald-400 uppercase tracking-[0.15em] bg-emerald-950/50 w-fit px-5 py-2.5 rounded-2xl border border-emerald-800">
                  <Sparkles className="w-4 h-4" />
                  Curated Experience
                </div>
              </div>
            </div>
          )}

          {/* DESCRIPTION SECTION */}
          {event.description && (
            <div className="px-5 md:px-0 pb-8 border-b border-border md:border-0">
              <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                The Cause
              </h3>
              <p className="text-base text-muted-foreground leading-[1.8] font-medium">
                {showFullDescription ? event.description : shortDescription}
              </p>
              {event.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 mt-3 underline underline-offset-4"
                >
                  {showFullDescription ? "Show Less" : "Read Full Story"}
                </button>
              )}
            </div>
          )}

          {/* THINGS TO BRING SECTION */}
          {event.things_to_bring && (
            <div className="px-5 md:px-0 pb-8 pt-6">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3">Logistics Check</h3>
              <div className="p-5 bg-muted rounded-2xl border border-border">
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  <span className="text-foreground font-bold block mb-1">Items to bring:</span>
                  {event.things_to_bring}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT SIDEBAR: DESKTOP BOOKING CARD --- */}
        <div className="hidden md:block md:w-96">
          <div className="sticky top-10 bg-card rounded-[32px] shadow-2xl border border-border overflow-hidden">

            <div className="p-8 border-b border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  {!isFull && (
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1 animate-pulse">
                      Only {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left!
                    </p>
                  )}
                  <p className="text-3xl font-black text-foreground">{formatDate(event.event_date).split(',')[1]}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Arrival</p>
                  <p className="text-xl font-black text-foreground">{formatTime(event.start_time)}</p>
                </div>
              </div>

              {/* PARTICIPATION PROGRESS */}
              <div className="mb-2">
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-tight">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {event.registered_count || 0} Joined
                  </span>
                  <span>{isUnlimited ? 'Unlimited slots' : `Goal: ${event.total_slots}`}</span>
                </div>
                {!isUnlimited && (
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-inner"
                      style={{ width: `${((event.registered_count || 0) / event.total_slots) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="p-8 bg-muted/50">
              <Button
                onClick={openConfirmModal}
                disabled={isRegistering || !canRegister}
                className={cn(
                  "w-full h-14 font-black rounded-2xl text-lg shadow-2xl transition-all active:scale-95 disabled:opacity-50",
                  isRegistered
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-foreground/30"
                )}
              >
                {isRegistering ? <Loader2 className="w-5 h-5 animate-spin" />
                  : isRegistered ? 'Joined! ✓'
                    : !isRegistrationOpen ? 'Entry Closed'
                      : isFull ? 'Event Full'
                        : 'Book My Slot'}
              </Button>

              <div className="flex flex-col gap-2 mt-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Free Access</span>
                  <span className="w-1 h-1 bg-muted rounded-full mx-1"></span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Instant Entry</span>
                </div>

                {!isRegistrationOpen && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/15 rounded-xl border border-red-100 mt-2">
                    <p className="text-center text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                      Registration ended on {new Date(event.registration_deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CALENDAR ADDER */}
            <div className="px-8 pb-8 bg-muted/50">
              <button className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-blue-200 hover:bg-blue-50 dark:bg-blue-500/15/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center group-hover:bg-blue-100 dark:bg-blue-500/15 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground uppercase tracking-tight">Sync to Calendar</p>
                  <p className="text-[10px] text-muted-foreground">Get notified 1h before start</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- RSVP CONFIRMATION MODAL --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />

          {/* Sheet / Card */}
          <div className="relative w-full md:max-w-md bg-card md:rounded-3xl rounded-t-3xl px-6 pt-6 pb-10 md:pb-8 shadow-2xl z-10">
            {/* Handle bar (mobile) */}
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5 md:hidden" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Commitment Required</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Please read before confirming</p>
              </div>
            </div>

            {/* Body */}
            <div className="bg-muted rounded-2xl p-4 mb-5 border border-border">
              <p className="text-sm text-foreground leading-relaxed">
                You are committing to{' '}
                <span className="font-bold text-foreground">
                  {(() => {
                    if (!event.start_time || !event.end_time) return 'several hours'
                    const [sh, sm] = event.start_time.split(':').map(Number)
                    const [eh, em] = event.end_time.split(':').map(Number)
                    const total = Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
                    if (total === 0) return 'a short time'
                    const h = Math.floor(total / 60)
                    const m = total % 60
                    if (h === 0) return `${m} minute${m !== 1 ? 's' : ''}`
                    if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`
                    return `${h} hr ${m} min`
                  })()}
                </span>{' '}
                for <span className="font-bold text-foreground">{event.title}</span>.
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Organizations rely on accurate headcounts to plan resources and volunteers. Please only register if you intend to attend.
              </p>
            </div>

            {/* T&C Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer mb-6 group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-md border-2 border-border peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                  {agreedToTerms && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{' '}
                <Link href="/legal/terms" className="font-semibold text-foreground underline underline-offset-2" onClick={() => setShowConfirmModal(false)}>
                  Terms &amp; Conditions
                </Link>
                {' '}and{' '}
                <Link href="/legal/privacy" className="font-semibold text-foreground underline underline-offset-2" onClick={() => setShowConfirmModal(false)}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-12 rounded-2xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={executeRegistration}
                disabled={!agreedToTerms || isRegistering}
                className="flex-1 h-12 bg-primary hover:bg-primary text-primary-foreground font-black rounded-2xl text-sm shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Registration'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MOBILE STICKY FOOTER --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-50 md:hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            {!isFull && (
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-none mb-1">
                {slotsLeft} Slot{slotsLeft !== 1 ? 's' : ''} Left
              </p>
            )}
            <p className="text-lg font-black text-foreground leading-none">
              {formatDate(event.event_date).split(',')[0]}
            </p>
            <p className="text-xs text-muted-foreground font-medium">{formatTime(event.start_time)}</p>
          </div>
          <Button
            onClick={openConfirmModal}
            disabled={isRegistering || !canRegister}
            className={cn(
              "h-14 px-8 font-black rounded-2xl text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50",
              isRegistered ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
            )}
          >
            {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" />
              : isRegistered ? 'Joined! ✓'
                : !isRegistrationOpen ? 'Closed'
                  : isFull ? 'Full'
                    : 'Book Slot'}
          </Button>
        </div>
      </div>

      {showPhoneModal && (
        <PhoneVerificationModal
          onSaved={(phone) => {
            setUserPhone(phone)
            setShowPhoneModal(false)
            setAgreedToTerms(false)
            setShowConfirmModal(true)
          }}
          onClose={() => setShowPhoneModal(false)}
        />
      )}
    </div>
  )
}