"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, Camera, Loader2, X, Plus, MapPin, User,
  Briefcase, FileText, Globe, Building2, Phone, Mail, Hash,
  CalendarDays, BadgeCheck, Linkedin, Instagram, Home, UserCheck,
  Users2, Trophy, Trash2, Link as LinkIcon, Upload, Image as ImageIcon, Lock,
  IndianRupee
} from "lucide-react"
import { api } from "@/lib/api"
import { INTEREST_TAG_OPTIONS } from "@/lib/interest-tags"

const AVAILABILITY_OPTIONS = [
  { value: "weekends", label: "Weekends" },
  { value: "weekdays", label: "Weekdays" },
  { value: "remote", label: "Remote" },
  { value: "flexible", label: "Flexible" },
]

export default function EditProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userType, setUserType] = useState<'volunteer' | 'organization' | null>(null)

  const [formData, setFormData] = useState<any>({})

  // Volunteer State
  const [newSkill, setNewSkill] = useState("")

  // ✅ TEAM MEMBER STATE
  const [teamName, setTeamName] = useState("")
  const [teamRole, setTeamRole] = useState("")
  const [teamImage, setTeamImage] = useState("") 
  const [isUploadingTeam, setIsUploadingTeam] = useState(false)
  const teamFileInputRef = useRef<HTMLInputElement>(null)

  // ✅ ACHIEVEMENT STATE
  const [achTitle, setAchTitle] = useState("")
  const [achDate, setAchDate] = useState("")
  const [achDesc, setAchDesc] = useState("")
  const [achLink, setAchLink] = useState("") 
  const [achImgSource, setAchImgSource] = useState<'upload' | 'url'>('upload')
  const [achImageUrl, setAchImageUrl] = useState("") 
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
            interest_tags: p.interest_tags || [],
            preferred_availability: p.preferred_availability || '',
            avatar_url: p.avatar_url || '',
            cover_url: p.cover_url || '',
            is_private: p.is_private ?? false,
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
            years_active: p.years_active?.toString() || '',
            registration_number: p.registration_number || '',
            representative_name: p.representative_name || '',
            designation: p.designation || '',
            logo_url: p.logo_url || '',
            cover_url: p.cover_url || '',
            team_members: p.team_members || [],
            achievements: p.achievements || [],
            upi_id: p.upi_id || '',
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

  const handleNestedUpload = async (file: File, type: 'team' | 'achievement') => {
    try {
      if (type === 'team') setIsUploadingTeam(true)
      else setIsUploadingAch(true)

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

  const handleAddItem = (field: 'skills' | 'interest_tags', value: string, setValue: (s: string) => void) => {
    if (value.trim() && !formData[field]?.includes(value.trim())) {
      setFormData((prev: any) => ({ ...prev, [field]: [...(prev[field] || []), value.trim()] }))
      setValue("")
    }
  }

  const handleRemoveItem = (field: 'skills' | 'interest_tags', itemToRemove: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: prev[field]?.filter((item: string) => item !== itemToRemove) || [] }))
  }

  const addTeamMember = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!teamName || !teamRole) return;
    const newMember = { 
        name: teamName, 
        role: teamRole, 
        img: teamImage 
    };
    setFormData((prev: any) => ({ 
        ...prev, 
        team_members: [...(prev.team_members || []), newMember] 
    }));
    setTeamName(""); setTeamRole(""); setTeamImage("");
  }
  
  const removeTeamMember = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    setFormData((prev: any) => ({ ...prev, team_members: prev.team_members.filter((_: any, i: number) => i !== idx) }));
  }

  const addAchievement = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!achTitle) return;
    const newAch = { 
        title: achTitle, 
        date: achDate, 
        description: achDesc,
        image_url: achImageUrl, 
        link: achLink 
    };
    setFormData((prev: any) => ({ 
        ...prev, 
        achievements: [...(prev.achievements || []), newAch] 
    }));
    setAchTitle(""); setAchDate(""); setAchDesc(""); setAchLink(""); setAchImageUrl("");
  }
  
  const removeAchievement = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    setFormData((prev: any) => ({ ...prev, achievements: prev.achievements.filter((_: any, i: number) => i !== idx) }));
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const cleanedData = { ...formData }
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '') delete cleanedData[key]
      })

      if (userType === 'volunteer') {
        const volunteerPayload: any = { ...cleanedData }
        delete volunteerPayload.team_members
        delete volunteerPayload.achievements
        await api.updateVolunteerProfile(volunteerPayload)
      } else if (userType === 'organization') {
        const orgPayload: any = { ...cleanedData }
        if (orgPayload.years_active) orgPayload.years_active = parseInt(orgPayload.years_active)
        await api.updateOrgProfile(orgPayload)
      }
      router.back()
    } catch (err: any) {
      console.error(err)
      alert("Update Failed: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-foreground animate-spin" /></div>

  const currentAvatarUrl = userType === 'volunteer' ? formData.avatar_url : formData.logo_url
  const currentName = userType === 'volunteer' ? formData.full_name : formData.name

  return (
    <div className="min-h-screen bg-muted pb-20">
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Cancel</span>
          </button>
          <h1 className="text-base font-semibold text-foreground">Edit Profile</h1>
          <button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground px-5 py-1.5 rounded-full text-sm font-medium hover:bg-primary disabled:opacity-50 flex items-center gap-2 transition-colors">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border mb-6">
          
          <div className="relative h-48 bg-linear-to-r from-blue-50 to-muted group">
            {formData.cover_url ? <img src={formData.cover_url} alt="Cover" className="w-full h-full object-cover" /> : <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px]" />}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer" onClick={() => coverInputRef.current?.click()}>
              <div className="bg-card/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                <Camera className="w-4 h-4" /><span className="text-xs font-bold text-foreground">Change Cover</span>
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleProfileImageUpload(e.target.files[0], 'cover')} />
          </div>
          <div className="px-6 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 mb-6 gap-6 relative z-10">
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-full border-4 border-white bg-card shadow-md overflow-hidden relative">
                  {currentAvatarUrl ? <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">{currentName?.charAt(0) || '?'}</div>}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleProfileImageUpload(e.target.files[0], 'avatar')} />
              </div>
              <div className="text-center md:text-left mb-2 md:mb-0 flex-1">
                <h2 className="text-2xl font-bold text-foreground">{currentName || 'Your Name'}</h2>
                <p className="text-sm text-muted-foreground">{userType === 'volunteer' ? formData.headline : formData.tagline || 'Add a tagline'}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* === VOLUNTEER FORM === */}
              {userType === 'volunteer' && (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Full Name" icon={<User className="w-4 h-4" />} value={formData.full_name} onChange={(v: string) => setFormData({ ...formData, full_name: v })} />
                    <InputField label="Headline" icon={<Briefcase className="w-4 h-4" />} value={formData.headline} onChange={(v: string) => setFormData({ ...formData, headline: v })} />
                   </div>
                   <TextAreaField label="Bio" value={formData.bio} onChange={(v: string) => setFormData({ ...formData, bio: v })} />
                   
                   <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Contact & Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <InputField label="Email" icon={<Mail className="w-4 h-4" />} value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} />
                        <InputField label="Phone" icon={<Phone className="w-4 h-4" />} value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="City" icon={<MapPin className="w-4 h-4" />} value={formData.city} onChange={(v: string) => setFormData({ ...formData, city: v })} />
                        <InputField label="Address" icon={<Home className="w-4 h-4" />} value={formData.address} onChange={(v: string) => setFormData({ ...formData, address: v })} />
                    </div>
                   </div>

                   <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-purple-600" /> Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="LinkedIn" icon={<Linkedin className="w-4 h-4" />} value={formData.linkedin} onChange={(v: string) => setFormData({ ...formData, linkedin: v })} />
                        <InputField label="Instagram" icon={<Instagram className="w-4 h-4" />} value={formData.instagram} onChange={(v: string) => setFormData({ ...formData, instagram: v })} />
                    </div>
                  </div>

                   <div className="pt-4 border-t border-border">
                    <TagInput label="Skills" items={formData.skills} newItem={newSkill} setNewItem={setNewSkill} onAdd={(e: any) => { e?.preventDefault(); handleAddItem('skills', newSkill, setNewSkill)}} onRemove={(item: string) => handleRemoveItem('skills', item)} />
                   </div>

                   <div className="pt-4 border-t border-border">
                    <InterestTagPicker
                      selected={formData.interest_tags || []}
                      onAdd={(tag: string) => setFormData((prev: any) => prev.interest_tags?.includes(tag) ? prev : ({ ...prev, interest_tags: [...(prev.interest_tags || []), tag] }))}
                      onRemove={(tag: string) => handleRemoveItem('interest_tags', tag)}
                    />
                   </div>

                   <div className="pt-4 border-t border-border">
                    <SelectField
                      label="Availability"
                      icon={<CalendarDays className="w-4 h-4" />}
                      value={formData.preferred_availability}
                      onChange={(v: string) => setFormData({ ...formData, preferred_availability: v })}
                      options={AVAILABILITY_OPTIONS}
                    />
                   </div>

                   <div className="pt-4 border-t border-border">
                     <div className="flex items-center justify-between">
                       <div>
                         <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                           <Lock className="w-4 h-4 text-muted-foreground" /> Private Account
                         </h3>
                         <p className="text-xs text-muted-foreground mt-0.5">Only approved followers can see your activity.</p>
                       </div>
                       <button
                         type="button"
                         onClick={() => setFormData((prev: any) => ({ ...prev, is_private: !prev.is_private }))}
                         className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${formData.is_private ? 'bg-primary' : 'bg-muted'}`}
                         aria-label="Toggle private account"
                       >
                         <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform duration-200 ${formData.is_private ? 'translate-x-5' : 'translate-x-0'}`} />
                       </button>
                     </div>
                   </div>
                 </>
              )}

              {/* === ORGANIZATION FORM === */}
              {userType === 'organization' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Organization Name" icon={<Building2 className="w-4 h-4" />} value={formData.name} onChange={(v: string) => setFormData({ ...formData, name: v })} />
                    <InputField label="Tagline" value={formData.tagline} onChange={(v: string) => setFormData({ ...formData, tagline: v })} />
                  </div>
                  <TextAreaField label="Mission Statement" value={formData.mission_statement} onChange={(v: string) => setFormData({ ...formData, mission_statement: v })} />
                  <TextAreaField label="About Us (Description)" value={formData.intent_description} onChange={(v: string) => setFormData({ ...formData, intent_description: v })} />

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600" /> Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <InputField label="City" icon={<MapPin className="w-4 h-4" />} value={formData.area_locality} onChange={(v: string) => setFormData({ ...formData, area_locality: v })} />
                      <InputField label="Website" icon={<Globe className="w-4 h-4" />} value={formData.website} onChange={(v: string) => setFormData({ ...formData, website: v })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Email" icon={<Mail className="w-4 h-4" />} value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} />
                      <InputField label="Phone" icon={<Phone className="w-4 h-4" />} value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-purple-600" /> Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField label="LinkedIn" icon={<Linkedin className="w-4 h-4" />} value={formData.linkedin} onChange={(v: string) => setFormData({ ...formData, linkedin: v })} />
                        <InputField label="Instagram" icon={<Instagram className="w-4 h-4" />} value={formData.instagram} onChange={(v: string) => setFormData({ ...formData, instagram: v })} />
                    </div>
                  </div>

                  {/* ✅ KEY PEOPLE */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Users2 className="w-4 h-4 text-indigo-600" /> Key People</h3>
                    
                    <div className="flex flex-col md:flex-row gap-3 mb-3 bg-muted p-3 rounded-xl border border-border">
                        <div onClick={() => teamFileInputRef.current?.click()} className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center cursor-pointer hover:bg-muted overflow-hidden shrink-0 relative">
                            {teamImage ? <img src={teamImage} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                            {isUploadingTeam && <div className="absolute inset-0 bg-primary/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-primary-foreground animate-spin"/></div>}
                        </div>
                        <input ref={teamFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleNestedUpload(e.target.files[0], 'team')} />

                        <input type="text" placeholder="Name" value={teamName} onChange={e => setTeamName(e.target.value)} className="flex-1 bg-card border border-border px-3 py-2 rounded-lg text-sm outline-none" />
                        <input type="text" placeholder="Role" value={teamRole} onChange={e => setTeamRole(e.target.value)} className="flex-1 bg-card border border-border px-3 py-2 rounded-lg text-sm outline-none" />
                        <button onClick={addTeamMember} disabled={isUploadingTeam} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary disabled:opacity-50">Add</button>
                    </div>

                    <div className="space-y-2">
                        {formData.team_members?.map((m: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">{m.img ? <img src={m.img} className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-2 text-muted-foreground" />}</div>
                                    <div><p className="text-sm font-bold text-foreground">{m.name}</p><p className="text-xs text-muted-foreground">{m.role}</p></div>
                                </div>
                                <button onClick={(e) => removeTeamMember(e, i)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* ✅ ACHIEVEMENTS */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Wall of Fame</h3>
                    
                    <div className="flex flex-col gap-3 mb-3 bg-muted p-3 rounded-xl border border-border">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" placeholder="Title (e.g. Best NGO)" value={achTitle} onChange={e => setAchTitle(e.target.value)} className="bg-card border border-border px-3 py-2 rounded-lg text-sm outline-none" />
                            <input type="text" placeholder="Date (e.g. Jan 2024)" value={achDate} onChange={e => setAchDate(e.target.value)} className="bg-card border border-border px-3 py-2 rounded-lg text-sm outline-none" />
                        </div>
                        
                        {/* Image Switcher Fix */}
                        <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={achImgSource === 'upload'} onChange={() => setAchImgSource('upload')} /> 
                              Upload Image
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" checked={achImgSource === 'url'} onChange={() => setAchImgSource('url')} /> 
                              Image URL
                            </label>
                        </div>

                        {achImgSource === 'upload' ? (
                            <div className="flex items-center gap-3">
                                <div onClick={() => achFileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg cursor-pointer hover:bg-muted text-sm text-muted-foreground w-full">
                                    <Upload className="w-4 h-4" /> {achImageUrl ? "Image Ready" : "Upload Certificate / Photo"}
                                </div>
                                <input ref={achFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleNestedUpload(e.target.files[0], 'achievement')} />
                                {isUploadingAch && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                            </div>
                        ) : (
                            <input type="text" placeholder="Paste Image URL" value={achImageUrl} onChange={e => setAchImageUrl(e.target.value)} className="bg-card border border-border px-3 py-2 rounded-lg text-sm outline-none" />
                        )}

                        <input type="text" placeholder="Article Link (Optional)" value={achLink} onChange={e => setAchLink(e.target.value)} className="bg-card border border-border px-3 py-2 rounded-lg text-sm outline-none" />
                        <textarea placeholder="Description" value={achDesc} onChange={e => setAchDesc(e.target.value)} className="bg-card border border-border px-3 py-2 rounded-lg text-sm outline-none resize-none" rows={2} />
                        
                        <button onClick={addAchievement} disabled={isUploadingAch} className="bg-primary text-primary-foreground w-full py-2 rounded-lg text-sm font-bold hover:bg-primary disabled:opacity-50">Add Achievement</button>
                    </div>

                    <div className="space-y-2">
                        {formData.achievements?.map((a: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-xs">
                                <div className="flex gap-3">
                                    {a.image_url && <img src={a.image_url} className="w-12 h-12 object-cover rounded-md bg-muted" />}
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{a.title} <span className="text-muted-foreground font-normal text-xs">• {a.date}</span></p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{a.description}</p>
                                        {a.link && <a href={a.link} target="_blank" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1"><LinkIcon className="w-3 h-3"/> Read More</a>}
                                    </div>
                                </div>
                                <button onClick={(e) => removeAchievement(e, i)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Admin Details */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-emerald-600" /> Administrative Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <InputField label="Registration No." icon={<Hash className="w-4 h-4" />} value={formData.registration_number} onChange={(v: string) => setFormData({ ...formData, registration_number: v })} />
                      <InputField label="Years Active" type="number" icon={<CalendarDays className="w-4 h-4" />} value={formData.years_active} onChange={(v: string) => setFormData({ ...formData, years_active: v })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <InputField label="Representative Name" icon={<UserCheck className="w-4 h-4" />} value={formData.representative_name} onChange={(v: string) => setFormData({ ...formData, representative_name: v })} />
                      <InputField label="Designation" value={formData.designation} onChange={(v: string) => setFormData({ ...formData, designation: v })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <div>
                        <InputField label="UPI ID (for payouts)" icon={<IndianRupee className="w-4 h-4" />} placeholder="name@bank" value={formData.upi_id} onChange={(v: string) => setFormData({ ...formData, upi_id: v })} />
                        <p className="text-xs text-muted-foreground mt-1.5">Used to manually pay out your share of paid-event ticket sales.</p>
                      </div>
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

// Subcomponents

function InputField({ label, value, onChange, icon, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
        {icon} {label}
      </label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-muted-foreground" />
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
        <FileText className="w-3 h-3" /> {label}
      </label>
      <textarea rows={4} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:ring-2 focus:ring-black/5 transition-all outline-none resize-none placeholder:text-muted-foreground" />
    </div>
  )
}

function SelectField({ label, value, onChange, icon, options }: any) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
        {icon} {label}
      </label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:bg-card focus:ring-2 focus:ring-black/5 transition-all outline-none">
        <option value="">Select...</option>
        {options.map((opt: { value: string; label: string }) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// LinkedIn-style typeahead: search the fixed interest vocabulary and click a
// suggestion to add it, instead of a free-text box — interest_tags backs real
// feed-personalization matching, so it can't hold arbitrary user-typed text.
function InterestTagPicker({ selected, onAdd, onRemove }: { selected: string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void }) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const atMinimum = selected.length <= 3

  const availableOptions = INTEREST_TAG_OPTIONS.filter((opt) => !selected.includes(opt.tag))
  const suggestions = open
    ? (query.trim()
        ? availableOptions.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
        : availableOptions
      ).slice(0, 8)
    : []

  return (
    <div>
      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Interests</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search interests to add..."
          className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:bg-card focus:ring-2 focus:ring-black/5"
        />
        {open && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-lg">
            {suggestions.map((opt) => (
              <button
                key={opt.tag}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onAdd(opt.tag); setQuery("") }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{selected.length} selected (minimum 3)</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {selected.map((tag) => {
          const match = INTEREST_TAG_OPTIONS.find((opt) => opt.tag === tag)
          return (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-card text-foreground rounded-full text-xs font-medium border border-border shadow-sm">
              {match?.label || tag}
              <button
                type="button"
                onClick={() => !atMinimum && onRemove(tag)}
                disabled={atMinimum}
                title={atMinimum ? "At least 3 interests required" : undefined}
                className={`p-0.5 rounded-full transition-colors ${atMinimum ? "opacity-30 cursor-not-allowed" : "hover:bg-muted"}`}
              >
                <X className="w-3 h-3 text-muted-foreground hover:text-red-500 transition-colors" />
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function TagInput({ label, items, newItem, setNewItem, onAdd, onRemove, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">{label}</label>
      <div className="flex gap-2 mb-3">
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd(e)} placeholder={placeholder} className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm outline-none focus:bg-card focus:ring-2 focus:ring-black/5" />
        <button onClick={onAdd} className="bg-primary text-primary-foreground px-4 rounded-xl hover:bg-primary transition-colors"><Plus className="w-5 h-5" /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items?.map((item: string, idx: number) => (
          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-card text-foreground rounded-full text-xs font-medium border border-border shadow-sm">{item}<button onClick={(e) => { e.preventDefault(); onRemove(item); }} className="p-0.5 hover:bg-muted rounded-full"><X className="w-3 h-3 text-muted-foreground hover:text-red-500 transition-colors" /></button></span>
        ))}
      </div>
    </div>
  )
}