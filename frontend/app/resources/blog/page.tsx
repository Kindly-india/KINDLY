"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { MessageSquare, ThumbsUp, Bug, Lightbulb, Star, Heart, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

type FeedbackType = "suggestion" | "bug" | "compliment" | "other"

const typeConfig: Record<FeedbackType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  suggestion: { label: "Suggestion", icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/15" },
  bug: { label: "Bug Report", icon: Bug, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/15" },
  compliment: { label: "Compliment", icon: Heart, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-500/15" },
  other: { label: "Other", icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/15" }
}

interface FeedbackEntry {
  id: string
  name: string | null
  type: FeedbackType
  message: string
  created_at: string
}

export default function FeedbackPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [type, setType] = useState<FeedbackType>("suggestion")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<FeedbackEntry[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  const fetchRecent = async () => {
    setLoadingRecent(true)
    try {
      const { data } = await supabase
        .from("platform_feedback")
        .select("id, name, type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
      setRecent((data as FeedbackEntry[]) ?? [])
    } catch {
      // silent — public board is best-effort
    } finally {
      setLoadingRecent(false)
    }
  }

  // Fetch on first render
  useState(() => {
    fetchRecent()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: err } = await supabase.from("platform_feedback").insert({
        name: name.trim() || null,
        type,
        message: message.trim()
      })
      if (err) throw err
      setSubmitted(true)
      setName("")
      setMessage("")
      setType("suggestion")
      await fetchRecent()
    } catch (err: unknown) {
      setError("Something went wrong. Please try again.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-violet-50/50 dark:from-violet-50/10 to-white dark:to-background text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-start mb-6">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <div className="w-14 h-14 bg-violet-100 dark:bg-violet-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ThumbsUp className="w-7 h-7 text-violet-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Tell us what you think</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Kindly is built for volunteers and organisations like you. Found a bug? Have an idea? Want to say something nice? This board is open to everyone — no account needed.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Form */}
        <div>
          <div className="bg-muted rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Submit Feedback</h2>

            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Thank you!</h3>
                <p className="text-muted-foreground mb-6">Your feedback was received. It helps us build Kindly better.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="h-10 px-6 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:bg-primary transition-colors"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Your Name <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full h-11 px-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all text-[15px]"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Type of Feedback</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(typeConfig) as [FeedbackType, typeof typeConfig[FeedbackType]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          type === key
                            ? `border-border ${cfg.bg} ${cfg.color}`
                            : "border-border bg-card text-muted-foreground hover:border-border"
                        }`}
                      >
                        <cfg.icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Your Feedback <span className="text-rose-500">*</span></label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="Share your thoughts, ideas, or report a problem..."
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all text-[15px] resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-rose-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full h-12 bg-primary hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-[15px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Recent Feedback Board */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Feedback</h2>
            <button onClick={fetchRecent} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Refresh
            </button>
          </div>

          {loadingRecent ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm">No feedback yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recent.map((entry) => {
                const cfg = typeConfig[entry.type] ?? typeConfig.other
                return (
                  <div key={entry.id} className="p-5 border border-border rounded-2xl hover:border-border transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatDate(entry.created_at)}</span>
                    </div>
                    <p className="text-[15px] text-foreground leading-relaxed mb-2">{entry.message}</p>
                    <p className="text-xs text-muted-foreground">{entry.name ?? "Anonymous"}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
