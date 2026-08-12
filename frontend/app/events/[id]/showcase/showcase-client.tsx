"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Calendar, MapPin,
  CheckCircle2, Building2, Loader2,
  Download, X, Award, Star, Sparkles, Share2
} from "lucide-react"
import { api, VolunteerCertificate, ShowcaseData } from "@/lib/api"
import { downloadFromUrl, eventHours, formatHours, coverObjectPosition } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

// 'public'   — anyone (unauthed / no registration / didn't attend) — sees gallery + summary, no cert
// 'waiting'  — attended, but org hasn't marked event complete yet
// 'full'     — attended + event completed → full showcase with cert + review
type AccessState = 'loading' | 'public' | 'waiting' | 'full'

// ── Moment card generator ─────────────────────────────────────────────────────
// 9:16 transparent PNG — Strava-style: centered text stack, no background panel,
// stats one below another in the middle, logo at the bottom center.
async function drawMomentCard(params: {
  title: string
  orgName: string
  eventDate: string
  hours: string | null
}): Promise<string> {
  const W = 540, H = 960, S = 2
  // SF Pro Display on iOS/macOS, Helvetica Neue everywhere else
  const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif'

  const canvas = document.createElement('canvas')
  canvas.width = W * S
  canvas.height = H * S
  const ctx = canvas.getContext('2d')!
  ctx.scale(S, S)
  ctx.clearRect(0, 0, W, H) // fully transparent

  // Strong shadow so white text reads on any photo background
  ctx.shadowColor = 'rgba(0,0,0,0.85)'
  ctx.shadowBlur = 22
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 3

  // Center all text
  ctx.textAlign = 'center'
  const cx = W / 2

  // ── Load logo ────────────────────────────────────────────────────────────────
  let logoImg: HTMLImageElement | null = null
  try {
    logoImg = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new window.Image()
      img.onload = () => res(img); img.onerror = rej; img.src = '/logowhite.png'
    })
  } catch { /* text fallback at bottom */ }

  // ── Helper: word-wrap to N lines ─────────────────────────────────────────────
  const wrapLines = (text: string, maxW: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w
      if (ctx.measureText(test).width > maxW) { lines.push(cur); cur = w }
      else cur = test
    }
    if (cur) lines.push(cur)
    if (lines.length > 2) { lines[1] = lines[1].trimEnd() + '…'; return lines.slice(0, 2) }
    return lines
  }

  // ── Content — start at ~30% and flow down ────────────────────────────────────
  const maxTitleW = W - 80

  ctx.font = `700 48px ${FONT}`
  const titleLines = wrapLines(params.title, maxTitleW)

  const dateStr = params.eventDate
    ? new Date(params.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const hoursNum = params.hours ? params.hours.split(' ')[0] : null

  let y = Math.floor(H * 0.30)

  // "I VOLUNTEERED AT" — spaced caps
  ctx.font = `500 15px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.80)'
  ctx.fillText('I  V O L U N T E E R E D  A T', cx, y)
  y += 50

  // Event title
  ctx.font = `700 48px ${FONT}`
  ctx.fillStyle = '#ffffff'
  for (const line of titleLines) {
    ctx.fillText(line, cx, y)
    y += 58
  }
  y += 10

  // Thin white rule — short, centred
  ctx.shadowColor = 'transparent'
  ctx.beginPath(); ctx.moveTo(cx - 60, y); ctx.lineTo(cx + 60, y)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.shadowColor = 'rgba(0,0,0,0.85)'
  y += 28

  // Org name
  ctx.font = `600 20px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.fillText(params.orgName, cx, y)
  y += 32

  // Date
  if (dateStr) {
    ctx.font = `500 17px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.fillText(dateStr, cx, y)
    y += 32
  }

  // Hours — big bold stat, Strava-style
  if (hoursNum) {
    y += 22
    ctx.font = `800 80px ${FONT}`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(hoursNum, cx, y + 74)
    ctx.font = `500 18px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.78)'
    ctx.fillText('hrs volunteered', cx, y + 100)
    y += 116
  }

  // ── Logo — just below the last content element ────────────────────────────────
  y += 40
  ctx.shadowColor = 'rgba(0,0,0,0.70)'
  ctx.shadowBlur = 14
  if (logoImg) {
    const lH = 34
    const lW = (logoImg.naturalWidth / logoImg.naturalHeight) * lH
    ctx.drawImage(logoImg, cx - lW / 2, y, lW, lH)
  } else {
    ctx.font = `800 18px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.78)'
    ctx.fillText('KINDLY', cx, y + 24)
  }

  return canvas.toDataURL('image/png')
}

export default function ShowcaseClient() {
  const { id } = useParams()
  const router = useRouter()

  const [accessState, setAccessState] = useState<AccessState>('loading')
  const [event, setEvent] = useState<any>(null)
  const [orgProfile, setOrgProfile] = useState<any>(null)

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

  // Moment card
  const [momentCardUrl, setMomentCardUrl] = useState<string | null>(null)
  const [generatingCard, setGeneratingCard] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return

        // Step 1: Always load public event data — no auth needed
        const publicEventRes = await api.getPublicEventById(id as string).catch(() => null)
        const eventData = publicEventRes?.event
        if (!eventData) {
          router.replace(`/events/${id}`)
          return
        }
        setEvent(eventData)
        setOrgProfile(eventData.organization_profiles ?? null)

        // Step 2: Try to get authenticated user — safe failure
        const profileRes = await api.getUserProfile().catch(() => null)
        const currentUser = profileRes?.profile

        // Step 3: Unauthenticated → public view only
        if (!currentUser) {
          setAccessState('public')
          return
        }

        // Step 4: Check if this user attended this event
        const regsRes = await api.getVolunteerRegistrations().catch(() => null)
        const thisEventReg = regsRes?.events?.find((e: any) => e.id === eventData.id)
        const regStatus = thisEventReg?.registration_status
        const attended = regStatus === 'checked_in' || regStatus === 'completed'

        // Step 5: Not an attendee → public view
        if (!attended) {
          setAccessState('public')
          return
        }

        // Step 6: Attended but event not yet completed by org → waiting state
        if (eventData.status !== 'completed') {
          setAccessState('waiting')
          return
        }

        // Step 7: Attended + event completed → load showcase data (cert + review)
        try {
          const showcase: ShowcaseData = await api.getShowcaseData(id as string)
          // Use richer event from showcase (includes org join with logo_url)
          setEvent(showcase.event)
          setOrgProfile(showcase.event?.organization_profiles ?? orgProfile)

          if (showcase.review) {
            setSubmitted(true)
            setRating(showcase.review.rating)
            setReviewText(showcase.review.comment)
          }
          if (showcase.certificate) setCert(showcase.certificate)
        } catch {
          // Showcase fetch failed — still show public view rather than blocking
        }

        setAccessState('full')

      } catch {
        setAccessState('public')
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
    if (rating === 0) return alert("Please select a rating star.")
    setSubmitting(true)
    try {
      await api.submitEventReview(id as string, rating, reviewText)
      setSubmitted(true)
    } catch {
      alert("Failed to submit review.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateMomentCard = async () => {
    if (!event) return
    setGeneratingCard(true)
    try {
      const hoursRaw = (() => {
        const diff = eventHours(event.start_time, event.end_time)
        if (diff <= 0) return null
        return Number.isInteger(diff) ? `${diff} hrs` : `${diff.toFixed(1)} hrs`
      })()
      const url = await drawMomentCard({
        title: event.title ?? 'KINDLY Event',
        orgName: orgProfile?.name ?? event?.organization_name ?? 'KINDLY',
        eventDate: event.event_date ?? '',
        hours: hoursRaw,
      })
      setMomentCardUrl(url)
    } finally {
      setGeneratingCard(false)
    }
  }

  const handleDownloadMomentCard = () => {
    if (!momentCardUrl) return
    const a = document.createElement('a')
    a.href = momentCardUrl
    a.download = `kindly-moment-${event?.title?.replace(/\s+/g, '-').toLowerCase() ?? 'card'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (accessState === 'loading') {
    return <div className="h-screen flex items-center justify-center bg-neutral-50 dark:bg-black"><Loader2 className="w-8 h-8 animate-spin text-foreground" /></div>
  }

  // ── Waiting state (attended but org hasn't closed the event yet) ─────────────
  if (accessState === 'waiting') {
    const orgName = orgProfile?.name || event?.organization_name || "Organization"
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-indigo-200/20 dark:from-indigo-500/[0.14] to-transparent blur-3xl" />
        <ScrollReveal className="max-w-md w-full text-center space-y-6 relative">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">{event?.title}</h1>
            <p className="text-sm text-muted-foreground">
              {event?.event_date && new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-7 h-7 rounded-full bg-muted border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {orgProfile?.logo_url
                ? <img src={orgProfile.logo_url} className="w-full h-full object-cover" alt="" />
                : <Building2 className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <span className="text-sm text-muted-foreground">{orgName}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            You were there. The organization hasn&apos;t wrapped up the event report yet — your certificate and event photos will appear here once they do. Usually within 24 hours.
          </p>
          <Link href="/history" className="inline-block text-xs text-muted-foreground hover:text-foreground transition-colors">
            Back to my events
          </Link>
        </ScrollReveal>
      </div>
    )
  }

  if (!event) return <div className="h-screen flex items-center justify-center bg-neutral-50 dark:bg-black text-muted-foreground">Event not found</div>

  // ── Derived values ────────────────────────────────────────────────────────────
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

  const galleryImages = [event?.cover_image_url, ...(event?.gallery_images || [])].filter(Boolean)
  const displayImages = galleryImages.length > 0
    ? galleryImages
    : [
        "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60",
        "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60",
      ]

  const orgName = orgProfile?.name || event?.organization_name || "Organization"

  const isAttendee = accessState === 'full'

  // ── Shared page layout (public + full) ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black pb-20">

      {/* Gallery Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full hover:scale-105 active:scale-90 transition-all duration-300"
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

      {/* HERO */}
      <div className="relative h-[55vh] md:h-[65vh] w-full bg-muted overflow-hidden">
        <img
          src={event.cover_image_url || "/placeholder-event.jpg"}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: coverObjectPosition(event.cover_focal_x, event.cover_focal_y) }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        <ScrollReveal className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-md rounded-full text-emerald-400 font-bold uppercase tracking-wider text-[11px] md:text-xs mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed Event
            </div>
            <h1 className="text-3xl md:text-6xl font-extrabold text-white mb-5 leading-[1.05] tracking-tight">{event.title}</h1>

            {/* Meta chip — glass bar instead of bare icons floating on the photo */}
            <div className="inline-flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl text-white text-xs md:text-sm font-semibold">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 md:w-4.5 md:h-4.5 text-white/60" />
                {new Date(event.event_date).toLocaleDateString()}
              </div>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 md:w-4.5 md:h-4.5 text-white/60" />
                {event.location}
              </div>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 md:w-4.5 md:h-4.5 text-white/60" />
                <Link
                  href={`/organizations/${event.organization_id}`}
                  className="hover:text-[#ff6b6b] transition-colors"
                >
                  {orgName}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 relative">
        {/* Ambient glow — the "beauty" pass: floating ornament behind the
            content, same convention as every other redesigned page. */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[420px] bg-gradient-to-b from-indigo-200/20 dark:from-indigo-500/[0.14] to-transparent blur-3xl" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 relative">

          {/* LEFT: Main Content */}
          <div className="md:col-span-8 space-y-8 md:space-y-12">

            {/* Quick Stats */}
            <ScrollReveal className="flex gap-2 md:gap-4 p-4 md:p-6 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/5 shadow-xl shadow-neutral-200/30 dark:shadow-2xl dark:shadow-black/50 justify-around">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-foreground">{event.registered_count || 0}</div>
                <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide">Volunteers</div>
              </div>
              <div className="text-center border-l border-black/10 dark:border-white/10 pl-4">
                <div className="text-xl md:text-2xl font-bold text-foreground">{durationLabel}</div>
                <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hours</div>
              </div>
              <div className="text-center border-l border-black/10 dark:border-white/10 pl-4">
                <div className="text-xl md:text-2xl font-bold text-foreground capitalize">
                  {event.status?.replace(/_/g, ' ') ?? '—'}
                </div>
                <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</div>
              </div>
            </ScrollReveal>

            {/* About */}
            <ScrollReveal delay={0.05} className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">About the Impact</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{event.description}</p>
            </ScrollReveal>

            {/* Gallery — bento: one featured image up top, the rest as a
                supporting grid below, instead of a flat grid of equal tiles. */}
            <ScrollReveal delay={0.1} className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Event Gallery</h2>
              {displayImages.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-lg shadow-neutral-200/40 dark:shadow-black/40 aspect-[16/10] cursor-pointer group hover:scale-[1.01] transition-all duration-300 ease-out"
                    onClick={() => setLightboxUrl(displayImages[0])}
                  >
                    <img
                      src={displayImages[0]}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>

                  {displayImages.length > 1 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      {displayImages.slice(1).map((src, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden shadow-md shadow-neutral-200/40 dark:shadow-black/40 aspect-square cursor-pointer group hover:scale-[1.03] hover:-translate-y-0.5 transition-all duration-300 ease-out"
                          onClick={() => setLightboxUrl(src)}
                        >
                          <img
                            src={src}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No images available.</p>
              )}
            </ScrollReveal>

            {/* Share your Moment — attendees only */}
            {isAttendee && (
              <ScrollReveal delay={0.15} className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#ff6b6b]" />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Share your Moment</h2>
                </div>

                {!momentCardUrl ? (
                  <button
                    onClick={handleGenerateMomentCard}
                    disabled={generatingCard}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 ease-out hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)' }}
                  >
                    {generatingCard
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Sparkles className="w-4 h-4" />}
                    {generatingCard ? 'Generating…' : 'Create Story Card'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Preview on dark bg so white text is visible — real use is over your own photo */}
                    <div
                      className="w-full max-w-[220px] mx-auto rounded-2xl overflow-hidden shadow-xl"
                      style={{ background: 'linear-gradient(180deg, #2a2a2a 0%, #111 100%)' }}
                    >
                      <img
                        src={momentCardUrl}
                        alt="Moment Card Preview"
                        className="w-full h-auto block"
                      />
                    </div>

                    {/* Download button */}
                    <button
                      onClick={handleDownloadMomentCard}
                      className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-white transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)' }}
                    >
                      <Download className="w-4 h-4" />
                      Download Moment Card
                    </button>

                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      In Instagram Stories, tap the sticker icon → tap the image to add your card on top of your photo
                    </p>

                    {/* Regenerate option */}
                    <button
                      onClick={() => setMomentCardUrl(null)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      ↺ Regenerate card
                    </button>
                  </div>
                )}
              </ScrollReveal>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <ScrollReveal delay={0.1} className="md:col-span-4 space-y-6">
            <Card className="p-6 sticky top-24">

              {/* Organizer card — always visible */}
              <h3 className="font-bold text-foreground mb-4">Organizer</h3>
              <Link
                href={`/organizations/${event.organization_id || '#'}`}
                className="flex items-center gap-3 mb-4 group"
              >
                <div className="w-12 h-12 bg-muted rounded-full border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105">
                  {orgProfile?.logo_url ? (
                    <img src={orgProfile.logo_url} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-foreground group-hover:text-[#ff6b6b] transition-colors">{orgName}</div>
                  <div className="text-xs text-muted-foreground">View Profile</div>
                </div>
              </Link>

              {/* Certificate + Review — attendees only */}
              {isAttendee ? (
                cert ? (
                  <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/10">
                    <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" /> Your Certificate
                    </h2>

                    <div className="bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 mb-4">
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-400">{cert.event_title}</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-0.5">
                        {formatHours(cert.hours_credited)} · Issued{' '}
                        {new Date(cert.issued_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                      <p className="text-[9px] text-amber-600 dark:text-amber-500 font-mono mt-1">
                        ID: {cert.verification_id?.substring(0, 16)}…
                      </p>
                    </div>

                    <button
                      onClick={handleCertDownload}
                      disabled={downloadingCert}
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 mb-4 hover:scale-[1.02] active:scale-95 transition-all duration-300 ease-out"
                    >
                      {downloadingCert
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />}
                      Download PDF Certificate
                    </button>

                    {/* Review section */}
                    {submitted ? (
                      <div className="border-t border-black/5 dark:border-white/10 pt-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-bold">Review Submitted</span>
                        </div>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-black/5 dark:border-white/10 pt-4">
                        <h3 className="font-semibold text-xs mb-2 text-foreground">Rate Your Experience</h3>
                        <div className="flex gap-1 mb-2 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRating(star)}
                              className="hover:scale-125 active:scale-95 transition-transform duration-200 focus:outline-none"
                            >
                              <Star className={`w-5 h-5 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="How was the event?"
                          className="w-full h-16 p-2 bg-black/[0.02] dark:bg-white/[0.03] rounded-lg resize-none text-xs text-foreground focus:outline-none border border-black/5 dark:border-white/10 focus:border-black/10 dark:focus:border-white/20 transition-all mb-2"
                        />
                        <button
                          onClick={handleSubmitReview}
                          disabled={submitting}
                          className="w-full h-9 bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white rounded-lg font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all duration-300 ease-out disabled:opacity-50"
                        >
                          {submitting ? "Submitting..." : "Submit Feedback"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Attended but org hasn't issued certificate yet */
                  <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 text-center">
                    <Award className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Certificate not yet issued by the organization.</p>
                  </div>
                )
              ) : (
                /* Not an attendee — neutral CTA */
                <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Volunteer at upcoming events to earn certificates!</p>
                  <Link
                    href="/events"
                    className="inline-block text-xs font-semibold text-[#ff6b6b] hover:underline transition-colors"
                  >
                    Browse Events →
                  </Link>
                </div>
              )}
            </Card>
          </ScrollReveal>

        </div>
      </div>
    </div>
  )
}
