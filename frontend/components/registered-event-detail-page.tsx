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
  Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

// Define formats outside to prevent re-renders
const QR_FORMATS: any = ['qr_code']

export default function RegisteredEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  
  const [showScanner, setShowScanner] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!eventId) return
      try {
        setLoading(true)
        const [eventRes, broadcastRes] = await Promise.all([
          api.getEventById(eventId),
          api.getEventBroadcasts(eventId)
        ])

        setEvent(eventRes.event)
        setBroadcasts(broadcastRes.broadcasts || [])
      } catch (error) {
        console.error("Failed to load event details", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [eventId])

  // --- Handlers ---
  const handleScan = useCallback(async (results: any[]) => {
    // 1. Safety Checks
    if (!results || results.length === 0 || checkingIn) return;
    const rawText = results[0]?.rawValue;
    if (!rawText) return;

    setCheckingIn(true) // Lock scanning
      
    try {
      // 2. Parse Code
      let qrData;
      try {
          qrData = JSON.parse(rawText);
      } catch (e) {
          throw new Error("Invalid QR Code. Please scan the official event code.");
      }

      if (qrData.eventId !== eventId) {
          throw new Error("This QR code is for a different event.");
      }

      // 3. Get Location
      if (!navigator.geolocation) throw new Error("Geolocation is required to verify you are at the venue.");
      
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              try {
                  // 4. Send to Backend
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
                  setTimeout(() => setCheckingIn(false), 3000); // Wait 3s before retry
              }
          },
          (geoError) => {
              alert("Location access denied. We need your location to verify you are at the venue.");
              setCheckingIn(false);
          },
          { enableHighAccuracy: true }
      );

    } catch (err: any) {
      alert(err.message);
      setTimeout(() => setCheckingIn(false), 3000);
    }
  }, [checkingIn, eventId]);

  const handleAddToCalendar = () => {
    if (!event) return
    const title = encodeURIComponent(event.title)
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
          text: `Join me at ${event.title}!`,
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ""
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  if (!event) return <div>Event not found</div>

  const shortDescription = event.description?.slice(0, 150) + "..." || ""

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8 relative">
      
      {/* --- SCANNER MODAL --- */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-sm relative">
            <button 
              onClick={() => { setShowScanner(false); setCheckingIn(false); }}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="p-4 bg-emerald-600 text-white text-center">
                    <h3 className="font-bold text-lg">Scan Event QR</h3>
                    <p className="text-xs opacity-90">Find the QR code on the Organizer's screen</p>
                </div>
                
                <div className="h-[300px] relative bg-black">
                    {/* Scanner Component - Props Fixed */}
                    <Scanner
                        onScan={handleScan}
                        formats={QR_FORMATS}
                        styles={{
                            container: { height: 300, width: '100%' },
                            video: { objectFit: 'cover' }
                        }}
                    />
                    
                    {/* Loading Overlay when checking in */}
                    {checkingIn && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                            <p className="text-white text-sm">Verifying Location...</p>
                        </div>
                    )}
                    
                    {/* Visual Frame */}
                    <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none flex items-center justify-center z-10">
                        <div className="w-48 h-48 border-2 border-emerald-500/50 rounded-lg animate-pulse relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1"></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 text-center text-xs text-gray-500">
                    Ensure your GPS is enabled. You must be within 200m of the venue.
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout Container */}
      <div className="md:flex md:max-w-6xl md:mx-auto md:gap-8 md:py-8 md:px-6">
        {/* Left Content Column */}
        <div className="md:flex-1">
          {/* Hero Image */}
          <div className="relative">
            <div className="relative h-[280px] md:h-[400px] md:rounded-2xl md:overflow-hidden bg-gray-100">
              <Image 
                src={event.cover_image_url || "/placeholder.svg"} 
                alt={event.title} 
                fill 
                className="object-cover" 
                priority 
              />

              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <Link href="/home">
                  <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-800" />
                  </button>
                </Link>

                <div className="flex gap-2">
                  <button onClick={handleShare} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-colors">
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

              <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">You're Registered!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title & Info */}
          <div className="px-4 md:px-0 pt-5 pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">{event.title}</h1>

            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full capitalize">
                {event.category}
              </span>
              {event.is_urgent && (
                <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Urgent
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                   {event.organization_profiles?.logo_url ? (
                      <Image
                        src={event.organization_profiles.logo_url}
                        alt={event.organization_profiles?.name}
                        width={36}
                        height={36}
                        className="object-cover"
                      />
                   ) : (
                      event.organization_profiles?.name?.charAt(0) || "O"
                   )}
                </div>
                <Link href={`/organizations/${event.organization_id}`} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                  <span className="text-sm font-medium text-gray-900">{event.organization_profiles?.name || "Organization"}</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                </Link>
              </div>
            </div>
          </div>

          {/* Know Before You Go */}
          <div className="px-4 md:px-0 pb-5">
            <div className="bg-[#F5F5F7] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Know Before You Go</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <Clock className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">When</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(event.event_date)} • {formatTime(event.start_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <MapPin className="w-4 h-4 text-coral-500" style={{ color: "#FF6B6B" }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Where</p>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <Footprints className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Dress</p>
                    <p className="text-sm font-medium text-gray-900">{event.dress_code || "Casual"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="text-sm font-medium text-gray-900">{event.minimum_age ? `${event.minimum_age}+` : "All Ages"}</p>
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

          {/* Broadcasts */}
          <div className="px-4 md:px-0 pb-5">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Megaphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Organizer Updates</h3>
                  <p className="text-xs text-gray-600">Important messages from {event.organization_profiles?.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                {broadcasts.length > 0 ? (
                  broadcasts.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        broadcast.is_important
                          ? "bg-white border-amber-200 shadow-sm"
                          : "bg-amber-50/50 border-amber-100/50"
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {broadcast.is_important && (
                          <div className="mt-0.5">
                            <Bell className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                        )}
                        <p className="text-sm text-gray-900 leading-relaxed flex-1">{broadcast.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 ml-5">
                        {new Date(broadcast.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'})}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Megaphone className="w-8 h-8 text-amber-200 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-gray-500">No updates yet</p>
                    <p className="text-xs text-gray-400 mt-1">Check back later for messages</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Map */}
          <div className="px-4 md:px-0 pb-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Location</h3>
            
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative rounded-xl overflow-hidden h-[160px] md:h-[200px] group transition-all hover:shadow-lg border border-gray-100"
            >
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="absolute inset-0 w-full h-full pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity"
              ></iframe>

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-lg group-hover:scale-105 transition-transform z-10">
                <Navigation className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span className="text-sm font-bold text-gray-900">Get Directions</span>
              </div>
            </a>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="hidden md:block md:w-[340px]">
          <div className="sticky top-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Registration Confirmed</p>
                  <p className="text-xs text-emerald-600">ID: {event.id.substring(0,8).toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Event Date</span>
                  <span className="font-semibold text-gray-900">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start Time</span>
                  <span className="font-semibold text-gray-900">{formatTime(event.start_time)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <Button onClick={handleAddToCalendar} className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-full text-sm shadow-lg shadow-blue-500/25">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>

              <Button
                onClick={() => setShowScanner(true)}
                className="w-full h-11 bg-[#1d1d1f] hover:bg-[#323235] text-white font-semibold rounded-full text-sm shadow-md flex items-center justify-center"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan to Check In
              </Button>

              <p className="text-center text-xs text-gray-500 pt-2">Scan the Organizer's QR code when you arrive</p>
            </div>

            <div className="px-5 pb-5">
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-medium text-blue-800 mb-1">Need Help?</p>
                <p className="text-xs text-blue-600">Contact {event.organization_profiles?.email || "the organizer"} for queries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] z-50 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <div>
              <p className="text-xs text-white/90 font-medium">Confirmed</p>
              <p className="text-sm font-bold text-white">{formatDate(event.event_date)}</p>
            </div>
          </div>
          <Button onClick={() => setShowScanner(true)} className="h-10 px-4 bg-white hover:bg-gray-50 text-emerald-600 font-semibold rounded-full text-sm shadow-lg flex items-center">
            <Camera className="w-4 h-4 mr-1.5" />
            Scan Check In
          </Button>
        </div>
      </div>
    </div>
  )
}