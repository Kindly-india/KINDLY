"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, Camera, Loader2, X, Plus, MapPin, User,
  Briefcase, FileText, Globe, Building2, Phone, Mail, Hash,
  CalendarDays, BadgeCheck, Linkedin, Instagram, Home, UserCheck,
  Users2, Trophy, Trash2, Link as LinkIcon, Upload, Image as ImageIcon
} from "lucide-react"
import { api } from "@/lib/api"

export default function EditProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userType, setUserType] = useState<'volunteer' | 'organization' | null>(null)

  const [formData, setFormData] = useState<any>({})
  
  // Volunteer State
  const [newSkill, setNewSkill] = useState("")
  const [newInterest, setNewInterest] = useState("")

  // ✅ TEAM MEMBER STATE
  const [teamName, setTeamName] = useState("")
  const [teamRole, setTeamRole] = useState("")
  const [teamImage, setTeamImage] = useState("") // Stores the uploaded URL
  const [isUploadingTeam, setIsUploadingTeam] = useState(false)
  const teamFileInputRef = useRef<HTMLInputElement>(null)

  // ✅ ACHIEVEMENT STATE
  const [achTitle, setAchTitle] = useState("")
  const [achDate, setAchDate] = useState("")
  const [achDesc, setAchDesc] = useState("")
  const [achLink, setAchLink] = useState("") // External Link (Read More)
  const [achImgSource, setAchImgSource] = useState<'upload' | 'url'>('upload')
  const [achImageUrl, setAchImageUrl] = useState("") // Stores the final image URL
  const [isUploadingAch, setIsUploadingAch] = useState(false)
  const achFileInputRef = useRef<HTMLInputElement>(null)

  // Profile Image Refs
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const profileData = await api.getUserProfile()
        if (!profileData) return

        setUserType(profileData.userType as 'volunteer' | 'organization' | null)
        const p = profileData.profile

        if (profileData.userType === 'volunteer') {
          setFormData({
            full_name: p.full_name || '',
            headline: p.headline || '',
            bio: p.bio || '',
            city: p.city || '',
            address: p.address || '',
            email: p.email || '',
            phone: p.phone || '',
            linkedin: p.linkedin || '',
            instagram: p.instagram || '',
            website: p.website || '',
            skills: p.skills || [],
            interests: p.interests || [],
            availability_status: p.availability_status || '',
            avatar_url: p.avatar_url || '',
            cover_url: p.cover_url || ''
          })
        } else if (profileData.userType === 'organization') {
          setFormData({
            name: p.name || '',
            org_type: p.org_type || 'registered',
            email: p.email || '',
            phone: p.phone || '',
            tagline: p.tagline || '',
            mission_statement: p.mission_statement || '',
            intent_description: p.intent_description || '',
            area_locality: p.area_locality || '',
            website: p.website || '',
            linkedin: p.linkedin || '',
            instagram: p.instagram || '',
            years_active: p.years_active || '',
            registration_number: p.registration_number || '',
            representative_name: p.representative_name || '',
            designation: p.designation || '',
            logo_url: p.logo_url || '',
            cover_url: p.cover_url || '',
            team_members: p.team_members || [],
            achievements: p.achievements || []
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // --- GENERIC UPLOAD HANDLER ---
  const handleNestedUpload = async (file: File, type: 'team' | 'achievement') => {
    try {
      if (type === 'team') setIsUploadingTeam(true)
      else setIsUploadingAch(true)

      // We reuse the existing upload API. 
      // 'avatar' type creates a smaller, profile-optimized image url.
      // 'cover' type allows for larger images (good for achievements).
      const uploadType = type === 'team' ? 'avatar' : 'cover'; 
      const url = await api.uploadProfileImage(file, uploadType);

      if (type === 'team') setTeamImage(url)
      else setAchImageUrl(url)

    } catch (err: any) {
      alert("Upload failed: " + err.message)
    } finally {
      setIsUploadingTeam(false)
      setIsUploadingAch(false)
    }
  }

  // --- MAIN PROFILE UPLOAD ---
  const handleProfileImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    try {
      if (type === 'avatar') setUploadingAvatar(true)
      else setUploadingCover(true)
      const url = await api.uploadProfileImage(file, type)
      setFormData((prev: any) => ({
        ...prev,
        [type === 'avatar' ? (userType === 'volunteer' ? 'avatar_url' : 'logo_url') : 'cover_url']: url
      }))
    } catch (err: any) { alert(err.message) } 
    finally { setUploadingAvatar(false); setUploadingCover(false) }
  }

  // --- LIST HANDLERS ---
  const handleAddItem = (field: 'skills' | 'interests', value: string, setValue: (s: string) => void) => {
    if (value.trim() && !formData[field]?.includes(value.trim())) {
      setFormData((prev: any) => ({ ...prev, [field]: [...(prev[field] || []), value.trim()] }))
      setValue("")
    }
  }
  const handleRemoveItem = (field: 'skills' | 'interests', itemToRemove: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: prev[field]?.filter((item: string) => item !== itemToRemove) || [] }))
  }

  // ✅ TEAM LOGIC (Updated)
  const addTeamMember = () => {
    if (!teamName || !teamRole) return;
    const newMember = { 
        name: teamName, 
        role: teamRole, 
        img: teamImage // Attach the uploaded URL
    };
    setFormData((prev: any) => ({ 
        ...prev, 
        team_members: [...(prev.team_members || []), newMember] 
    }));
    // Reset inputs
    setTeamName(""); setTeamRole(""); setTeamImage("");
  }
  const removeTeamMember = (idx: number) => {
    setFormData((prev: any) => ({ ...prev, team_members: prev.team_members.filter((_: any, i: number) => i !== idx) }));
  }

  // ✅ ACHIEVEMENT LOGIC (Updated)
  const addAchievement = () => {
    if (!achTitle) return;
    const newAch = { 
        title: achTitle, 
        date: achDate, 
        description: achDesc,
        image_url: achImageUrl, // Image (Proof/Certificate)
        link: achLink // External Link (News Article)
    };
    setFormData((prev: any) => ({ 
        ...prev, 
        achievements: [...(prev.achievements || []), newAch] 
    }));
    // Reset inputs
    setAchTitle(""); setAchDate(""); setAchDesc(""); setAchLink(""); setAchImageUrl("");
  }
  const removeAchievement = (idx: number) => {
    setFormData((prev: any) => ({ ...prev, achievements: prev.achievements.filter((_: any, i: number) => i !== idx) }));
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      if (userType === 'volunteer') {
        const volunteerPayload: any = { ...formData }
        delete volunteerPayload.team_members; delete volunteerPayload.achievements;
        Object.keys(volunteerPayload).forEach(key => { if (volunteerPayload[key] === undefined) delete volunteerPayload[key] })
        await api.updateVolunteerProfile(volunteerPayload)
      } else if (userType === 'organization') {
        const orgPayload: any = {
          name: formData.name,
          tagline: formData.tagline,
          mission_statement: formData.mission_statement,
          intent_description: formData.intent_description,
          area_locality: formData.area_locality,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          linkedin: formData.linkedin,
          instagram: formData.instagram,
          registration_number: formData.registration_number,
          representative_name: formData.representative_name,
          designation: formData.designation,
          years_active: formData.years_active ? parseInt(formData.years_active) : undefined,
          logo_url: formData.logo_url,
          cover_url: formData.cover_url,
          
          // Arrays
          team_members: Array.isArray(formData.team_members) ? formData.team_members : [],
          achievements: Array.isArray(formData.achievements) ? formData.achievements : []
        }
        Object.keys(orgPayload).forEach(key => { if (orgPayload[key] === undefined) delete orgPayload[key] })
        await api.updateOrgProfile(orgPayload)
      }
      router.back()
    } catch (err: any) {
      console.error(err); alert("Update Failed");
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 text-black animate-spin" /></div>

  const currentAvatarUrl = userType === 'volunteer' ? formData.avatar_url : formData.logo_url
  const currentName = userType === 'volunteer' ? formData.full_name : formData.name

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-20">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Cancel</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900">Edit Profile</h1>
          <button onClick={handleSave} disabled={saving} className="bg-black text-white px-5 py-1.5 rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-6">
          
          {/* COVER & AVATAR SECTION */}
          <div className="relative h-48 bg-linear-to-r from-blue-50 to-slate-100 group">
            {formData.cover_url ? <img src={formData.cover_url} alt="Cover" className="w-full h-full object-cover" /> : <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px]" />}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer" onClick={() => coverInputRef.current?.click()}>
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                <Camera className="w-4 h-4" /><span className="text-xs font-bold text-gray-700">Change Cover</span>
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleProfileImageUpload(e.target.files[0], 'cover')} />
          </div>
          <div className="px-6 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 mb-6 gap-6 relative z-10">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative">
                  {currentAvatarUrl ? <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-300">{currentName?.charAt(0) || '?'}</div>}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleProfileImageUpload(e.target.files[0], 'avatar')} />
              </div>
              <div className="text-center md:text-left mb-2 md:mb-0 flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{currentName || 'Your Name'}</h2>
                <p className="text-sm text-gray-500">{userType === 'volunteer' ? formData.headline : formData.tagline || 'Add a tagline'}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* === VOLUNTEER FORM === */}
              {userType === 'volunteer' && (
                 <>
                   {/* ... Volunteer Fields (Hidden for brevity, keep your existing ones) ... */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Full Name" icon={<User className="w-4 h-4" />} value={formData.full_name} onChange={(v: any) => setFormData({ ...formData, full_name: v })} />
                    <InputField label="Headline" icon={<Briefcase className="w-4 h-4" />} value={formData.headline} onChange={(v: any) => setFormData({ ...formData, headline: v })} />
                   </div>
                   <TextAreaField label="Bio" value={formData.bio} onChange={(v: any) => setFormData({ ...formData, bio: v })} />
                   <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Contact & Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <InputField label="Email" icon={<Mail className="w-4 h-4" />} value={formData.email} onChange={(v: any) => setFormData({ ...formData, email: v })} />
                        <InputField label="Phone" icon={<Phone className="w-4 h-4" />} value={formData.phone} onChange={(v: any) => setFormData({ ...formData, phone: v })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="City" icon={<MapPin className="w-4 h-4" />} value={formData.city} onChange={(v: any) => setFormData({ ...formData, city: v })} />
                        <InputField label="Address" icon={<Home className="w-4 h-4" />} value={formData.address} onChange={(v: any) => setFormData({ ...formData, address: v })} />
                    </div>
                   </div>
                   <TagInput label="Skills" items={formData.skills} newItem={newSkill} setNewItem={setNewSkill} onAdd={() => handleAddItem('skills', newSkill, setNewSkill)} onRemove={(item: string) => handleRemoveItem('skills', item)} />
                 </>
              )}

              {/* === ORGANIZATION FORM === */}
              {userType === 'organization' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Organization Name" icon={<Building2 className="w-4 h-4" />} value={formData.name} onChange={(v: any) => setFormData({ ...formData, name: v })} />
                    <InputField label="Tagline" value={formData.tagline} onChange={(v: any) => setFormData({ ...formData, tagline: v })} />
                  </div>
                  <TextAreaField label="Mission Statement" value={formData.mission_statement} onChange={(v: any) => setFormData({ ...formData, mission_statement: v })} />
                  <TextAreaField label="About Us (Description)" value={formData.intent_description} onChange={(v: any) => setFormData({ ...formData, intent_description: v })} />

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <InputField label="City" icon={<MapPin className="w-4 h-4" />} value={formData.area_locality} onChange={(v: any) => setFormData({ ...formData, area_locality: v })} />
                      <InputField label="Website" icon={<Globe className="w-4 h-4" />} value={formData.website} onChange={(v: any) => setFormData({ ...formData, website: v })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Email" icon={<Mail className="w-4 h-4" />} value={formData.email} onChange={(v: any) => setFormData({ ...formData, email: v })} />
                      <InputField label="Phone" icon={<Phone className="w-4 h-4" />} value={formData.phone} onChange={(v: any) => setFormData({ ...formData, phone: v })} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-purple-600" /> Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="LinkedIn" icon={<Linkedin className="w-4 h-4" />} value={formData.linkedin} onChange={(v: any) => setFormData({ ...formData, linkedin: v })} />
                        <InputField label="Instagram" icon={<Instagram className="w-4 h-4" />} value={formData.instagram} onChange={(v: any) => setFormData({ ...formData, instagram: v })} />
                    </div>
                  </div>

                  {/* ✅ KEY PEOPLE (With Avatar Upload) */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Users2 className="w-4 h-4 text-indigo-600" /> Key People</h3>
                    
                    <div className="flex flex-col md:flex-row gap-3 mb-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        {/* Avatar Upload */}
                        <div onClick={() => teamFileInputRef.current?.click()} className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-300 overflow-hidden shrink-0 relative">
                            {teamImage ? <img src={teamImage} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-500" />}
                            {isUploadingTeam && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin"/></div>}
                        </div>
                        <input ref={teamFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleNestedUpload(e.target.files[0], 'team')} />

                        <input type="text" placeholder="Name" value={teamName} onChange={e => setTeamName(e.target.value)} className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none" />
                        <input type="text" placeholder="Role" value={teamRole} onChange={e => setTeamRole(e.target.value)} className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none" />
                        <button onClick={addTeamMember} disabled={isUploadingTeam} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50">Add</button>
                    </div>

                    <div className="space-y-2">
                        {formData.team_members?.map((m: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">{m.img ? <img src={m.img} className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-2 text-gray-400" />}</div>
                                    <div><p className="text-sm font-bold text-gray-900">{m.name}</p><p className="text-xs text-gray-500">{m.role}</p></div>
                                </div>
                                <button onClick={() => removeTeamMember(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* ✅ ACHIEVEMENTS (With Image Upload/URL Toggle) */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Wall of Fame</h3>
                    
                    <div className="flex flex-col gap-3 mb-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Title (e.g. Best NGO)" value={achTitle} onChange={e => setAchTitle(e.target.value)} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none" />
                            <input type="text" placeholder="Date (e.g. Jan 2024)" value={achDate} onChange={e => setAchDate(e.target.value)} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none" />
                        </div>
                        
                        {/* Image Switcher */}
                        <div className="flex gap-4 text-xs font-medium text-gray-600">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={achImgSource === 'upload'} onChange={() => setAchImgSource('upload')} /> Upload Image</label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={achImgSource === 'url'} onChange={() => setAchImgSource('url')} /> Image URL</label>
                        </div>

                        {achImgSource === 'upload' ? (
                            <div className="flex items-center gap-3">
                                <div onClick={() => achFileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500 w-full">
                                    <Upload className="w-4 h-4" /> {achImageUrl ? "Image Uploaded" : "Upload Certificate / Photo"}
                                </div>
                                <input ref={achFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleNestedUpload(e.target.files[0], 'achievement')} />
                                {isUploadingAch && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                            </div>
                        ) : (
                            <input type="text" placeholder="Paste Image URL" value={achImageUrl} onChange={e => setAchImageUrl(e.target.value)} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none" />
                        )}

                        <input type="text" placeholder="Article Link (Optional)" value={achLink} onChange={e => setAchLink(e.target.value)} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none" />
                        <textarea placeholder="Description" value={achDesc} onChange={e => setAchDesc(e.target.value)} className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none resize-none" rows={2} />
                        
                        <button onClick={addAchievement} disabled={isUploadingAch} className="bg-black text-white w-full py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50">Add Achievement</button>
                    </div>

                    <div className="space-y-2">
                        {formData.achievements?.map((a: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-xs">
                                <div className="flex gap-3">
                                    {a.image_url && <img src={a.image_url} className="w-12 h-12 object-cover rounded-md bg-gray-100" />}
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{a.title} <span className="text-gray-400 font-normal text-xs">• {a.date}</span></p>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{a.description}</p>
                                        {a.link && <a href={a.link} target="_blank" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1"><LinkIcon className="w-3 h-3"/> Read More</a>}
                                    </div>
                                </div>
                                <button onClick={() => removeAchievement(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Admin Details */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-600" /> Administrative Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <InputField label="Registration No." icon={<Hash className="w-4 h-4" />} value={formData.registration_number} onChange={(v: any) => setFormData({ ...formData, registration_number: v })} />
                      <InputField label="Years Active" type="number" icon={<CalendarDays className="w-4 h-4" />} value={formData.years_active} onChange={(v: any) => setFormData({ ...formData, years_active: v })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Representative Name" icon={<UserCheck className="w-4 h-4" />} value={formData.representative_name} onChange={(v: any) => setFormData({ ...formData, representative_name: v })} />
                      <InputField label="Designation" value={formData.designation} onChange={(v: any) => setFormData({ ...formData, designation: v })} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, icon, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 items-center gap-1.5">{icon} {label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-gray-400" />
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2"><FileText className="w-3 h-3 inline mr-1" /> {label}</label>
      <textarea rows={4} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none resize-none placeholder:text-gray-400" />
    </div>
  )
}

function TagInput({ label, items, newItem, setNewItem, onAdd, onRemove, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex gap-2 mb-3">
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} placeholder={placeholder} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/5" />
        <button onClick={onAdd} className="bg-black text-white px-4 rounded-xl hover:bg-gray-800 transition-colors"><Plus className="w-5 h-5" /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items?.map((item: string, idx: number) => (
          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-white text-gray-700 rounded-full text-xs font-medium border border-gray-200 shadow-sm">{item}<button onClick={() => onRemove(item)} className="p-0.5 hover:bg-gray-100 rounded-full"><X className="w-3 h-3 text-gray-400 hover:text-red-500 transition-colors" /></button></span>
        ))}
      </div>
    </div>
  )
}