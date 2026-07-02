"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Users, Clock, Star, Share2,
  CheckCircle2, XCircle, Award, Loader2, Upload, Trash2, Plus,
  Download, RefreshCw, X, Square, CheckSquare, UserCheck,
} from "lucide-react"
import { api, EventCertificate } from "@/lib/api"
import { downloadFromUrl } from "@/lib/utils"

export default function EventReportPage() {
  const params = useParams()
  const eventId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [event, setEvent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [stats, setStats] = useState({
    turnoutRate: 0,
    totalImpactHours: 0,
    presentCount: 0,
    absentCount: 0
  })

  // Certificate state
  const [certs, setCerts] = useState<EventCertificate[]>([])
  const [issuingCerts, setIssuingCerts] = useState(false)
  const [issueResult, setIssueResult] = useState<{ issued: number; skipped: number; total: number } | null>(null)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Selective issuance state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [eventRes, regsRes] = await Promise.all([
          api.getEventById(eventId),
          api.getEventRegistrations(eventId)
        ])

        setEvent(eventRes.event)
        setRegistrations(regsRes.registrations || [])

        const present = (regsRes.registrations || []).filter((r: any) =>
          r.status === 'checked_in' || r.status === 'completed'
        )
        const presentCount = present.length
        // Exclude cancelled registrations from the denominator
        const totalRegs = (regsRes.registrations || []).filter((r: any) => r.status !== 'cancelled').length

        const start = new Date(`1970-01-01T${eventRes.event.start_time}`)
        const end = new Date(`1970-01-01T${eventRes.event.end_time}`)
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

        setStats({
          turnoutRate: totalRegs > 0 ? Math.round((presentCount / totalRegs) * 100) : 0,
          totalImpactHours: Math.round(presentCount * duration),
          presentCount,
          absentCount: totalRegs - presentCount
        })

        // Load existing certificates
        try {
          const certRes = await api.getEventCertificates(eventId)
          setCerts(certRes.certificates || [])
        } catch {
          // Not an org owner or no certs yet — silent
        }

      } catch (error) {
        console.error("Failed to load report", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [eventId])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const publicUrl = await api.uploadEventImage(file)
      const currentGallery = event.gallery_images || []
      const updatedGallery = [...currentGallery, publicUrl]
      await api.updateEventGallery(eventId, updatedGallery)
      setEvent({ ...event, gallery_images: updatedGallery })
    } catch (error: any) {
      alert(error.message || "Failed to upload image.")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (indexToRemove: number) => {
    if (!confirm("Delete this image?")) return
    try {
      const currentGallery = event.gallery_images || []
      const updatedGallery = currentGallery.filter((_: any, i: number) => i !== indexToRemove)
      await api.updateEventGallery(eventId, updatedGallery)
      setEvent({ ...event, gallery_images: updatedGallery })
    } catch {
      alert("Failed to delete image.")
    }
  }

  const handleIssueCertificates = async (userIds?: string[]) => {
    setIssuingCerts(true)
    setIssueError(null)
    setIssueResult(null)
    try {
      const result = await api.issueCertificatesForEvent(eventId, userIds)
      setIssueResult({ issued: result.issued, skipped: result.skipped, total: result.total })
      // Reset selection after issuing
      setSelectMode(false)
      setSelectedUserIds(new Set())
      // Refresh certificate list
      const certRes = await api.getEventCertificates(eventId)
      setCerts(certRes.certificates || [])
    } catch (err: any) {
      setIssueError(err.message || "Failed to issue certificates")
    } finally {
      setIssuingCerts(false)
    }
  }

  const toggleSelectVolunteer = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const handleDownload = async (certId: string) => {
    setDownloadingId(certId)
    try {
      const { signedUrl } = await api.downloadCertificate(certId)
      await downloadFromUrl(signedUrl, 'kindly-certificate.pdf')
    } catch (err: any) {
      alert(err.message || "Failed to get download link")
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted pb-20">

      {/* Gallery Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-card/10 rounded-full transition-colors"
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

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/org-events" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">{event?.title}</h1>
            <p className="text-xs text-muted-foreground">Post-Event Report</p>
          </div>
          <div className="ml-auto flex gap-3">
            <Link href={`/events/${eventId}/showcase`} className="hidden md:flex items-center gap-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:bg-blue-500/15 px-3 py-1.5 rounded-full transition-colors">
              View Public Showcase <Share2 className="w-3.5 h-3.5" />
            </Link>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 text-xs font-bold rounded-full flex items-center">
              COMPLETED
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/15 text-blue-600 rounded-full mb-3">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-foreground">
              {stats.presentCount}<span className="text-muted-foreground text-lg">/{registrations.length}</span>
            </span>
            <span className="text-sm text-muted-foreground mt-1">Volunteer Turnout</span>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 rounded-full mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-foreground">{stats.totalImpactHours}h</span>
            <span className="text-sm text-muted-foreground mt-1">Total Impact Created</span>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/15 text-amber-600 rounded-full mb-3">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <span className="text-3xl font-bold text-foreground">4.9</span>
            <span className="text-sm text-muted-foreground mt-1">Average Rating</span>
          </div>
        </div>

        {/* Event Gallery */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Event Gallery</h2>
              <p className="text-sm text-muted-foreground">Upload photos to showcase the impact of this event.</p>
            </div>
            <div className="relative">
              <input
                type="file"
                id="gallery-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <label
                htmlFor="gallery-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Photo
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {event?.gallery_images && event.gallery_images.map((img: string, idx: number) => (
              <div
                key={idx}
                className="relative group aspect-square rounded-xl overflow-hidden bg-muted border border-border cursor-pointer"
                onClick={() => setLightboxUrl(img)}
              >
                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                    className="p-2 bg-card/20 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {(!event?.gallery_images || event.gallery_images.length === 0) && (
              <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted">
                <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center mb-3 shadow-sm">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm">No photos added yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Volunteer Attendance */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center gap-3 flex-wrap">
            <h2 className="font-bold text-foreground">Volunteer Attendance</h2>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 rounded-full font-medium">
                Present ({stats.presentCount})
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full font-medium">
                Absent ({stats.absentCount})
              </span>
              {stats.presentCount > 0 && (
                <button
                  onClick={() => { setSelectMode(m => !m); setSelectedUserIds(new Set()) }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${selectMode ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700' : 'bg-muted text-muted-foreground hover:bg-muted'}`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {selectMode ? 'Cancel Selection' : 'Select for Cert'}
                </button>
              )}
            </div>
          </div>
          {selectMode && (
            <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-500/15 border-b border-indigo-100 text-xs text-indigo-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              {selectedUserIds.size === 0
                ? 'Tap volunteers below to select them for certificate issuance.'
                : `${selectedUserIds.size} volunteer${selectedUserIds.size !== 1 ? 's' : ''} selected.`}
            </div>
          )}
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {registrations.map((reg) => {
              const isPresent = reg.status === 'checked_in' || reg.status === 'completed'
              const userId = reg.volunteer_profiles?.user_id || reg.user_id
              const isSelected = userId && selectedUserIds.has(userId)
              return (
                <div
                  key={reg.id}
                  className={`p-4 flex items-center justify-between hover:bg-muted transition-colors ${selectMode && isPresent ? 'cursor-pointer' : ''} ${isSelected ? 'bg-indigo-50 dark:bg-indigo-500/15' : ''}`}
                  onClick={() => selectMode && isPresent && userId && toggleSelectVolunteer(userId)}
                >
                  <div className="flex items-center gap-3">
                    {selectMode && isPresent && (
                      <div className="text-indigo-500 shrink-0">
                        {isSelected
                          ? <CheckSquare className="w-5 h-5" />
                          : <Square className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                      {reg.volunteer_profiles?.full_name?.charAt(0) || "V"}
                    </div>
                    <div>
                      <Link
                        href={`/volunteers/${reg.volunteer_profiles?.id}`}
                        className="text-sm font-semibold text-foreground hover:text-teal-600 hover:underline transition-colors block"
                        onClick={(e) => selectMode && e.preventDefault()}
                      >
                        {reg.volunteer_profiles?.full_name || "Volunteer"}
                      </Link>
                      <p className="text-xs text-muted-foreground">{reg.volunteer_profiles?.city || "Nashik"}</p>
                    </div>
                  </div>
                  {isPresent ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Present
                    </div>
                  ) : reg.status === 'cancelled' ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <XCircle className="w-4 h-4" />
                      Cancelled
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <XCircle className="w-4 h-4" />
                      Absent
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Certificates Section */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/15 rounded-xl text-amber-500">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Certificates</h2>
                <p className="text-sm text-muted-foreground">
                  {certs.length > 0
                    ? `${certs.length} certificate${certs.length !== 1 ? 's' : ''} issued`
                    : `${stats.presentCount} volunteer${stats.presentCount !== 1 ? 's' : ''} eligible`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectMode && selectedUserIds.size > 0 && (
                <button
                  onClick={() => handleIssueCertificates(Array.from(selectedUserIds))}
                  disabled={issuingCerts}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-muted disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {issuingCerts
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                    : <><CheckSquare className="w-4 h-4" /> Issue to {selectedUserIds.size} Selected</>
                  }
                </button>
              )}
              <button
                onClick={() => handleIssueCertificates()}
                disabled={issuingCerts || stats.presentCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0F4F3F] hover:bg-[#0a3d30] disabled:bg-muted disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {issuingCerts ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDFs…</>
                ) : certs.length > 0 ? (
                  <><RefreshCw className="w-4 h-4" /> Re-issue Missing</>
                ) : (
                  <><Award className="w-4 h-4" /> Issue to All</>
                )}
              </button>
            </div>
          </div>

          {/* Issue result banner */}
          {issueResult && (
            <div className="mx-6 mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 rounded-xl text-sm text-emerald-800">
              <span className="font-semibold">Done!</span> {issueResult.issued} new certificate{issueResult.issued !== 1 ? 's' : ''} generated
              {issueResult.skipped > 0 && `, ${issueResult.skipped} already existed`}.
            </div>
          )}
          {issueError && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-500/15 border border-red-200 rounded-xl text-sm text-red-700">
              {issueError}
            </div>
          )}

          {/* Certificate list */}
          {certs.length > 0 ? (
            <div className="divide-y divide-border">
              {certs.map((cert) => (
                <div key={cert.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    {cert.volunteer_avatar ? (
                      <img src={cert.volunteer_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm">
                        {cert.volunteer_name?.charAt(0) || "V"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cert.volunteer_name}</p>
                      <p className="text-xs text-muted-foreground">{cert.hours_credited}h · {new Date(cert.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(cert.id)}
                    disabled={downloadingId === cert.id}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0F4F3F] hover:bg-emerald-50 dark:bg-emerald-500/15 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {downloadingId === cert.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />
                    }
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No certificates issued yet. Click <span className="font-semibold text-muted-foreground">Issue Certificates</span> to generate PDFs for all {stats.presentCount} present volunteer{stats.presentCount !== 1 ? 's' : ''}.
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
