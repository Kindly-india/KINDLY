"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Scanner } from '@yudiel/react-qr-scanner'
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
  Megaphone,
  Bell,
  Loader2,
  Calendar as CalendarIcon,
  QrCode,
  X,
  Camera,
  Coffee,
  ShieldCheck,
  Sparkles,
  Info,
  AlertCircle,
  Phone,
  MessageSquare,
  Award,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, VolunteerCertificate } from "@/lib/api"
import { cn, downloadFromUrl } from "@/lib/utils"

// Define formats outside to prevent re-renders in the scanner
const QR_FORMATS: any = ['qr_code']

export default function RegisteredEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  // --- UI & DATA STATE ---
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // --- SCANNER & CHECK-IN STATE ---
  const [showScanner, setShowScanner] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [geoBlocked, setGeoBlocked] = useState(false)

  // --- CERTIFICATE STATE ---
  const [cert, setCert] = useState<VolunteerCertificate | null>(null)
  const [downloadingCert, setDownloadingCert] = useState(false)

  // --- CANCEL RSVP STATE ---
  const [cancellingRsvp, setCancellingRsvp] = useState(false)

  const handleOpenScanner = () => {
    if (!navigator.geolocation) {
      setGeoBlocked(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => { setGeoBlocked(false); setShowScanner(true) },
      () => { setGeoBlocked(true) },
      { timeout: 8000 }
    )
  }

  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return
      try {
        setLoading(true)
        const [eventRes, broadcastRes, certRes] = await Promise.all([
          api.getEventById(eventId),
          api.getEventBroadcasts(eventId),
          api.getMyCertificates().catch(() => ({ certificates: [] }))
        ])

        setEvent(eventRes.event)
        setBroadcasts(broadcastRes.broadcasts || [])

        const myCert = certRes.certificates.find((c: VolunteerCertificate) => c.event_id === eventId)
        if (myCert) setCert(myCert)
      } catch (error) {
        console.error("Failed to load event details", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [eventId])

  // --- HANDLERS ---

  /**
   * handleScan
   * Processes the QR result, validates the event ID, fetches high-accuracy GPS,
   * and verifies the volunteer's presence at the venue via the backend.
   */
  const handleScan = useCallback(async (results: any[]) => {
    if (!results || results.length === 0 || checkingIn) return;
    const rawText = results[0]?.rawValue;
    if (!rawText) return;

    setCheckingIn(true); // Prevent concurrent check-in attempts

    try {
      let qrData;
      try {
        qrData = JSON.parse(rawText);
      } catch (e) {
        throw new Error("Invalid QR Code. Please scan the official event code.");
      }

      if (qrData.eventId !== eventId) {
        throw new Error("This QR code is for a different event.");
      }

      if (!navigator.geolocation) {
        throw new Error("Geolocation is required to verify your arrival.");
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.selfCheckIn({
              eventId: eventId,
              code: qrData.code,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });

            alert("Check-in Successful! Welcome to the event.");
            setShowScanner(false);
            window.location.reload();
          } catch (apiError: any) {
            alert(apiError.message || "Check-in failed.");
            setTimeout(() => setCheckingIn(false), 3000);
          }
        },
        (geoError) => {
          alert("Location access denied. We need GPS to confirm you're at the venue.");
          setCheckingIn(false);
        },
        { enableHighAccuracy: true }
      );

    } catch (err: any) {
      alert(err.message);
      setTimeout(() => setCheckingIn(false), 3000);
    }
  }, [checkingIn, eventId]);

  const canCancelRsvp = () => {
    if (!event || event.status !== 'published') return false
    const eventStart = new Date(`${event.event_date}T${event.start_time}:00+05:30`)
    return new Date() < new Date(eventStart.getTime() - 2 * 60 * 60 * 1000)
  }

  const handleCancelRsvp = async () => {
    if (!confirm('Are you sure you want to cancel your registration? This cannot be undone.')) return
    try {
      setCancellingRsvp(true)
      await api.cancelRsvp(eventId)
      router.push('/home')
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration')
      setCancellingRsvp(false)
    }
  }

  const handleCertDownload = async () => {
    if (!cert) return
    setDownloadingCert(true)
    try {
      const { signedUrl } = await api.downloadCertificate(cert.id)
      await downloadFromUrl(signedUrl, 'kindly-certificate.pdf')
    } catch (err: any) {
      alert(err.message || "Failed to get download link")
    } finally {
      setDownloadingCert(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!event) return
    const title = encodeURIComponent(`KINDLY: ${event.title}`)
    const details = encodeURIComponent(event.description || "")
    const location = encodeURIComponent(event.location || "")
    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}`).toISOString().replace(/-|:|\.\d\d\d/g, "")
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}`).toISOString().replace(/-|:|\.\d\d\d/g, "")
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`
    window.open(url, '_blank')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `I'm volunteering for ${event.title} in Nashik! Join me?`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing", err)
      }
    } else {
      alert("Link copied to clipboard!")
      navigator.clipboard.writeText(window.location.href)
    }
  }

  // --- FORMATTING HELPERS ---

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ""
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }

  // --- RENDER LOGIC ---

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4 mx-auto" />
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Securing Logistics...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Event Not Found</h2>
        <Link href="/home" className="mt-4 text-emerald-600 font-medium hover:underline">Return to Dashboard</Link>
      </div>
    )
  }

  const shortDescription = event.description?.slice(0, 150) + "..." || ""

  return (
    <div className="min-h-screen bg-white pb-40 md:pb-12 relative overflow-x-hidden">

      {/* --- SCANNER OVERLAY MODAL --- */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="w-full max-w-sm relative">
            <button
              onClick={() => { setShowScanner(false); setCheckingIn(false); }}
              className="absolute -top-14 right-0 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl relative border border-gray-100">
              <div className="p-6 bg-[#064e3b] text-white text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-black text-xl tracking-tight">Arrival Check-In</h3>
                <p className="text-xs text-emerald-200 mt-1">Scan the code provided by the organizer</p>
              </div>

              <div className="h-[320px] relative bg-black">
                <Scanner
                  onScan={handleScan}
                  formats={QR_FORMATS}
                  styles={{
                    container: { height: 320, width: '100%' },
                    video: { objectFit: 'cover' }
                  }}
                />

                {checkingIn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                    <p className="text-white text-sm font-bold tracking-tight">Verifying Location...</p>
                  </div>
                )}

                {/* UI Guide Frame */}
                <div className="absolute inset-0 border-[50px] border-black/40 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-52 h-52 border-2 border-emerald-500/50 rounded-3xl animate-pulse relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-xl"></div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  Geo-Lock Active (200m)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN LAYOUT --- */}
      <div className="md:flex md:max-w-6xl md:mx-auto md:gap-10 md:py-10 md:px-8">

        {/* LEFT CONTENT COLUMN */}
        <div className="md:flex-1">

          {/* HERO IMAGE SECTION */}
          <div className="relative">
            <div className="relative h-72 md:h-110 md:rounded-[40px] md:overflow-hidden md:shadow-2xl md:border border-gray-100">
              <img
                src={event.cover_image_url || "/placeholder.svg"}
                alt={event.title}
                className="w-full h-full object-cover"
              />

              {/* NAVIGATION OVERLAYS */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <Link href="/home">
                  <button className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <ArrowLeft className="w-5 h-5 text-gray-900" />
                  </button>
                </Link>

                <div className="flex gap-2">
                  <button onClick={handleShare} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:scale-105 transition-all">
                    <Share2 className="w-5 h-5 text-gray-900" />
                  </button>
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:scale-105 transition-all"
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-gray-900"}`}
                    />
                  </button>
                </div>
              </div>

              {/* CONFIRMATION BADGE */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2.5 px-6 py-3 bg-emerald-500 text-white rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-black tracking-tight uppercase">Reservation Secured</span>
                </div>
              </div>
            </div>
          </div>

          {/* HEADER INFO */}
          <div className="px-5 md:px-0 pt-8 pb-6 border-b border-gray-100 md:border-0">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-emerald-100">
                  {event.category}
                </span>
                {event.is_urgent && (
                  <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-100 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mt-2">
                {event.title}
              </h1>
            </div>

            {/* ORGANIZER PROFILE CARD */}
            <div className="flex items-center justify-between mt-4">
              <Link href={`/organizations/${event.organization_id}`}>
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                    {event.organization_profiles?.name?.charAt(0) || 'O'}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm md:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {event.organization_profiles?.name || 'Organization'}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Verified Host</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* LOGISTICS GRID (Know Before You Go) */}
          <div className="px-5 md:px-0 py-6">
            <div className="bg-[#F5F5F7] rounded-[32px] p-6 md:p-10 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Mission Logistics</h3>
                <Sparkles className="w-5 h-5 text-amber-500 opacity-50" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                {/* TIMELINE */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    <Clock className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Timeline</p>
                    <p className="text-base font-bold text-gray-900">
                      {formatDate(event.event_date)}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {formatTime(event.start_time)} — {formatTime(event.end_time)}
                    </p>
                  </div>
                </div>

                {/* VENUE */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    <MapPin className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Venue</p>
                    <p className="text-base font-bold text-gray-900 truncate max-w-[180px]">{event.location}</p>
                    <p className="text-sm text-gray-500 font-medium">Nashik, Maharashtra</p>
                  </div>
                </div>

                {/* ON-SITE HOST (The Concierge Addition) */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    <User className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">On-Site Host</p>
                    <p className="text-base font-bold text-gray-900">
                      {event.point_of_contact || "Event Coordinator"}
                    </p>
                    <p className="text-sm text-gray-500 font-medium italic">Look for this person</p>
                  </div>
                </div>

                {/* DRESS CODE */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    <Footprints className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Dress Code</p>
                    <p className="text-base font-bold text-gray-900">{event.dress_code || "Comfortable / Casual"}</p>
                    <p className="text-sm text-gray-500 font-medium">Prepare accordingly</p>
                  </div>
                </div>
              </div>

              {/* MAP EMBED (Fixed Standard Embed) */}
              <div className="rounded-[24px] overflow-hidden h-44 relative group border border-gray-200 shadow-inner bg-gray-100">
                <a
                  href={
                    event.latitude && event.longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
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
                        : `https://googleusercontent.com/maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                    }
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                  ></iframe>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl text-xs font-black text-gray-900 shadow-2xl flex items-center gap-2 hover:bg-white transition-all transform group-hover:translate-y-[-2px]">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    Launch Directions
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
          <div className="px-5 md:px-0 pb-10">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3">
              <Info className="w-6 h-6 text-blue-500" />
              The Story & Mission
            </h3>
            <p className="text-base text-gray-600 leading-[1.9] font-medium">
              {showFullDescription ? event.description : shortDescription}
            </p>
            {event.description?.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-sm font-black text-blue-600 hover:text-blue-700 mt-4 underline underline-offset-4 decoration-2"
              >
                {showFullDescription ? "Show Less" : "Read Full Mission"}
              </button>
            )}
          </div>

          {/* ORGANIZER BROADCAST UPDATES */}
          <div className="px-5 md:px-0 pb-12">
            <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] rounded-[32px] p-8 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[20px] bg-amber-400 flex items-center justify-center shadow-lg border-2 border-white/50">
                  <Megaphone className="w-6 h-6 text-amber-900" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-900 tracking-tight">Mission Briefings</h3>
                  <p className="text-xs text-amber-800/70 font-bold uppercase tracking-wider">From {event.organization_profiles?.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                {broadcasts.length > 0 ? (
                  broadcasts.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className={cn(
                        "p-5 rounded-2xl border transition-all",
                        broadcast.is_important
                          ? "bg-white border-amber-300 shadow-md"
                          : "bg-amber-50/60 border-amber-200/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {broadcast.is_important && (
                          <div className="mt-1">
                            <Bell className="w-4 h-4 text-amber-600 fill-amber-500" />
                          </div>
                        )}
                        <p className="text-sm md:text-base text-gray-900 leading-relaxed font-bold flex-1">{broadcast.message}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-4 ml-7 text-xs font-bold text-amber-600/60 uppercase tracking-tighter">
                        <Clock className="w-3 h-3" />
                        {new Date(broadcast.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-white/40 rounded-2xl border border-dashed border-amber-300/50">
                    <Megaphone className="w-10 h-10 text-amber-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-amber-800/60">No new updates yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* --- RIGHT SIDEBAR: BOOKING STATUS (Desktop) --- */}
        <div className="hidden md:block md:w-96">
          <div className="sticky top-10 bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">

            {/* Status Header */}
            <div className="p-10 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-white/30">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-emerald-900 tracking-tight mb-1">Confirmed</h2>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Registration ID: {event.id.substring(0, 8)}</p>
            </div>

            {/* Quick Actions */}
            <div className="p-10 space-y-4">
              <Button
                onClick={handleAddToCalendar}
                variant="outline"
                className="w-full h-14 border-gray-200 rounded-2xl font-black text-gray-900 hover:bg-gray-50 flex items-center justify-center gap-3 transition-all"
              >
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                Add to Calendar
              </Button>

              <Button
                onClick={handleOpenScanner}
                className="w-full h-16 bg-gray-900 hover:bg-black text-white font-black rounded-2xl text-lg shadow-2xl flex items-center justify-center gap-3 group transition-all active:scale-95"
              >
                <Camera className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Scan to Check In
              </Button>

              {geoBlocked && (
                <p className="text-center text-xs text-red-500 font-medium px-2">
                  Location required to check in. Please enable location in your browser settings and try again.
                </p>
              )}

              <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4">
                Scan arrival QR to log hours
              </p>

              {/* Certificate Download */}
              {cert && (
                <button
                  onClick={handleCertDownload}
                  disabled={downloadingCert}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-black rounded-2xl transition-all disabled:opacity-60"
                >
                  {downloadingCert
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Award className="w-5 h-5 text-amber-500" />
                  }
                  Download Certificate
                </button>
              )}

              {/* Cancel RSVP */}
              {canCancelRsvp() ? (
                <button
                  onClick={handleCancelRsvp}
                  disabled={cancellingRsvp}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-sm rounded-2xl transition-all disabled:opacity-50"
                >
                  {cancellingRsvp ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Cancel Registration
                </button>
              ) : event?.status === 'published' ? (
                <p className="text-center text-[11px] text-gray-400 font-medium pt-1">
                  Cancellations are closed — event starts in less than 2 hours
                </p>
              ) : null}
            </div>

            {/* Support Block */}
            <div className="px-10 pb-10">
              <div className="p-6 bg-blue-50 rounded-[28px] border border-blue-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900 uppercase tracking-tight mb-0.5">Need Help?</p>
                  <p className="text-[11px] text-blue-700 font-medium">Contact organization at {event.organization_profiles?.email || "the help desk"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE: CERTIFICATE BLOCK (shown above footer when cert exists) --- */}
      {cert && (
        <div className="mx-4 mb-4 md:hidden">
          <button
            onClick={handleCertDownload}
            disabled={downloadingCert}
            className="w-full flex items-center justify-center gap-3 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 font-black text-sm shadow-sm active:scale-95 transition-all disabled:opacity-60"
          >
            {downloadingCert
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Download className="w-5 h-5 text-amber-500" />
            }
            Download My Certificate
          </button>
        </div>
      )}

      {/* --- MOBILE: CANCEL RSVP --- */}
      {canCancelRsvp() ? (
        <div className="mx-4 mb-3 md:hidden">
          <button
            onClick={handleCancelRsvp}
            disabled={cancellingRsvp}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {cancellingRsvp ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Cancel My Registration
          </button>
        </div>
      ) : event?.status === 'published' ? (
        <p className="text-center text-[11px] text-gray-400 font-medium mb-3 md:hidden">
          Cancellations closed — event starts in less than 2 hours
        </p>
      ) : null}

      {/* --- MOBILE STICKY NAVIGATION (High Impact) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] z-[60] md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex flex-col">
            <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em] mb-1 leading-none">Arrival Time</p>
            <p className="text-xl font-black text-white leading-none tracking-tight">
              {formatTime(event.start_time)}
            </p>
          </div>

          <Button
            onClick={handleOpenScanner}
            className="h-14 px-8 bg-white hover:bg-gray-100 text-emerald-700 font-black rounded-2xl text-sm shadow-2xl flex items-center gap-3 transition-all active:scale-95"
          >
            <Camera className="w-5 h-5" />
            CHECK IN
          </Button>
        </div>
      </div>
    </div>
  )
}