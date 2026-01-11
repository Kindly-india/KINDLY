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
  const [myRegistration, setMyRegistration] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Review State
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // 1. Fetch Profile
        const profileRes = await api.getUserProfile().catch(() => null);
        const currentUser = profileRes?.profile;
        if (currentUser) setProfile(currentUser);

        if (id) {
          // 2. Fetch Event
          let eventData = null;
          try {
            const res = await api.getEventById(id as string);
            eventData = res.event;
          } catch (authError) {
            const publicRes = await api.getPublicEventById(id as string);
            eventData = publicRes.event;
          }
          setEvent(eventData);

          // 3. Fetch Registration & Review Status
          if (currentUser && eventData) {
            try {
              const [myRegs, myReviewRes] = await Promise.all([
                api.getVolunteerRegistrations(),
                api.getMyReview(id as string) // ✅ Fetch existing review
              ]);

              const thisEventReg = myRegs.events.find((e: any) => e.id === eventData.id);
              if (thisEventReg) setMyRegistration(thisEventReg);

              // ✅ Check if review exists
              if (myReviewRes?.review) {
                setSubmitted(true);
                setRating(myReviewRes.review.rating);
                setReviewText(myReviewRes.review.comment);
              }

            } catch (err) {
              console.log("Error fetching user data");
            }
          }
        }
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

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

  // Helpers
  const galleryImages = [event?.cover_image_url, ...(event?.gallery_images || [])].filter(Boolean);
  const displayImages = galleryImages.length > 0 ? galleryImages : ["https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=60", "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop&q=60"];
  const displayImage = profile?.avatar_url || profile?.logo_url;
  const displayName = profile?.full_name || profile?.name || "User";
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U";

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-900" /></div>
  if (!event) return <div className="h-screen flex items-center justify-center text-gray-500">Event not found</div>

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* NAVBAR */}
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
                {displayImage ? <img src={displayImage} className="w-full h-full object-cover" /> : <span className="font-bold text-gray-500 text-xs">{displayInitial}</span>}
              </div>
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="w-8 h-8 rounded-full bg-[#f5f5f7] flex md:hidden items-center justify-center hover:bg-[#e5e5e7]">
                {menuOpen ? <X className="w-4 h-4 text-[#1d1d1f]" /> : <Menu className="w-4 h-4 text-[#1d1d1f]" />}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative h-[50vh] md:h-[60vh] w-full bg-gray-900">
        <img src={event.cover_image_url || "/placeholder-event.jpg"} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-60"/>
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          
          <div className="md:col-span-8 space-y-8 md:space-y-12">
             {/* Stats */}
             <div className="flex gap-2 md:gap-4 p-4 md:p-6 bg-gray-50 rounded-2xl border border-gray-100 justify-around">
                <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{event.registered_count || 0}</div>
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase">Volunteers</div>
                </div>
                <div className="text-center border-l border-gray-200 pl-4">
                    <div className="text-xl md:text-2xl font-bold text-gray-900">4.5</div>
                    <div className="text-[10px] md:text-xs text-gray-500 uppercase">Hours</div>
                </div>
                <div className="text-center border-l border-gray-200 pl-4">
                    <div className="text-xl md:text-2xl font-bold text-gray-900">Success</div>
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
                        <div key={idx} className={`relative rounded-xl overflow-hidden shadow-sm aspect-square`}>
                        <img src={src} className="w-full h-full object-cover" />
                        </div>
                    ))}
                    </div>
                ) : <p className="text-gray-500 italic">No images available.</p>}
             </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-4 space-y-6">
             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm md:sticky md:top-24">
                <h3 className="font-bold text-gray-900 mb-4">Organizer</h3>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border"><Building2 className="w-5 h-5 text-gray-400"/></div>
                    <div>
                        <div className="font-bold text-sm text-gray-900">{event.organization_name}</div>
                        <div className="text-xs text-gray-500">View Profile</div>
                    </div>
                </div>
                <button className="w-full py-2.5 bg-black text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                    <Download className="w-3.5 h-3.5" /> Download Report
                </button>
             </div>
          </div>

          {/* ✅ CERTIFICATE & REVIEW SECTION */}
          {event?.certificates_issued && (myRegistration?.registration_status === 'completed' || myRegistration?.registration_status === 'checked_in') && (
            <div className="col-span-full md:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 md:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Your Participation</h2>

              {/* ✅ RESPONSIVE CERTIFICATE */}
              <div className="relative w-full rounded-xl border-[4px] md:border-[8px] border-double border-gray-900 bg-white p-4 md:p-8 shadow-xl mb-6 overflow-hidden">
                <div className="relative z-10 flex flex-col items-center text-center space-y-4 md:space-y-6">
                  
                  {/* Header */}
                  <div>
                    <div className="flex justify-center items-center mb-1">
                      <span className="text-lg md:text-2xl font-black tracking-tighter">KINDLY</span>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full ml-1 md:ml-2"></div>
                    </div>
                    <h2 className="text-xl md:text-3xl font-serif font-bold text-gray-900">CERTIFICATE</h2>
                    <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500">OF VOLUNTEERING</p>
                  </div>

                  {/* Body */}
                  <div className="w-full">
                    <p className="text-[10px] md:text-xs text-gray-500 italic mb-1 md:mb-2">This is to certify that</p>
                    <h3 className="text-lg md:text-2xl font-bold text-blue-600 mb-2 font-serif break-words">
                        {profile?.full_name || 'Volunteer'}
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-600 max-w-md mx-auto">
                      has successfully completed volunteer service at <br/>
                      <span className="font-bold text-gray-900">{event.title}</span>
                    </p>
                  </div>

                  {/* Footer - Stacks on Mobile, Row on Desktop */}
                  <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 mt-4 md:mt-8 relative">
                    
                    {/* Sign 1 */}
                    <div className="flex flex-col items-center order-2 md:order-1">
                      <span className="font-cursive text-sm md:text-xl">{event.organization_name}</span>
                      <div className="w-16 md:w-24 h-[1px] bg-gray-300 mt-1"></div>
                      <p className="text-[8px] font-bold text-gray-500 mt-1 uppercase">Organizer</p>
                    </div>

                    {/* Seal - Normal flow on mobile, centered absolute on desktop */}
                    <div className="order-1 md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 md:bottom-2">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-50">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                      </div>
                    </div>

                    {/* Sign 2 */}
                    <div className="flex flex-col items-center order-3 md:order-3">
                      <span className="text-[10px] md:text-sm text-gray-400 italic">Signed Digitally</span>
                      <div className="w-16 md:w-24 h-[1px] bg-gray-300 mt-1"></div>
                      <p className="text-[8px] font-bold text-gray-500 mt-1 uppercase">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => window.print()} className="h-10 md:h-11 bg-blue-600 text-white rounded-xl font-semibold text-xs md:text-sm flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button className="h-10 md:h-11 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-xs md:text-sm flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>

              {/* Review Section (Conditional) */}
              {submitted ? (
                <div className="border-t border-gray-100 pt-6 text-center">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2"><Check className="w-5 h-5" /></div>
                    <h3 className="font-bold text-gray-900 text-sm">Review Submitted</h3>
                    <p className="text-gray-500 text-xs">Thank you for your feedback!</p>
                    <div className="mt-2 flex justify-center gap-1">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
                    </div>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-6">
                    <h3 className="font-semibold text-sm md:text-base mb-3">Rate Your Experience</h3>
                    <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className="hover:scale-110 transition-transform focus:outline-none">
                        <Star className={`w-6 h-6 md:w-8 md:h-8 ${rating >= star ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                        </button>
                    ))}
                    </div>
                    <textarea 
                        value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your experience (optional)..."
                        className="w-full h-20 p-3 bg-gray-50 rounded-lg resize-none text-sm focus:outline-none border border-transparent focus:border-gray-200 focus:bg-white transition-all"
                    />
                    <button onClick={handleSubmitReview} disabled={submitting} className="w-full mt-3 h-10 md:h-11 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 disabled:opacity-50">
                        {submitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}