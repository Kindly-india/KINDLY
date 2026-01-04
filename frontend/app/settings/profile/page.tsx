"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Camera,
  Loader2,
  X,
  Plus,
  MapPin,
  User,
  Briefcase,
  FileText,
  Globe,
  Building2,
  Phone,
  Mail,
  Hash,
  CalendarDays,
  BadgeCheck
} from "lucide-react"
import { api } from "@/lib/api"

export default function EditProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userType, setUserType] = useState<'volunteer' | 'organization' | null>(null)

  // Form states
  const [formData, setFormData] = useState<any>({})

  // Tag Inputs State
  const [newSkill, setNewSkill] = useState("")
  const [newInterest, setNewInterest] = useState("")

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
            phone: p.phone || '',
            skills: p.skills || [],
            interests: p.interests || [], // Added from Schema
            availability_status: p.availability_status || '',
            avatar_url: p.avatar_url || '',
            cover_url: p.cover_url || ''
          })
        } else if (profileData.userType === 'organization') {
          setFormData({
            name: p.name || '',
            org_type: p.org_type || 'registered', // Read-only usually
            email: p.email || '', // Added from Schema
            phone: p.phone || '',
            tagline: p.tagline || '',
            mission_statement: p.mission_statement || '',
            intent_description: p.intent_description || '', // Added from Schema
            area_locality: p.area_locality || '',
            website: p.website || '',
            years_active: p.years_active || '', // Added from Schema
            registration_number: p.registration_number || '', // Added from Schema
            representative_name: p.representative_name || '', // Added from Schema
            designation: p.designation || '', // Added from Schema
            parent_institution: p.parent_institution || '', // Added from Schema (for clubs)
            coordinator_name: p.coordinator_name || '', // Added from Schema (for informal)
            logo_url: p.logo_url || '',
            cover_url: p.cover_url || ''
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

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    try {
      if (type === 'avatar') setUploadingAvatar(true)
      else setUploadingCover(true)

      const url = await api.uploadProfileImage(file, type)

      setFormData((prev: any) => ({
        ...prev,
        [type === 'avatar' ? (userType === 'volunteer' ? 'avatar_url' : 'logo_url') : 'cover_url']: url
      }))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploadingAvatar(false)
      setUploadingCover(false)
    }
  }

  // Generic Handler for Arrays (Skills/Interests)
  const handleAddItem = (field: 'skills' | 'interests', value: string, setValue: (s: string) => void) => {
    if (value.trim() && !formData[field]?.includes(value.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }))
      setValue("")
    }
  }

  const handleRemoveItem = (field: 'skills' | 'interests', itemToRemove: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field]?.filter((item: string) => item !== itemToRemove) || []
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      if (userType === 'volunteer') {
        // ✅ Volunteer Payload
        const volunteerPayload = {
          full_name: formData.full_name,
          headline: formData.headline,
          bio: formData.bio,
          city: formData.city,
          phone: formData.phone,
          skills: formData.skills || [],
          interests: formData.interests || [],
          availability_status: formData.availability_status,
          avatar_url: formData.avatar_url,
          cover_url: formData.cover_url
        }

        // Remove undefined/empty fields
        Object.keys(volunteerPayload).forEach(key => {
          // Cast to 'any' to allow dynamic access by string key
          const k = key as keyof typeof volunteerPayload;
          if (volunteerPayload[k] === undefined || volunteerPayload[k] === '') {
            delete volunteerPayload[k]
          }
        })

        console.log('🔍 Sending volunteer payload:', volunteerPayload)
        await api.updateVolunteerProfile(volunteerPayload)

      } else if (userType === 'organization') {
        // ✅ Organization Payload
        const orgPayload = {
          name: formData.name,
          tagline: formData.tagline,
          mission_statement: formData.mission_statement,
          intent_description: formData.intent_description,
          area_locality: formData.area_locality,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          logo_url: formData.logo_url,
          cover_url: formData.cover_url,
          registration_number: formData.registration_number,
          representative_name: formData.representative_name,
          designation: formData.designation,
          parent_institution: formData.parent_institution,
          coordinator_name: formData.coordinator_name,
          years_active: formData.years_active ? parseInt(formData.years_active) : undefined
        }

        // Remove undefined/empty fields
        Object.keys(orgPayload).forEach(key => {
          // Cast to 'any' to allow dynamic access by string key
          const k = key as keyof typeof orgPayload;
          if (orgPayload[k] === undefined || orgPayload[k] === '') {
            delete orgPayload[k]
          }
        })

        console.log('🔍 Sending organization payload:', orgPayload)
        await api.updateOrgProfile(orgPayload)
      }

      router.back()
    } catch (err: any) {
      console.error('❌ Update error:', err)
      alert(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    )
  }

  const currentAvatarUrl = userType === 'volunteer' ? formData.avatar_url : formData.logo_url
  const currentName = userType === 'volunteer' ? formData.full_name : formData.name

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-20">
      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Cancel</span>
          </button>
          <h1 className="text-base font-semibold text-gray-900">Edit Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-5 py-1.5 rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">

        {/* VISUAL EDITOR SECTION */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-6">

          {/* Cover Image Editor */}
          <div className="relative h-48 bg-linear-to-r from-blue-50 to-slate-100 group">
            {formData.cover_url ? (
              <img src={formData.cover_url} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px]" />
            )}

            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer"
              onClick={() => coverInputRef.current?.click()}>
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <span className="text-xs font-bold text-gray-700">Change Cover</span>
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')} />
          </div>

          {/* Avatar/Details Editor Section */}
          <div className="px-6 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 mb-6 gap-6 relative z-10">

              {/* Avatar Editor */}
              <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative">
                  {currentAvatarUrl ? (
                    <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-300">
                      {currentName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')} />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Full Name"
                      icon={<User className="w-4 h-4" />}
                      value={formData.full_name}
                      onChange={(v: any) => setFormData({ ...formData, full_name: v })}
                    />
                    <InputField
                      label="Headline"
                      icon={<Briefcase className="w-4 h-4" />}
                      value={formData.headline}
                      onChange={(v: any) => setFormData({ ...formData, headline: v })}
                      placeholder="e.g. Student at XYZ University"
                    />
                  </div>

                  <TextAreaField
                    label="Bio"
                    value={formData.bio}
                    onChange={(v: any) => setFormData({ ...formData, bio: v })}
                    placeholder="Tell organizations a bit about yourself..."
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="City / Location"
                      icon={<MapPin className="w-4 h-4" />}
                      value={formData.city}
                      onChange={(v: any) => setFormData({ ...formData, city: v })}
                    />
                    <InputField
                      label="Phone Number"
                      icon={<Phone className="w-4 h-4" />}
                      value={formData.phone}
                      onChange={(v: any) => setFormData({ ...formData, phone: v })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Availability Status</label>
                    <select
                      value={formData.availability_status}
                      onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    >
                      <option value="">Select Availability...</option>
                      <option value="weekends">Weekends Only</option>
                      <option value="weekdays">Weekdays Only</option>
                      <option value="remote">Remote Only</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  {/* Skills Array */}
                  <TagInput
                    label="Skills"
                    items={formData.skills}
                    newItem={newSkill}
                    setNewItem={setNewSkill}
                    onAdd={() => handleAddItem('skills', newSkill, setNewSkill)}
                    onRemove={(item: string) => handleRemoveItem('skills', item)}
                    placeholder="Add a skill (e.g. Teaching)"
                  />

                  {/* Interests Array */}
                  <TagInput
                    label="Causes & Interests"
                    items={formData.interests}
                    newItem={newInterest}
                    setNewItem={setNewInterest}
                    onAdd={() => handleAddItem('interests', newInterest, setNewInterest)}
                    onRemove={(item: string) => handleRemoveItem('interests', item)}
                    placeholder="Add an interest (e.g. Environment)"
                  />
                </>
              )}

              {/* === ORGANIZATION FORM === */}
              {userType === 'organization' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Organization Name"
                      icon={<Building2 className="w-4 h-4" />}
                      value={formData.name}
                      onChange={(v: any) => setFormData({ ...formData, name: v })}
                    />
                    <InputField
                      label="Tagline"
                      value={formData.tagline}
                      onChange={(v: any) => setFormData({ ...formData, tagline: v })}
                      placeholder="Short slogan"
                    />
                  </div>

                  <TextAreaField
                    label="Mission Statement"
                    value={formData.mission_statement}
                    onChange={(v: any) => setFormData({ ...formData, mission_statement: v })}
                  />

                  <TextAreaField
                    label="Intent / Description (Internal)"
                    value={formData.intent_description}
                    onChange={(v: any) => setFormData({ ...formData, intent_description: v })}
                    placeholder="Detailed description of your intent..."
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Location / Area"
                      icon={<MapPin className="w-4 h-4" />}
                      value={formData.area_locality}
                      onChange={(v: any) => setFormData({ ...formData, area_locality: v })}
                    />
                    <InputField
                      label="Website"
                      icon={<Globe className="w-4 h-4" />}
                      value={formData.website}
                      onChange={(v: any) => setFormData({ ...formData, website: v })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Email (Public)"
                      icon={<Mail className="w-4 h-4" />}
                      value={formData.email}
                      onChange={(v: any) => setFormData({ ...formData, email: v })}
                    />
                    <InputField
                      label="Phone (Public)"
                      icon={<Phone className="w-4 h-4" />}
                      value={formData.phone}
                      onChange={(v: any) => setFormData({ ...formData, phone: v })}
                    />
                  </div>

                  {/* Legal / Admin Details */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-blue-600" /> Administrative Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <InputField
                        label="Registration Number"
                        icon={<Hash className="w-4 h-4" />}
                        value={formData.registration_number}
                        onChange={(v: any) => setFormData({ ...formData, registration_number: v })}
                      />
                      <InputField
                        label="Years Active"
                        type="number"
                        icon={<CalendarDays className="w-4 h-4" />}
                        value={formData.years_active}
                        onChange={(v: any) => setFormData({ ...formData, years_active: v })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <InputField
                        label="Representative Name"
                        value={formData.representative_name}
                        onChange={(v: any) => setFormData({ ...formData, representative_name: v })}
                      />
                      <InputField
                        label="Designation"
                        value={formData.designation}
                        onChange={(v: any) => setFormData({ ...formData, designation: v })}
                      />
                    </div>

                    {/* Conditional fields based on Org Type */}
                    {formData.org_type === 'supported' && (
                      <InputField
                        label="Parent Institution"
                        value={formData.parent_institution}
                        onChange={(v: any) => setFormData({ ...formData, parent_institution: v })}
                        placeholder="e.g. University Name"
                      />
                    )}
                    {formData.org_type === 'informal' && (
                      <InputField
                        label="Coordinator Name"
                        value={formData.coordinator_name}
                        onChange={(v: any) => setFormData({ ...formData, coordinator_name: v })}
                      />
                    )}
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

// --- UI Components ---

function InputField({ label, value, onChange, icon, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 items-center gap-1.5">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none placeholder:text-gray-400"
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
        <FileText className="w-3 h-3 inline mr-1" /> {label}
      </label>
      <textarea
        rows={4}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none resize-none placeholder:text-gray-400"
      />
    </div>
  )
}

function TagInput({ label, items, newItem, setNewItem, onAdd, onRemove, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/5"
        />
        <button onClick={onAdd} className="bg-black text-white px-4 rounded-xl hover:bg-gray-800 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items?.map((item: string, idx: number) => (
          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-white text-gray-700 rounded-full text-xs font-medium border border-gray-200 shadow-sm">
            {item}
            <button onClick={() => onRemove(item)} className="p-0.5 hover:bg-gray-100 rounded-full">
              <X className="w-3 h-3 text-gray-400 hover:text-red-500 transition-colors" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}