"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Camera, X, Loader2, Plus, ImageIcon } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

function CreatePostForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get("eventId") ?? ""

  const [eventTitle, setEventTitle] = useState<string | null>(null)
  const [photos, setPhotos] = useState<{ preview: string; file: File }[]>([])
  const [caption, setCaption] = useState("")
  const [processing, setProcessing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!eventId) return
    api.getPublicEventById(eventId)
      .then((res: any) => setEventTitle(res?.title ?? null))
      .catch(() => {})
  }, [eventId])

  const handleFiles = async (files: FileList) => {
    const remaining = 5 - photos.length
    const toProcess = Array.from(files).slice(0, remaining)
    if (!toProcess.length) return

    setProcessing(true)
    setError(null)
    try {
      const imageCompression = (await import("browser-image-compression")).default
      const compressed = await Promise.all(
        toProcess.map((f) =>
          imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true })
        )
      )
      const newPhotos = compressed.map((file) => ({ file, preview: URL.createObjectURL(file) }))
      setPhotos((prev) => [...prev, ...newPhotos])
    } catch {
      setError("Failed to process images. Try again.")
    } finally {
      setProcessing(false)
    }
  }

  const removePhoto = (idx: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async () => {
    if (!eventId) { setError("No event selected. Go back to your history."); return }
    if (photos.length === 0) { setError("Add at least one photo."); return }

    setSubmitting(true)
    setError(null)
    try {
      const urls = await Promise.all(photos.map((p) => api.uploadPostPhoto(p.file)))
      await api.createPost({ event_id: eventId, photo_urls: urls, caption: caption.trim() || undefined })
      window.location.href = '/social'
    } catch (e: any) {
      setError(e.message || "Failed to share post. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = photos.length > 0 && !submitting && !processing

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#f0f0f0]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-[#1d1d1f]" />
          </button>
          <h1 className="text-[17px] font-semibold text-[#1d1d1f]">Share your experience</h1>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-1.5 bg-[#80242a] text-white text-[13px] font-semibold rounded-full disabled:opacity-40 active:scale-95 transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Event label */}
        {eventTitle && (
          <p className="text-[13px] text-[#86868b] px-1">
            Posting about: <span className="font-semibold text-[#1d1d1f]">{eventTitle}</span>
          </p>
        )}

        {/* Photo grid */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5e5e7]">
          <p className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wide mb-3">
            Photos ({photos.length}/5)
          </p>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center active:scale-95 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="aspect-square rounded-xl border-2 border-dashed border-[#e5e5e7] flex flex-col items-center justify-center gap-1 hover:border-[#80242a] hover:bg-[#80242a]/5 active:scale-95 transition-all disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#86868b]" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-[#86868b]" />
                    <span className="text-[10px] text-[#86868b] font-medium">Add photo</span>
                  </>
                )}
              </button>
            )}
          </div>

          {photos.length === 0 && !processing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 w-full py-8 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#e5e5e7] hover:border-[#80242a] hover:bg-[#80242a]/5 active:scale-95 transition-all"
            >
              <Camera className="w-8 h-8 text-[#86868b]" />
              <div className="text-center">
                <p className="text-[14px] font-semibold text-[#1d1d1f]">Add photos</p>
                <p className="text-[12px] text-[#86868b] mt-0.5">Up to 5 photos</p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Caption */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5e5e7]">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Share what this experience meant to you…"
            className="w-full resize-none text-[14px] text-[#1d1d1f] placeholder:text-[#c7c7cc] outline-none leading-relaxed"
          />
          <div className="flex justify-end mt-1">
            <span className={cn("text-[11px]", caption.length > 450 ? "text-orange-500" : "text-[#c7c7cc]")}>
              {caption.length}/500
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5e5e7]">
          <div className="flex items-start gap-3">
            <ImageIcon className="w-5 h-5 text-[#86868b] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-[#1d1d1f] mb-1">Tips for a great post</p>
              <ul className="space-y-1">
                {["Show the impact — people, action, environment", "Candid moments beat posed photos", "Add a caption to give your post context"].map((tip) => (
                  <li key={tip} className="text-[12px] text-[#86868b] flex items-start gap-1.5">
                    <span className="text-[#80242a] mt-0.5">·</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <CreatePostForm />
    </Suspense>
  )
}
