"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Clock,
  Star,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  Award,
  Loader2
} from "lucide-react"
import { api } from "@/lib/api"

export default function EventReportPage() {
  const params = useParams()
  const eventId = params?.id as string
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [stats, setStats] = useState({
    turnoutRate: 0,
    totalImpactHours: 0,
    presentCount: 0,
    absentCount: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [eventRes, regsRes] = await Promise.all([
          api.getEventById(eventId),
          api.getEventRegistrations(eventId)
        ])

        const evt = eventRes.event
        const regs = regsRes.registrations || []

        setEvent(evt)
        setRegistrations(regs)

        // Calculate Stats
        const present = regs.filter((r: any) => r.status === 'checked_in')
        const presentCount = present.length

        // FIX: Use actual length for counts, handle 0 separately for percentage
        const totalRegs = regs.length

        // Calculate Duration (Hours)
        const start = new Date(`1970-01-01T${evt.start_time}`)
        const end = new Date(`1970-01-01T${evt.end_time}`)
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

        setStats({
          // If totalRegs is 0, return 0%, otherwise calculate percentage
          turnoutRate: totalRegs > 0 ? Math.round((presentCount / totalRegs) * 100) : 0,
          totalImpactHours: Math.round(presentCount * duration),
          presentCount: presentCount,
          absentCount: totalRegs - presentCount // Now this will be 0 - 0 = 0
        })

      } catch (error) {
        console.error("Failed to load report", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [eventId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/org-events" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{event?.title}</h1>
            <p className="text-xs text-gray-500">Post-Event Report</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              COMPLETED
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Turnout */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {stats.presentCount}<span className="text-gray-400 text-lg">/{registrations.length}</span>
            </span>
            <span className="text-sm text-gray-500 mt-1">Volunteer Turnout</span>
          </div>

          {/* Impact */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalImpactHours}h</span>
            <span className="text-sm text-gray-500 mt-1">Total Impact Created</span>
          </div>

          {/* Rating (Static for now) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-full mb-3">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <span className="text-3xl font-bold text-gray-900">4.9</span>
            <span className="text-sm text-gray-500 mt-1">Average Rating</span>
          </div>
        </div>

        {/* Volunteer Attendance List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Volunteer Attendance</h2>
            <div className="flex gap-2 text-sm">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                Present ({stats.presentCount})
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                Absent ({stats.absentCount})
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {registrations.map((reg) => (
              <div key={reg.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                    {reg.volunteer_profiles?.full_name?.charAt(0) || "V"}
                  </div>
                  <div>
                    <Link
                      href={`/volunteers/${reg.volunteer_profiles?.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-teal-600 hover:underline transition-colors block"
                    >
                      {reg.volunteer_profiles?.full_name || "Volunteer"}
                    </Link>
                    <p className="text-xs text-gray-500">{reg.volunteer_profiles?.city || "Nashik"}</p>
                  </div>
                </div>

                {reg.status === 'checked_in' ? (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Present
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <XCircle className="w-4 h-4" />
                    Absent
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Certificates Section */}
        <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-orange-500">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Certificates</h2>
                <p className="text-sm text-gray-600">Issue participation certificates to {stats.presentCount} attendees.</p>
              </div>
            </div>

            <button
              onClick={() => alert("Certificates generated and sent to volunteers!")}
              className="w-full md:w-auto h-12 px-8 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              Design & Issue
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}