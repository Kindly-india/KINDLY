"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar, MapPin, Users, Clock, IndianRupee, Pencil, Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"
import { api, AdminEventRegistration } from "@/lib/api"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  published: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15",
  pending: "text-amber-700 bg-amber-50 dark:bg-amber-500/15",
  cancelled: "text-red-700 bg-red-50 dark:bg-red-500/15",
  completed: "text-blue-700 bg-blue-50 dark:bg-blue-500/15",
}

const REG_STATUS_STYLES: Record<string, string> = {
  registered: "text-blue-700 bg-blue-50 dark:bg-blue-500/15",
  checked_in: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15",
  completed: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15",
  missed: "text-red-700 bg-red-50 dark:bg-red-500/15",
  cancelled: "text-muted-foreground bg-muted",
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  )
}

export default function AdminEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  const [event, setEvent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<AdminEventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [regsLoading, setRegsLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null)

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.adminGetEvent(eventId)
      setEvent(res.event)
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push("/")
        return
      }
      toast.error("Couldn't load event.")
    } finally {
      setLoading(false)
    }
  }, [eventId, router])

  const fetchRegistrations = useCallback(async () => {
    try {
      setRegsLoading(true)
      const res = await api.adminGetEventRegistrations(eventId)
      setRegistrations(res.registrations)
    } catch {
      toast.error("Couldn't load registrations.")
    } finally {
      setRegsLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (eventId) {
      fetchEvent()
      fetchRegistrations()
    }
  }, [eventId, fetchEvent, fetchRegistrations])

  const eventStarted = event ? new Date(`${event.event_date}T${event.start_time}`) <= new Date() : false
  const checkInClosed = event?.status === "cancelled" || event?.status === "completed"

  const handleCheckIn = async (registrationId: string, currentStatus: string) => {
    if (currentStatus !== "checked_in" && !eventStarted) {
      toast.error("You cannot check in volunteers before the event start time.")
      return
    }
    try {
      setCheckInLoading(registrationId)
      if (currentStatus === "checked_in") {
        await api.adminUndoCheckIn(eventId, registrationId)
      } else {
        await api.adminCheckInVolunteer(eventId, registrationId)
      }
      await fetchRegistrations()
    } catch (err: any) {
      toast.error(err.message || "Failed to update check-in status")
    } finally {
      setCheckInLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!event) return null

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-foreground leading-tight">{event.title}</h1>
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                STATUS_STYLES[event.status] ?? "text-muted-foreground bg-muted"
              )}
            >
              {event.status}
            </span>
          </div>
          {event.organization_profiles && (
            <Link
              href={`/admin/organizations/${event.organization_profiles.id}`}
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground mt-1"
            >
              <Building2 className="w-3 h-3" />
              {event.organization_profiles.name}
            </Link>
          )}
        </div>
        <Link
          href={`/admin/events/${eventId}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold shrink-0 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="Category" value={event.category} />
        <Field label="Date" value={event.event_date} />
        <Field label="Time" value={`${event.start_time} – ${event.end_time}`} />
        <Field label="Location" value={event.location} />
        <Field
          label="Slots"
          value={`${event.registered_count}${event.total_slots != null ? ` / ${event.total_slots}` : " (unlimited)"}`}
        />
        <Field label="Ticket Price" value={event.ticket_price ? `₹${(event.ticket_price / 100).toFixed(0)}` : "Free"} />
        <Field label="Point of Contact" value={event.point_of_contact} />
        <Field label="Registration Deadline" value={event.registration_deadline ? new Date(event.registration_deadline).toLocaleString() : null} />
        <Field label="Minimum Age" value={event.minimum_age} />
      </div>

      {event.description && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Description</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Registrations ({registrations.length})
        </h2>

        {!eventStarted && !checkInClosed && registrations.length > 0 && (
          <div className="mb-2 bg-amber-50 dark:bg-amber-500/15 text-amber-800 text-xs px-4 py-2 rounded-lg border border-amber-200 text-center">
            Check-in will be enabled once the event starts ({event.start_time}).
          </div>
        )}

        {regsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No registrations yet.</div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-2 font-bold">Volunteer</th>
                    <th className="px-4 py-2 font-bold">Phone</th>
                    <th className="px-4 py-2 font-bold">City</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                    <th className="px-4 py-2 font-bold">Registered</th>
                    <th className="px-4 py-2 font-bold">Checked In</th>
                    <th className="px-4 py-2 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">
                        {reg.volunteer_profiles?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{reg.volunteer_profiles?.phone ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{reg.volunteer_profiles?.city ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", REG_STATUS_STYLES[reg.status] ?? "text-muted-foreground bg-muted")}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{new Date(reg.registered_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-2.5">
                        {(reg.status === "checked_in" || reg.status === "registered") && !checkInClosed && (
                          <button
                            onClick={() => handleCheckIn(reg.id, reg.status)}
                            disabled={checkInLoading === reg.id || (!eventStarted && reg.status !== "checked_in")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
                              reg.status === "checked_in"
                                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700"
                                : "bg-muted text-muted-foreground hover:bg-border"
                            )}
                          >
                            {checkInLoading === reg.id ? "Loading…" : reg.status === "checked_in" ? "Checked In" : "Check In"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
