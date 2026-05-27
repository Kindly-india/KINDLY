"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import {
  Calendar, MapPin, Users, Clock,
  Share2, CheckCircle2, Building2, Loader2,
  Download, Check, Menu, X, Sparkles,
  Star, Award
} from "lucide-react"
import { api, VolunteerCertificate, ShowcaseData } from "@/lib/api"
import { downloadFromUrl } from "@/lib/utils"

type AccessState = 'loading' | 'full' | 'waiting' | 'redirecting'

export default function EventShowcasePage() {
  const { id } = useParams()
  const router = useRouter()

  const [accessState, setAccessState] = useState<AccessState>('loading')
  const [event, setEvent] = useState<any>(null)
  const [orgProfile, setOrgProfile] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myRegistration, setMyRegistration] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Review State
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Certificate state
  const [cert, setCert] = useState<VolunteerCertificate | null>(null)
  const [downloadingCert, setDownloadingCert] = useState(false)

  // Gallery lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return

        // 1. Auth check — unauthenticated visitors go to the public event page
        const profileRes = await api.getUserProfile().catch(() => null)
        const currentUser = profileRes?.profile
        if (!currentUser) {
          router.replace(`/events/${id}`)
          setAccessState('redirecting')
          return
        }
        setProfile(currentUser)

        // 2. Event + registrations in parallel
        const [publicEventRes, regsRes] = await Promise.all([
          api.getPublicEventById(id as string).catch(() => null),
          api.getVolunteerRegistrations().catch(() => null),
        ])

        const eventData = publicEventRes?.event
        if (!eventData) {
          router.replace(`/events/${id}`)
          setAccessState('redirecting')
          return
        }
        setEvent(eventData)

        // 3. Access gate — check registration status
        const thisEventReg = regsRes?.events?.find((e: any) => e.id === eventData.id)
        const regStatus = thisEventReg?.registration_status
        const attended = regStatus === 'checked_in' || regStatus === 'completed'

        if (!attended) {
          if (thisEventReg) {
            // Registered but didn't attend (registered / missed / absent / cancelled)
            toast.error("You did not attend this event.")
            router.replace('/history')
          } else {
            // Random visitor who knows the URL
            router.replace(`/events/${id}`)
          }
          setAccessState('redirecting')
          return
        }

        setMyRegistration(thisEventReg)

        // 4. Load showcase data — backend enforces attendance, returns org + cert + review
        const showcase: ShowcaseData = await api.getShowcaseData(id as string)

        // Use the richer event from the showcase endpoint (includes org join)
        setEvent(showcase.event)
        setOrgProfile(showcase.event?.organization_profiles ?? null)

        // 5. Event not yet marked complete — show waiting state
        if (showcase.event.status !== 'completed') {
          setAccessState('waiting')
          return
        }

        // 6. Full state
        setAccessState('full')

        if (showcase.review) {
          setSubmitted(true)
          setRating(showcase.review.rating)
          setReviewText(showcase.review.comment)
        }

        if (showcase.certificate) setCert(showcase.certificate)

      } catch {
        router.replace(`/events/${id}`)
        setAccessState('redirecting')
      }
    }
    loadData()
  }, [id])

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

  const handleSubmitReview = async () => {
    if (rating === 0) return alert("Please select a rating star.");
    setSubmitting(true);
    try {
      await api.submitEventReview(id as string, rating, reviewText);
      setSubmitted(true);
    } catch (error) {
      alert("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render guards ────────────────────────────────────────────────────────────
  if (accessState === 'loading') {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-900" /></div>
  }

  if (accessState === 'redirecting') return null

  // ── Waiting state ─────────────────────────────────────────────────────────────
  if (accessState === 'waiting') {
    const orgName = orgProfile?.name || event?.organization_name || event?.organization?.name || "Organization"
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900">{event?.title}</h1>
            <p className="text-sm text-gray-400">
              {event?.event_date && new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {orgProfile?.logo_url
                ? <img src={orgProfile.logo_url} className="w-full h-full object-cover" alt="" />
                : <Building2 className="w-3.5 h-3.5 text-gray-400" />}
            </div>
            <span className="text-sm text-gray-600">{orgName}</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
            You were there. The organization hasn't wrapped up the event report yet — your certificate and event photos will appear here once they do. Usually within 24 hours.
          </p>
          <Link href="/history" className="block text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Back to my events
          </Link>
        </div>
      </div>
    )
  }

  if (!event) return <div className="h-screen flex items-center justify-center text-gray-500">Event not found</div>

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const calcDurationHours = () => {
    const start = event.start_time
    const end = event.end_time
    if (!start || !end) return null
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60
    if (diff <= 0) return null
    return Number.isInteger(diff) ? `${diff}h` : `${diff.toFixed(1)}h`
  }
  const durationLabel = calcDurationHours() ?? '—'

  const regStatusMap: Record<string, string> = {
    completed: 'Verified',
    checked_in: 'Attended',
    registered: 'Registered',
  }
  const regStatus = myRegistration?.registration_status ?? event.status ?? ''
  const statusLabel = regStatusMap[regStatus] ?? regStatus.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  // ── Full showcase (event.status === 'completed' && attended) ─────────────────
  const galleryImages = [event?.cover_image_url, ...(event?.gallery_images || [])].filter(Boolean);
  const displayImages = galleryImages.length > 0 ? galleryImages : ["https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60"];
  const displayImage = profile?.avatar_url || profile?.logo_url;
  const displayName = profile?.full_name || profile?.name || "User";
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  const orgName = orgProfile?.name || event?.organization_name || event?.organization?.name || "Organization";

  return (
    <div className="min-h-screen bg-white pb-20">

      {/* Gallery Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* HERO SECTION */}
      <div className="relative h-[50vh] md:h-[60vh] w-full bg-gray-900">
        <img src={event.cover_image_url || "/placeholder-event.jpg"} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs mb-3">
              <CheckCircle2 className="w-4 h-4" /> Completed Event
            </div>
            <h1 className="text-2xl md:text-5xl font-bold text-white mb-4 leading-tight">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-200 text-xs md:text-base">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 md:w-5 md:h-5" /> {new Date(event.event_date).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 md:w-5 md:h-5" /> {event.location}</div>
              
              {/* ✅ Display Org Name in Hero */}
              <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 md:w-5 md:h-5" /> 
                  <Link href={`/organizations/${event.organization_id}`} className="hover:text-blue-400 underline decoration-dotted underline-offset-4">
                    Organized by {orgName}
                  </Link>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">

          {/* LEFT COLUMN: Main Content (8 Cols) */}
          <div className="md:col-span-8 space-y-8 md:space-y-12">
            {/* Stats */}
            <div className="flex gap-2 md:gap-4 p-4 md:p-6 bg-gray-50 rounded-2xl border border-gray-100 justify-around">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{event.registered_count || 0}</div>
                <div className="text-[10px] md:text-xs text-gray-500 uppercase">Volunteers</div>
              </div>
              <div className="text-center border-l border-gray-200 pl-4">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{durationLabel}</div>
                <div className="text-[10px] md:text-xs text-gray-500 uppercase">Hours</div>
              </div>
              <div className="text-center border-l border-gray-200 pl-4">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{statusLabel}</div>
                <div className="text-[10px] md:text-xs text-gray-500 uppercase">Status</div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">About the Impact</h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">{event.description}</p>
            </div>

            {/* Gallery */}
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Event Gallery</h2>
              {displayImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {displayImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden shadow-sm aspect-square cursor-pointer group"
                      onClick={() => setLightboxUrl(src)}
                    >
                      <img src={src} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 italic">No images available.</p>}
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (4 Cols) */}
          <div className="md:col-span-4 space-y-6">
            
            {/* ✅ ORGANIZER CARD (Always Visible) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Organizer</h3>
                <Link href={`/organizations/${event.organization_id || '#'}`} className="flex items-center gap-3 mb-4 group">
                    <div className="w-12 h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden">
                        {orgProfile?.logo_url ? (
                            <img src={orgProfile.logo_url} className="w-full h-full object-cover"/>
                        ) : (
                            <Building2 className="w-6 h-6 text-gray-400"/>
                        )}
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{orgName}</div>
                        <div className="text-xs text-gray-500">View Profile</div>
                    </div>
                </Link>
                
                {/* CERTIFICATE & REVIEW SECTION */}
                {cert ? (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" /> Your Certificate
                    </h2>

                    {/* Certificate info */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                      <p className="text-xs font-semibold text-amber-900">{cert.event_title}</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        {cert.hours_credited}h · Issued {new Date(cert.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[9px] text-amber-600 font-mono mt-1">ID: {cert.verification_id?.substring(0, 16)}…</p>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={handleCertDownload}
                      disabled={downloadingCert}
                      className="w-full h-10 bg-[#0F4F3F] hover:bg-[#0a3d30] disabled:opacity-60 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 mb-4 transition-colors"
                    >
                      {downloadingCert
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />
                      }
                      Download PDF Certificate
                    </button>

                    {/* Review Section */}
                    {submitted ? (
                      <div className="border-t border-gray-100 pt-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                            <CheckCircle2 className="w-4 h-4"/>
                            <span className="text-sm font-bold">Review Submitted</span>
                        </div>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100 pt-4">
                        <h3 className="font-semibold text-xs mb-2">Rate Your Experience</h3>
                        <div className="flex gap-1 mb-2 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setRating(star)} className="hover:scale-110 transition-transform focus:outline-none">
                              <Star className={`w-5 h-5 ${rating >= star ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                          placeholder="How was the event?"
                          className="w-full h-16 p-2 bg-gray-50 rounded-lg resize-none text-xs focus:outline-none border border-transparent focus:border-gray-200 focus:bg-white transition-all mb-2"
                        />
                        <button onClick={handleSubmitReview} disabled={submitting} className="w-full h-9 bg-orange-600 text-white rounded-lg font-bold text-xs hover:bg-orange-700 disabled:opacity-50">
                          {submitting ? "Submitting..." : "Submit Feedback"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-500">Participate to earn certificates!</p>
                    </div>
                )}
            </div>

          </div>
          
        </div>
      </div>
    </div>
  )
}