"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MapPin, Calendar, ChevronLeft, Loader2, CheckCircle2, Edit2,
  Sparkles, Trophy, Mail, Phone, UserPlus,
  UserCheck, UserMinus, Download, Share2, Linkedin, Instagram, Globe,
  Home, Copy, Check, Quote, Building2, Languages, GraduationCap,
  Image as ImageIcon, Plus, Trash2
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

// --- SUB-COMPONENTS ---

function Testimonials({ journey }: { journey: any[] }) {
  const reviews = journey.filter(j => j.endorsements?.comment);
  if (reviews.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Quote className="w-5 h-5 text-purple-500" /> What Organizations Say
      </h3>
      <div className="grid gap-4">
        {reviews.slice(0, 3).map((review, idx) => (
          <div key={idx} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 relative">
             <Quote className="w-8 h-8 text-purple-200 absolute top-2 right-2 rotate-180" />
             <p className="text-gray-700 italic text-sm mb-3 relative z-10">"{review.endorsements.comment}"</p>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-purple-100 flex items-center justify-center overflow-hidden">
                   {review.organization_logo ? <img src={review.organization_logo} className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4 text-gray-400" />}
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-900">{review.organization_name}</p>
                   <p className="text-[10px] text-gray-500">{review.event_title}</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Credentials() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
       <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Credentials</h3>
       <div className="mb-5">
          <div className="flex items-center gap-2 text-sm text-gray-900 font-medium mb-2">
             <Languages className="w-4 h-4 text-blue-500" /> Languages
          </div>
          <div className="flex flex-wrap gap-2">
             <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">English (Native)</span>
             <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">Hindi (Fluent)</span>
          </div>
       </div>
       <div>
          <div className="flex items-center gap-2 text-sm text-gray-900 font-medium mb-2">
             <GraduationCap className="w-4 h-4 text-emerald-500" /> Certifications
          </div>
          <div className="space-y-2">
             <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs border border-red-100">RC</div>
                <div>
                   <p className="text-xs font-bold text-gray-900">First Aid & CPR</p>
                   <p className="text-[10px] text-gray-500">Red Cross • Issued 2024</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}

function ActionGallery({ userId, isOwnProfile }: { userId: string, isOwnProfile: boolean }) {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadGallery = async () => {
       try {
         const res = await api.getVolunteerGallery(userId);
         setPhotos(res || []);
       } catch (err) {}
    }
    if (userId) loadGallery();
  }, [userId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const newPhoto = await api.uploadGalleryPhoto(file);
      setPhotos([newPhoto, ...photos]);
    } catch (err) {
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  const handleDelete = async (photoId: string) => {
    if(!confirm("Delete this photo?")) return;
    try {
        await api.deleteGalleryPhoto(photoId);
        setPhotos(photos.filter(p => p.id !== photoId));
    } catch (err) { alert("Delete failed"); }
  }

  if (!photos.length && !isOwnProfile) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
       <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-500" /> Action Gallery
          </h3>
          {isOwnProfile && (
             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={uploading}
               className="text-xs flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
             >
               {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
               Add Photo
             </button>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
       </div>

       {photos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
             <p className="text-xs text-gray-500">Share moments from your volunteering drives.</p>
          </div>
       ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             {photos.map((photo) => (
               <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={photo.image_url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                            onClick={() => handleDelete(photo.id)}
                            className="p-2 bg-red-500/80 backdrop-blur rounded-full text-white hover:bg-red-600 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  )}
               </div>
             ))}
          </div>
       )}
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---

export default function VolunteerProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [journey, setJourney] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [activityData, setActivityData] = useState<any[]>([])
  const [isViewerOrg, setIsViewerOrg] = useState(false);
  
  const [coverError, setCoverError] = useState(false)
  const [copied, setCopied] = useState(false)

useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const fetchProfile = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch Profile & Journey
        const [profileRes, journeyRes, currentUser] = await Promise.all([
           api.getVolunteerPublicProfile(id as string),
           api.getVolunteerJourney(id as string),
           api.getCurrentUser().catch(() => null)
        ])

        if (!isMounted) return;

        const fetchedProfile = profileRes.profile;
        setProfile(fetchedProfile)
        setActivityData(fetchedProfile.activity_graph || [])
        setJourney(journeyRes.journey || [])

        // 2. Check Viewer Type
        const isSelf = currentUser?.id === fetchedProfile.user_id;
        setIsOwnProfile(isSelf);

        const hasToken = localStorage.getItem('token') || currentUser;
        if (currentUser?.user_metadata?.user_type === 'organization') {
            // (You might need to define this state if you haven't yet, derived from previous steps)
            // setIsViewerOrg(true); 
        }

        // 3. ✅ INDEPENDENT FOLLOW CHECK (Runs every time)
        if (!isSelf && currentUser && fetchedProfile.user_id) {
            // We verify the status again to ensure UI matches DB
            api.getFollowStatus(fetchedProfile.user_id)
               .then(res => {
                   if (isMounted) setIsFollowing(res.isFollowing);
               })
               .catch(err => console.error("Follow check error:", err));
        }

      } catch (err) {
        console.error("Profile fetch error:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProfile()

    return () => { isMounted = false; }
  }, [id])

  const handleFollow = async () => {
    if (!profile?.user_id) return
    try {
      if (isFollowing) {
        await api.unfollowUser(profile.user_id)
        setIsFollowing(false)
        setProfile((prev: any) => ({...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }))
      } else {
        await api.followUser(profile.user_id)
        setIsFollowing(true)
        setProfile((prev: any) => ({...prev, followers_count: (prev.followers_count || 0) + 1 }))
      }
    } catch (err: any) {
      alert(`Follow failed: ${err.message || "Unknown error"}`);
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Volunteer Profile',
          text: `Check out ${profile.full_name}'s impact on Kindly!`,
          url: window.location.href
        })
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getExternalLink = (url: string) => {
    if (!url) return "#";
    return url.startsWith('http') ? url : `https://${url}`;
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 text-gray-900 animate-spin" /></div>
  if (!profile) return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Profile not found</div>

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
      
      {/* 1. TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all relative"
             >
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
             </button>

{isOwnProfile ? (
                <Link href="/settings/profile" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </Link>
             ) : (
                // ✅ LOGIC: Hide if Viewer is Org
                !isViewerOrg && (
                  <button 
                    onClick={handleFollow}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2",
                      isFollowing 
                        ? "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300" // Unfollow Style
                        : "bg-black text-white hover:bg-gray-800" // Follow Style
                    )}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" /> Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Follow
                      </>
                    )}
                  </button>
                )
             )}
          </div>
        </div>
      </nav>

      {/* 2. COVER IMAGE */}
      <div className="h-48 md:h-64 bg-gray-200 w-full relative overflow-hidden group">
        {!coverError && profile.cover_url ? (
          <img 
            src={profile.cover_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
            onError={() => setCoverError(true)}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-r from-slate-800 to-slate-900 flex items-center justify-center">
             <Sparkles className="w-12 h-12 text-white/10" />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 3. LEFT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
             {/* Profile Card */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 -mt-20 mb-4">
                   {profile.avatar_url ? (
                     <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">{profile.full_name?.charAt(0)}</div>
                   )}
                </div>

                <div className="mb-6">
                   <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                      {profile.is_verified && <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />}
                   </div>
                   <p className="text-gray-600 font-medium">{profile.headline || "Volunteer"}</p>
                   {profile.city && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <MapPin className="w-4 h-4" /> {profile.city}
                      </div>
                   )}
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-4 mb-6">
                   <div className="text-center">
                      <span className="block font-bold text-gray-900 text-lg">{profile.followers_count || 0}</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Followers</span>
                   </div>
                   <div className="text-center border-l border-gray-100">
                      <span className="block font-bold text-gray-900 text-lg">{profile.following_count || 0}</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Following</span>
                   </div>
                   <div className="text-center border-l border-gray-100">
                      <span className="block font-bold text-gray-900 text-lg">{profile.total_hours || 0}</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Hours</span>
                   </div>
                </div>

                <div className="flex gap-3 pt-2 justify-center lg:justify-start">
                   {profile.linkedin && <a href={getExternalLink(profile.linkedin)} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-blue-600 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>}
                   {profile.instagram && <a href={getExternalLink(profile.instagram)} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-pink-600 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>}
                   {profile.website && <a href={getExternalLink(profile.website)} target="_blank" className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 hover:text-black transition-colors"><Globe className="w-5 h-5" /></a>}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    <button className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                       <Download className="w-4 h-4" /> Download Resume
                    </button>
                </div>
             </div>

             {/* CONTACT DETAILS */}
             {(isOwnProfile || profile.view_type === 'private' || profile.view_type === 'resume') && (
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Contact Details</h3>
                    <div className="space-y-3">
                       {profile.email ? (
                         <div className="flex items-center gap-3 text-sm text-gray-600">
                           <Mail className="w-4 h-4 text-gray-400" /> 
                           <span>{profile.email}</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            <span>Email not added.</span>
                            {isOwnProfile && <Link href="/settings/profile" className="underline font-semibold">Add now</Link>}
                         </div>
                       )}
                       {profile.phone && (
                         <div className="flex items-center gap-3 text-sm text-gray-600">
                           <Phone className="w-4 h-4 text-gray-400" /> 
                           <span>{profile.phone}</span>
                         </div>
                       )}
                       {profile.address && (
                         <div className="flex items-start gap-3 text-sm text-gray-600">
                           <Home className="w-4 h-4 text-gray-400 mt-0.5" /> 
                           <span>{profile.address}</span>
                         </div>
                       )}
                    </div>
                 </div>
             )}

             {/* Skills */}
             {profile.skills && profile.skills.length > 0 && (
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Skills</h3>
                    <div className="flex flex-wrap gap-2">
                       {profile.skills.map((skill: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">{skill}</span>
                       ))}
                    </div>
                 </div>
             )}

             {/* Credentials Card */}
             <Credentials />
          </div>

          {/* 4. MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-6">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">About</h3>
                    {profile.created_at && <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Member since {new Date(profile.created_at).getFullYear()}</span>}
                </div>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">{profile.bio || "No bio added yet."}</p>
             </div>
             
             {/* Impact & Graph */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-24 h-24" /></div>
                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide mb-1">Impact Score</h3>
                    <div className="text-4xl font-bold mb-4">{profile.impact_score || 0}</div>
                    <div className="flex gap-4">
                        <div><span className="text-xs text-slate-400 block">Reliability</span><span className="font-semibold text-emerald-400">{profile.reliability_score || 100}%</span></div>
                        <div><span className="text-xs text-slate-400 block">Rank</span><span className="font-semibold text-amber-400">{profile.total_hours > 50 ? 'Gold' : profile.total_hours > 10 ? 'Silver' : 'Bronze'}</span></div>
                    </div>
                 </div>

                 <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Monthly Activity (Hours)</h3>
                    <div className="h-32">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={activityData}>
                           <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                           <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                           <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={20}>
                             {activityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.hours > 0 ? '#3b82f6' : '#e5e7eb'} />)}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
             </div>

             {/* Action Gallery */}
             <ActionGallery userId={profile.user_id} isOwnProfile={isOwnProfile} />

             {/* Testimonials */}
             <Testimonials journey={journey} />

             {/* Certificates */}
             {profile.badges && profile.badges.length > 0 && (
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Certificates & Badges</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                       {profile.badges.map((badge: string, idx: number) => (
                           <div key={idx} className="min-w-[140px] p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex flex-col items-center justify-center text-center">
                              <div className="w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center mb-3">
                                 <Trophy className="w-6 h-6 text-amber-500" />
                              </div>
                              <h4 className="font-bold text-gray-900 text-sm">{badge}</h4>
                              <p className="text-xs text-gray-500 mt-1">Earned via Activity</p>
                           </div>
                       ))}
                    </div>
                 </div>
             )}

             {/* Journey */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Volunteering History</h3>
                {journey.length === 0 ? (
                    <div className="text-center py-10"><Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">No history yet.</p></div>
                ) : (
                    <div className="space-y-8 relative pl-2">
                        <div className="absolute top-2 left-[27px] h-full w-0.5 bg-gray-200 -z-10" />
                        {journey.map((item, idx) => (
                            <div key={idx} className="flex gap-4 relative group">
                                <div className="w-14 shrink-0 flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-white border-2 border-blue-500 z-10 shadow-[0_0_0_4px_white] mb-2" />
                                    <span className="text-xs font-semibold text-gray-400">{formatDate(item.event_date).split(',')[0]}</span>
                                </div>
                                <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                                                {item.organization_logo ? <img src={item.organization_logo} className="w-full h-full object-cover rounded-lg" /> : <Building2 className="w-5 h-5 text-gray-400" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm md:text-base">{item.event_title}</h4>
                                                <p className="text-xs text-gray-500">{item.organization_name}</p>
                                            </div>
                                        </div>
                                        <span className={cn("px-2 py-1 border rounded text-xs font-medium whitespace-nowrap", item.hours_contributed > 0 ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-600 border-gray-200")}>{item.hours_contributed} hrs</span>
                                    </div>
                                    {item.endorsements?.comment && (
                                        <div className="mt-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                            <p className="text-sm text-gray-700 italic">"{item.endorsements.comment}"</p>
                                        </div>
                                    )}
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