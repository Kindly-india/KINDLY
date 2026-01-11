"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Calendar, MapPin, Users, Clock,
  Share2, CheckCircle2, Building2, Loader2,
  Download, Check, Menu, X, Sparkles,
  Star
} from "lucide-react"
import { api } from "@/lib/api"

export default function EventShowcasePage() {
  const { id } = useParams()


  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myRegistration, setMyRegistration] = useState<any>(null) // ✅ NEW: Track user's status
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // 1. Fetch Profile
        const profileRes = await api.getUserProfile().catch(() => null);
        const currentUser = profileRes?.profile;
        if (currentUser) setProfile(currentUser);

        if (id) {
          // 2. Fetch Event Details
          let eventData = null;
          try {
            const res = await api.getEventById(id as string);
            eventData = res.event;
          } catch (authError) {
            const publicRes = await api.getPublicEventById(id as string);
            eventData = publicRes.event;
          }
          setEvent(eventData);

          // 3. ✅ FIXED: Fetch Registration Status (No arguments needed)
          if (currentUser && eventData) {
            try {
              // REMOVED currentUser.user_id argument
              const myRegs = await api.getVolunteerRegistrations();

              // Filter to find the current event
              const thisEventReg = myRegs.events.find((e: any) => e.id === eventData.id);

              if (thisEventReg) {
                setMyRegistration(thisEventReg);
              }
            } catch (err) {
              console.log("Not registered or error fetching registration");
            }
          }
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  // Gallery Logic
  const galleryImages = [
    event?.cover_image_url,
    ...(event?.gallery_images || []),
  ].filter(Boolean);

  const displayImages = galleryImages.length > 0 ? galleryImages : [
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60"
  ];

  const displayImage = profile?.avatar_url || profile?.logo_url
  const displayName = profile?.full_name || profile?.name || "User"
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U"

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-900" /></div>
  if (!event) return <div className="h-screen flex items-center justify-center text-gray-500">Event not found</div>

  // ✅ DEBUGGING: Uncomment this to force-show the section while developing
  // const forceShowCertificate = true; 

  return (
    <div className="min-h-screen bg-white pb-20">

      {/* NAVBAR (Unchanged) */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5e5e7]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-11 md:h-14 flex items-center justify-between relative">
          <Link href="/home" className="flex items-center shrink-0">
            <Image src="/logo.png" alt="Kindly" width={120} height={40} className="h-8 md:h-10 w-auto" priority />
          </Link>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/events" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">Events</Link>
            <Link href="/history" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">History</Link>
            <Link href="/social" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">Social</Link>
            <Link href="/volunteer-impact" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium flex items-center gap-1.5">Impact</Link>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link href={profile?.id ? `/volunteers/${profile.id}` : '#'} className="hidden md:block group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-gray-200 group-hover:border-gray-400 transition-all bg-gray-50 flex items-center justify-center shadow-sm">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-gray-500 text-xs">{displayInitial}</span>
                )}
              </div>
            </Link>
            <div className="relative md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7]">
                {menuOpen ? <X className="w-4 h-4 text-[#1d1d1f]" /> : <Menu className="w-4 h-4 text-[#1d1d1f]" />}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 z-50 w-48 bg-white rounded-xl shadow-xl border border-[#e5e5e7] overflow-hidden">
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] border-b border-[#f5f5f7] text-sm">Profile</Link>
                  <Link href="/home" className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] border-b border-[#f5f5f7] text-sm">Home</Link>
                  <Link href="/events" className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] border-b border-[#f5f5f7] text-sm">Events</Link>
                  <Link href="/history" className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] text-sm">History</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative h-[60vh] w-full bg-gray-900">
        <img
          src={event.cover_image_url || "/placeholder-event.jpg"}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs mb-3">
              <CheckCircle2 className="w-4 h-4" /> Completed Event
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-gray-200 text-sm md:text-base">
              <div className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {new Date(event.event_date).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {event.location}</div>
              <div className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Organized by {event.organization_name || "Organization"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* MAIN CONTENT */}
          <div className="md:col-span-8 space-y-12">

            {/* STATS ROW */}
            <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 justify-around">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full mx-auto mb-2"><Users className="w-5 h-5" /></div>
                <div className="text-2xl font-bold text-gray-900">{event.registered_count || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Volunteers</div>
              </div>
              <div className="text-center border-l border-gray-200 pl-4">
                <div className="flex items-center justify-center w-10 h-10 bg-amber-100 text-amber-600 rounded-full mx-auto mb-2"><Clock className="w-5 h-5" /></div>
                <div className="text-2xl font-bold text-gray-900">4.5</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Hours</div>
              </div>
              <div className="text-center border-l border-gray-200 pl-4">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full mx-auto mb-2"><CheckCircle2 className="w-5 h-5" /></div>
                <div className="text-2xl font-bold text-gray-900">Success</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">About the Impact</h2>
              <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
                <p>{event.description}</p>
                <p>
                  Volunteers gathered to make a significant difference. From setup to execution, the energy was palpable.
                  We achieved our goals and connected with the community in meaningful ways.
                </p>
              </div>
            </div>

            {/* GALLERY GRID */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Event Gallery</h2>
              {displayImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {displayImages.map((src, idx) => (
                    <div key={idx} className={`relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer ${idx === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-square'}`}>
                      <img
                        src={src}
                        alt="Gallery"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No gallery images available for this event.</p>
              )}
            </div>

          </div>

          {/* SIDEBAR */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Organizer</h3>

              <Link href={`/organizations/${event.organization_id || '#'}`} className="flex items-center gap-4 mb-6 group">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{event.organization_name || "View Organization"}</div>
                  <div className="text-xs text-gray-500">View Profile</div>
                </div>
              </Link>

              <hr className="border-gray-100 my-4" />

              <h4 className="font-bold text-sm text-gray-900 mb-3">What we achieved</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Community Engagement</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Sustainable Impact</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Skill Development</li>
              </ul>
            </div>
          </div>
          
          {event?.certificates_issued && myRegistration?.registration_status === 'checked_in' && (
            <div className="col-span-full md:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Your Participation</h2>

              {/* Impact Summary */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="text-gray-600">
                  You contributed{" "}
                  <span className="text-emerald-600 font-bold text-2xl">
                    {(() => {
                      const [startH, startM] = (event.start_time || '00:00').split(':').map(Number);
                      const [endH, endM] = (event.end_time || '00:00').split(':').map(Number);
                      const hours = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
                      return hours.toFixed(1);
                    })()}h
                  </span>{" "}
                  to this cause
                </p>
              </div>

              {/* Certificate Preview */}
              <div className="relative aspect-video rounded-xl border-[8px] border-double border-gray-900 bg-white p-8 shadow-2xl mb-6">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <div className="relative z-10 h-full flex flex-col justify-between text-center">
                  {/* Header */}
                  <div>
                    <div className="flex justify-center mb-2">
                      <span className="text-2xl font-black tracking-tighter">KINDLY</span>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 ml-2"></div>
                    </div>
                    <h2 className="text-3xl font-serif font-bold mb-1">CERTIFICATE</h2>
                    <p className="text-xs uppercase tracking-widest text-gray-500">OF VOLUNTEERING</p>
                  </div>

                  {/* Body */}
                  <div>
                    <p className="text-xs text-gray-500 italic mb-2">This is to certify that</p>
                    <h3 className="text-2xl font-bold text-blue-600 mb-2 font-serif">{profile?.full_name || 'Volunteer'}</h3>
                    <p className="text-xs text-gray-600 max-w-[80%] mx-auto">
                      has successfully completed volunteer service at
                      <br />
                      <span className="font-bold">{event.title}</span>
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-end px-8">
                    <div className="flex flex-col items-center">
                      {/* TODO: Add Org Signature Image here if available */}
                      <span className="font-cursive text-xl">{event.organization_name}</span>
                      <div className="w-24 h-[1px] bg-gray-300 mt-1"></div>
                      <p className="text-[8px] font-bold text-gray-500 mt-1 uppercase">Organizer</p>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 bottom-4">
                      <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-50">
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-400 italic">Signed Digitally</span>
                      <div className="w-24 h-[1px] bg-gray-300 mt-1"></div>
                      <p className="text-[8px] font-bold text-gray-500 mt-1 uppercase">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => window.print()} className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button className="h-11 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>

              {/* Review Section */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold mb-3">Rate Your Experience</h3>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="hover:scale-110 transition-transform">
                      <Star className="w-8 h-8 text-gray-300 hover:text-amber-400" />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Share your experience (optional)..."
                  className="w-full h-20 p-3 bg-gray-50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="w-full mt-3 h-11 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg">
                  Submit Feedback
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}