"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
  Megaphone,
  Bell,
  Loader2,
  Calendar as CalendarIcon,
  X,
  Coffee,
  ShieldCheck,
  Sparkles,
  Info,
  AlertCircle,
  MessageSquare,
  Award,
  Download,
  LocateFixed,
  MapPinOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api, VolunteerCertificate } from "@/lib/api"
import { cn, downloadFromUrl } from "@/lib/utils"

// Client-side Haversine distance (metres) — mirrors backend 200m geofence logic
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type CheckInState =
  | 'idle'             // haven't tapped yet
  | 'denied'           // geolocation permission denied
  | 'fetching'         // waiting for GPS fix — then fires check-in immediately
  | 'too_far'          // outside 200m or GPS unavailable
  | 'checking_in'      // API call in flight
  | 'success'          // just checked in
  | 'already_checked_in' // was checked in before page load

export default function RegisteredEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  // ── data state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  // ── check-in state machine ────────────────────────────────────────────────────
  const [checkInState, setCheckInState] = useState<CheckInState>('idle')
  const [locationError, setLocationError] = useState('')   // subtext for too_far
  const [retryCountdown, setRetryCountdown] = useState(0)

  // ── other state ───────────────────────────────────────────────────────────────
  const [cert, setCert] = useState<VolunteerCertificate | null>(null)
  const [downloadingCert, setDownloadingCert] = useState(false)
  const [cancellingRsvp, setCancellingRsvp] = useState(false)

  // ── retry countdown when too_far ──────────────────────────────────────────────
  useEffect(() => {
    if (checkInState !== 'too_far') return
    setRetryCountdown(30)
    const id = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [checkInState])

  // ── auto-dismiss success overlay after 2s ────────────────────────────────────
  useEffect(() => {
    if (checkInState !== 'success') return
    const id = setTimeout(() => setCheckInState('already_checked_in'), 2000)
    return () => clearTimeout(id)
  }, [checkInState])

  // ── initial data load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return
      try {
        setLoading(true)
        const [eventRes, broadcastRes, certRes, regsRes] = await Promise.all([
          api.getEventById(eventId),
          api.getEventBroadcasts(eventId),
          api.getMyCertificates().catch(() => ({ certificates: [] })),
          api.getVolunteerRegistrations().catch(() => ({ events: [] })),
        ])

        setEvent(eventRes.event)
        setBroadcasts(broadcastRes.broadcasts || [])

        const myCert = certRes.certificates.find(
          (c: VolunteerCertificate) => c.event_id === eventId
        )
        if (myCert) setCert(myCert)

        // Detect already-checked-in before this session
        const myReg = regsRes.events?.find((e: any) => e.id === eventId)
        if (
          myReg?.registration_status === 'checked_in' ||
          myReg?.registration_status === 'completed'
        ) {
          setCheckInState('already_checked_in')
        }
      } catch (err) {
        console.error('Failed to load event details', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [eventId])

  // ── single-tap check-in: get location then call API immediately ───────────────

  const handleCheckIn = async () => {
    // Guard: event must have started
    if (event?.event_date && event?.start_time) {
      const eventStart = new Date(`${event.event_date}T${event.start_time}+05:30`)
      if (!isNaN(eventStart.getTime()) && new Date() < eventStart) {
        alert(`Check-in opens at ${formatTime(event.start_time)}`)
        return
      }
    }

    if (!navigator.geolocation) {
      setCheckInState('denied')
      return
    }

    setLocationError('')
    setCheckInState('fetching')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        // Client-side distance pre-check
        if (event?.latitude && event?.longitude) {
          const dist = haversineDistance(event.latitude, event.longitude, lat, lng)
          if (dist > 200) {
            setLocationError('You need to be at the event location to check in')
            setCheckInState('too_far')
            return
          }
        }

        // Location verified — fire API immediately (one tap!)
        setCheckInState('checking_in')
        try {
          await api.selfCheckIn({ eventId, latitude: lat, longitude: lng })
          setCheckInState('success')
        } catch (err: any) {
          const msg: string = err.message || ''
          if (msg.toLowerCase().includes('within')) {
            setLocationError('You need to be at the event location to check in')
            setCheckInState('too_far')
          } else {
            alert(msg || 'Check-in failed. Please try again.')
            setCheckInState('idle')
          }
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setCheckInState('denied')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Turn on your device GPS / Location Services and try again')
          setCheckInState('too_far')
        } else {
          setLocationError("Couldn't get your location. Make sure GPS is on and try again.")
          setCheckInState('too_far')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── other handlers (unchanged) ────────────────────────────────────────────────

  const canCancelRsvp = () => {
    if (!event || event.status !== 'published') return false
    const eventStart = new Date(`${event.event_date}T${event.start_time}+05:30`)
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
      alert(err.message || 'Failed to get download link')
    } finally {
      setDownloadingCert(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!event) return
    const title = encodeURIComponent(`KINDLY: ${event.title}`)
    const details = encodeURIComponent(event.description || '')
    const location = encodeURIComponent(event.location || '')
    const startDate = new Date(`${event.event_date}T${event.start_time || '00:00'}`).toISOString().replace(/-|:|\.\d\d\d/g, '')
    const endDate = new Date(`${event.event_date}T${event.end_time || '23:59'}`).toISOString().replace(/-|:|\.\d\d\d/g, '')
    window.open(
      `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`,
      '_blank'
    )
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `I'm volunteering for ${event.title}! Join me?`,
          url: window.location.href,
        })
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
  }

  // ── loading / error ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Securing Logistics...</p>
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

  const shortDescription = event.description?.slice(0, 150) + '...' || ''
  const isCheckedIn = checkInState === 'already_checked_in' || checkInState === 'success'

  // ── derived check-in button content ──────────────────────────────────────────

  const CheckInButton = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    const base = `${fullWidth ? 'w-full' : 'h-14 px-6'} h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95`

    if (checkInState === 'idle') return (
      <button onClick={handleCheckIn} className={cn(base, 'bg-gray-900 text-white shadow-xl hover:bg-black')}>
        <LocateFixed className="w-5 h-5" />
        Tap to Check In
      </button>
    )
    if (checkInState === 'denied') return (
      <button disabled className={cn(base, 'bg-gray-200 text-gray-400 cursor-not-allowed')}>
        <MapPinOff className="w-5 h-5" />
        Check In
      </button>
    )
    if (checkInState === 'fetching') return (
      <button disabled className={cn(base, 'bg-gray-200 text-gray-500 cursor-not-allowed')}>
        <Loader2 className="w-5 h-5 animate-spin" />
        Getting your location...
      </button>
    )
    if (checkInState === 'too_far') return (
      <button disabled className={cn(base, 'bg-gray-200 text-gray-400 cursor-not-allowed')}>
        <MapPinOff className="w-5 h-5" />
        Check In
      </button>
    )
    if (checkInState === 'checking_in') return (
      <button disabled className={cn(base, 'bg-emerald-500/60 text-white cursor-not-allowed')}>
        <Loader2 className="w-5 h-5 animate-spin" />
        Checking you in...
      </button>
    )
    return null
  }

  const CheckInSubtext = () => {
    if (checkInState === 'denied') return (
      <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
        Enable location access in your browser settings to check in
      </p>
    )
    if (checkInState === 'fetching') return (
      <p className="text-xs text-gray-500 text-center mt-2">Verifying your location...</p>
    )
    if (checkInState === 'too_far') {
      // GPS/unavailable errors should skip the countdown and show actionable text
      const isGpsError = locationError.toLowerCase().includes('gps') || locationError.toLowerCase().includes("couldn't get")
      return (
        <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
          {locationError || 'You need to be at the event location to check in'}
          {!isGpsError && retryCountdown > 0
            ? <span className="text-gray-400"> · Retry in {retryCountdown}s</span>
            : <button onClick={handleCheckIn} className="ml-1 text-blue-500 font-semibold hover:underline">Try again</button>
          }
        </p>
      )
    }
    return null
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white pb-36 md:pb-12 relative overflow-x-hidden">

      {/* ── SUCCESS OVERLAY (full-screen, auto-dismisses after 2s) ── */}
      {checkInState === 'success' && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-2xl animate-bounce">
            <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">You're checked in ✓</h1>
          <p className="text-lg font-bold text-gray-500 text-center mb-2">{event.title}</p>
          <p className="text-3xl mt-4">Enjoy your time 🙌</p>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div className="md:flex md:max-w-6xl md:mx-auto md:gap-10 md:py-10 md:px-8">

        {/* LEFT CONTENT COLUMN */}
        <div className="md:flex-1">

          {/* HERO */}
          <div className="relative">
            <div className="relative h-72 md:h-110 md:rounded-[40px] md:overflow-hidden md:shadow-2xl md:border border-gray-100">
              <img
                src={event.cover_image_url || '/placeholder.svg'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
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
                    <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
                  </button>
                </div>
              </div>

              {/* Already-checked-in badge on hero */}
              {isCheckedIn ? (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <div className="flex items-center gap-2.5 px-6 py-3 bg-emerald-500 text-white rounded-full shadow-2xl border-2 border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-black tracking-tight uppercase">Checked In ✓</span>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <div className="flex items-center gap-2.5 px-6 py-3 bg-emerald-500 text-white rounded-full shadow-2xl border-2 border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-black tracking-tight uppercase">Reservation Secured</span>
                  </div>
                </div>
              )}
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
                    <AlertCircle className="w-3 h-3" /> Urgent
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mt-2">{event.title}</h1>
            </div>

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

          {/* LOGISTICS GRID */}
          <div className="px-5 md:px-0 py-6">
            <div className="bg-[#F5F5F7] rounded-[32px] p-6 md:p-10 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Mission Logistics</h3>
                <Sparkles className="w-5 h-5 text-amber-500 opacity-50" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    <Clock className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Timeline</p>
                    <p className="text-base font-bold text-gray-900">{formatDate(event.event_date)}</p>
                    <p className="text-sm text-gray-500 font-medium">
                      {formatTime(event.start_time)} — {formatTime(event.end_time)}
                    </p>
                  </div>
                </div>

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

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    <User className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">On-Site Host</p>
                    <p className="text-base font-bold text-gray-900">{event.point_of_contact || 'Event Coordinator'}</p>
                    <p className="text-sm text-gray-500 font-medium italic">Look for this person</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    <Footprints className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Dress Code</p>
                    <p className="text-base font-bold text-gray-900">{event.dress_code || 'Comfortable / Casual'}</p>
                    <p className="text-sm text-gray-500 font-medium">Prepare accordingly</p>
                  </div>
                </div>
              </div>

              {/* MAP */}
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
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl text-xs font-black text-gray-900 shadow-2xl flex items-center gap-2 hover:bg-white transition-all transform group-hover:translate-y-[-2px]">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    Launch Directions
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* THE AFTER */}
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
                  Because the community is built after the work is done.
                </p>
                <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-2xl p-5 mb-6 shadow-inner">
                  <p className="text-emerald-50 text-base md:text-lg leading-relaxed font-bold">{event.connect_plan}</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-black text-emerald-400 uppercase tracking-[0.15em] bg-emerald-950/50 w-fit px-5 py-2.5 rounded-2xl border border-emerald-800">
                  <Sparkles className="w-4 h-4" />
                  Curated Experience
                </div>
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
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
                {showFullDescription ? 'Show Less' : 'Read Full Mission'}
              </button>
            )}
          </div>

          {/* BROADCASTS */}
          <div className="px-5 md:px-0 pb-12">
            <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] rounded-[32px] p-8 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[20px] bg-amber-400 flex items-center justify-center shadow-lg border-2 border-white/50">
                  <Megaphone className="w-6 h-6 text-amber-900" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-900 tracking-tight">Mission Briefings</h3>
                  <p className="text-xs text-amber-800/70 font-bold uppercase tracking-wider">
                    From {event.organization_profiles?.name}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {broadcasts.length > 0 ? (
                  broadcasts.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        'p-5 rounded-2xl border transition-all',
                        b.is_important ? 'bg-white border-amber-300 shadow-md' : 'bg-amber-50/60 border-amber-200/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {b.is_important && <Bell className="w-4 h-4 text-amber-600 fill-amber-500 mt-1 shrink-0" />}
                        <p className="text-sm md:text-base text-gray-900 leading-relaxed font-bold flex-1">{b.message}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-4 ml-7 text-xs font-bold text-amber-600/60 uppercase tracking-tighter">
                        <Clock className="w-3 h-3" />
                        {new Date(b.created_at).toLocaleString([], {
                          hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
                        })}
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

        {/* ── DESKTOP SIDEBAR ── */}
        <div className="hidden md:block md:w-96">
          <div className="sticky top-10 bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">

            {/* Status header */}
            <div className="p-10 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100 text-center">
              <div className={cn(
                'w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-white/30',
                isCheckedIn ? 'bg-emerald-500' : 'bg-emerald-500'
              )}>
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-emerald-900 tracking-tight mb-1">
                {isCheckedIn ? 'Checked In ✓' : 'Confirmed'}
              </h2>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                {isCheckedIn ? event.title : `Registration ID: ${event.id.substring(0, 8)}`}
              </p>
            </div>

            <div className="p-10 space-y-4">
              <Button
                onClick={handleAddToCalendar}
                variant="outline"
                className="w-full h-14 border-gray-200 rounded-2xl font-black text-gray-900 hover:bg-gray-50 flex items-center justify-center gap-3"
              >
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                Add to Calendar
              </Button>

              {/* ── CHECK-IN STATES (desktop sidebar) ── */}
              {isCheckedIn ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-full w-full justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                    You're checked in ✓
                  </div>
                  <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    Your certificate and moment will be available once the organizer marks the event complete.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <CheckInButton fullWidth />
                    <CheckInSubtext />
                  </div>
                  <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">
                    Tap to check in with your location
                  </p>
                </>
              )}

              {/* Certificate */}
              {cert && (
                <button
                  onClick={handleCertDownload}
                  disabled={downloadingCert}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-black rounded-2xl transition-all disabled:opacity-60"
                >
                  {downloadingCert ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5 text-amber-500" />}
                  Download Certificate
                </button>
              )}

              {/* Cancel */}
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

            {/* Support block */}
            <div className="px-10 pb-10">
              <div className="p-6 bg-blue-50 rounded-[28px] border border-blue-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900 uppercase tracking-tight mb-0.5">Need Help?</p>
                  <p className="text-[11px] text-blue-700 font-medium">
                    Contact organization at {event.organization_profiles?.email || 'the help desk'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE: certificate ── */}
      {cert && (
        <div className="mx-4 mb-4 md:hidden">
          <button
            onClick={handleCertDownload}
            disabled={downloadingCert}
            className="w-full flex items-center justify-center gap-3 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 font-black text-sm shadow-sm active:scale-95 transition-all disabled:opacity-60"
          >
            {downloadingCert ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 text-amber-500" />}
            Download My Certificate
          </button>
        </div>
      )}

      {/* ── MOBILE: cancel RSVP ── */}
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

      {/* ── MOBILE STICKY BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden pb-[env(safe-area-inset-bottom)]">

        {/* Already checked in */}
        {isCheckedIn ? (
          <div className="bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-5 py-4">
            <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              You're checked in ✓
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-2 leading-relaxed">
              Hang tight — your moment unlocks once the org wraps up.
            </p>
          </div>
        ) : (
          /* Active check-in states */
          <div className="bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-5 pt-4 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] leading-none mb-1">Arrival</p>
                <p className="text-base font-black text-gray-900 leading-none">{formatTime(event.start_time)}</p>
              </div>
              <div className="flex-1">
                <CheckInButton fullWidth />
              </div>
            </div>
            <CheckInSubtext />
          </div>
        )}
      </div>

    </div>
  )
}
