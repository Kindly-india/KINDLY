"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { ArrowLeft, Calendar, Loader2, Camera } from "lucide-react"

type PostableEvent = {
  id: string
  title: string
  event_date: string
  org_name: string
  post_count: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function SelectEventPage() {
  const router = useRouter()
  const [events, setEvents] = useState<PostableEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.getPostableEvents()
      .then((res) => setEvents(res.events))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="h-14 flex items-center px-3 gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-[17px] font-semibold text-foreground">Share an experience</span>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">Couldn&apos;t load events. Try again.</p>
            <button
              onClick={() => { setError(false); setLoading(true); api.getPostableEvents().then(r => setEvents(r.events)).catch(() => setError(true)).finally(() => setLoading(false)) }}
              className="mt-3 text-sm text-[#80242a] font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-semibold text-foreground mb-1">Nothing to share yet</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Attend and complete an event to share your experience here.
            </p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <>
            <p className="text-[12px] text-muted-foreground mb-4">Which event do you want to share?</p>
            <ul className="space-y-2">
              {events.map((event) => (
                <li key={event.id}>
                  <button
                    onClick={() => router.push(`/posts/create?eventId=${event.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-card border border-border rounded-2xl hover:border-border active:bg-muted transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#80242a]/8 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-[#80242a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">{event.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{event.org_name} · {formatDate(event.event_date)}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0 tabular-nums">
                      {event.post_count}/3
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
