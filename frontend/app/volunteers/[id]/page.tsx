"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MapPin,
  Shield,
  Calendar,
  Clock,
  Award,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Edit2,
  User,
  Sparkles,
  Trophy,
  Building2
} from "lucide-react"
import { api } from "@/lib/api"
// import { cn } from "@/lib/utils"

export default function VolunteerProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [journey, setJourney] = useState<any[]>([])
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const [profileRes, journeyRes, currentUser] = await Promise.all([
          api.getVolunteerPublicProfile(id as string),
          api.getVolunteerJourney(id as string),
          api.getCurrentUser().catch(() => null)
        ])

        setProfile(profileRes.profile)
        setJourney(journeyRes.journey || [])
        setIsOwnProfile(currentUser?.id === profileRes.profile.user_id)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
  if (!profile) return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Profile not found</div>

  const reliabilityScore = profile.reliability_score || 0
  const circumference = 2 * Math.PI * 40 // Adjusted for size
  const strokeDasharray = `${(reliabilityScore / 100) * circumference} ${circumference}`

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {isOwnProfile && (
            <Link href="/settings/profile" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        
        {/* HEADER SECTION (Matches Org Profile Style) */}
        <div className="bg-white rounded-3xl mt-4 overflow-hidden shadow-sm border border-gray-100">
          
          {/* Banner */}
          <div className="h-40 md:h-48 bg-linear-to-r from-blue-50 to-indigo-50 relative">
            {profile.cover_url ? (
              <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px]" />
            )}
          </div>

          <div className="px-6 pb-8">
            <div className="flex flex-col items-center md:items-start -mt-12 mb-4">
              
              {/* Avatar Container */}
              <div className="flex flex-col md:flex-row gap-6 w-full items-center md:items-end">
                <div className="relative z-10 w-28 h-28 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-3xl font-bold text-gray-400 select-none">
                      {profile.full_name?.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Name & Headline */}
                <div className="text-center md:text-left flex-1 mb-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.full_name}</h1>
                    {profile.is_verified && <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />}
                  </div>
                  <p className="text-gray-500 text-[15px] mt-1">{profile.headline || "Volunteer"}</p>
                  
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-gray-500">
                     {profile.city && (
                       <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city}</div>
                     )}
                     {profile.availability_status && (
                       <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-md border border-green-100 text-xs font-medium uppercase tracking-wide">
                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                         {profile.availability_status}
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              
              {/* Reliability Score Card */}
              <div className="col-span-2 md:col-span-1 bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 mb-2">
                  <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={reliabilityScore > 80 ? "#22c55e" : "#3b82f6"} strokeWidth="8"
                      strokeDasharray={strokeDasharray} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-gray-900">{reliabilityScore}%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reliability</p>
              </div>

              {/* Stat 1 */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <Clock className="w-6 h-6 text-indigo-500 mb-4" />
                <div>
                   <div className="text-2xl font-bold text-gray-900">{profile.total_hours || 0}</div>
                   <div className="text-sm text-gray-500">Hours Contributed</div>
                </div>
              </div>

               {/* Stat 2 */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <Calendar className="w-6 h-6 text-orange-500 mb-4" />
                <div>
                   <div className="text-2xl font-bold text-gray-900">{profile.events_attended || 0}</div>
                   <div className="text-sm text-gray-500">Events Attended</div>
                </div>
              </div>

               {/* Stat 3 */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <Trophy className="w-6 h-6 text-yellow-500 mb-4" />
                <div>
                   <div className="text-2xl font-bold text-gray-900">{profile.badges?.length || 0}</div>
                   <div className="text-sm text-gray-500">Badges Earned</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT SPLIT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          
          {/* Left Column: Bio & Skills */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-900 mb-3 text-lg">About</h3>
               <p className="text-gray-600 text-[15px] leading-relaxed">
                 {profile.bio || "No bio added yet."}
               </p>
            </div>

            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Journey */}
          <div className="md:col-span-2">
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-100">
                <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" /> Volunteer Journey
                </h3>

                {journey.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                     {journey.map((item, idx) => (
                       <div key={idx} className="relative flex items-start gap-4">
                         {/* Icon on timeline */}
                         <div className="absolute left-6 -translate-x-1/2 mt-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500 z-10 shadow-[0_0_0_4px_white]" />
                         
                         <div className="ml-10 w-full">
                           <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                             <div className="flex items-start justify-between gap-4">
                               <div className="flex gap-3">
                                  {/* Org Logo */}
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.organization_logo ? <img src={item.organization_logo} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-gray-400" />}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-[15px]">{item.event_title}</h4>
                                    <p className="text-xs text-gray-500">{item.organization_name}</p>
                                  </div>
                               </div>
                               <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{formatDate(item.event_date)}</span>
                             </div>

                             <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 pl-13">
                               <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                 <Clock className="w-3.5 h-3.5" /> {item.hours_contributed} hrs
                               </span>
                               {item.status === 'completed' && (
                                 <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                                   <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                 </span>
                               )}
                             </div>

                             {item.endorsements?.comment && (
                               <div className="mt-3 ml-13 text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                                 "{item.endorsements.comment}"
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}