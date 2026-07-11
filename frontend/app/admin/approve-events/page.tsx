"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink, 
  Search, 
  Coffee, 
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  Calendar,
  ImageIcon,
  Upload,
  X,
  Type,
  Tag,
  Briefcase,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Menu
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const categories = [
    { id: "nature_outdoors", name: "Outdoors & Nature", icon: "🌿" },
    { id: "food_hunger", name: "Food & Hunger Relief", icon: "🍱" },
    { id: "animal_welfare", name: "Animals & Rescue", icon: "🐾" },
    { id: "elderly_care", name: "Elderly Care", icon: "🤝" },
    { id: "education_mentoring", name: "Kids & Learning", icon: "📚" },
    { id: "health_medical", name: "Health & Medical", icon: "❤️" },
    { id: "art_culture", name: "Art, Culture & Heritage", icon: "🎨" },
    { id: "civic_community", name: "Community & Civic", icon: "🏘️" },
    { id: "women_empowerment", name: "Women & Safety", icon: "💪" },
    { id: "youth_sports", name: "Youth & Sports", icon: "⚽" },
    { id: "mental_wellness", name: "Mental Health & Wellness", icon: "🧠" },
    { id: "donation_drives", name: "Donations & Drives", icon: "🎁" },
]

export default function AdminApprovalPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [showSidebar, setShowSidebar] = useState(false) // Mobile sidebar toggle

  const fetchPending = async () => {
    try {
      setLoading(true)
      const res = await api.getPendingEvents()
      const pendingEvents = res.events || []
      setEvents(pendingEvents)
      if (pendingEvents.length > 0) {
        handleSelectEvent(pendingEvents[0])
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        router.push('/')
        return
      }
      console.error("Failed to fetch pending events", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleSelectEvent = (event: any) => {
    // Formatting ISO date for datetime-local input
    let formattedDeadline = ""
    if (event.registration_deadline) {
        const d = new Date(event.registration_deadline)
        formattedDeadline = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    }

    setSelectedEvent({
        ...event,
        registration_deadline: formattedDeadline
    })
    setNewImageFile(null)
    setImagePreview(event.cover_image_url || "")
    setShowSidebar(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setSelectedEvent((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleApprove = async () => {
    if (!selectedEvent) return
    try {
      setApproving(true)

      let finalImageUrl = selectedEvent.cover_image_url
      
      if (newImageFile) {
        finalImageUrl = await api.uploadEventImage(newImageFile)
      }

      await api.adminApproveEvent(selectedEvent.id, {
        title: selectedEvent.title,
        description: selectedEvent.description,
        category: selectedEvent.category,
        coverImageUrl: finalImageUrl,
        eventDate: selectedEvent.event_date,
        startTime: selectedEvent.start_time,
        endTime: selectedEvent.end_time,
        location: selectedEvent.location,
        pointOfContact: selectedEvent.point_of_contact,
        connectPlan: selectedEvent.connect_plan,
        totalSlots: parseInt(selectedEvent.total_slots),
        registrationDeadline: new Date(selectedEvent.registration_deadline).toISOString(),
        dressCode: selectedEvent.dress_code,
        thingsToBring: selectedEvent.things_to_bring,
        minimumAge: selectedEvent.minimum_age ? parseInt(selectedEvent.minimum_age) : undefined,
        isUrgent: selectedEvent.is_urgent
      })
      
      toast.success("Event Polished & Published!")
      const remaining = events.filter(e => e.id !== selectedEvent.id)
      setEvents(remaining)
      if (remaining.length > 0) handleSelectEvent(remaining[0])
      else setSelectedEvent(null)

    } catch (err) {
      console.error(err)
      toast.error("Approval failed. Check console.")
    } finally {
      setApproving(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-card">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-muted overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="lg:hidden bg-card p-4 border-b flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-foreground">Concierge Desk</span>
        </div>
        <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 bg-muted rounded-xl">
            {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* LEFT SIDEBAR: PENDING LIST */}
      <aside className={cn(
        "w-full lg:w-80 border-r border-border bg-card flex flex-col transition-all duration-300 z-40",
        "fixed inset-0 lg:relative lg:translate-x-0",
        showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-border hidden lg:block">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h1 className="text-lg font-bold text-foreground">Concierge</h1>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            {events.length} Awaiting Polish
          </p>
          <Link
            href="/admin/approve-orgs"
            className="inline-block mt-3 text-[12px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Organization approvals →
          </Link>
          <Link
            href="/admin/payments"
            className="inline-block mt-2 text-[12px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Paid events →
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border pt-20 lg:pt-0">
          {events.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm italic">All caught up!</div>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className={cn(
                  "w-full text-left p-5 transition-all hover:bg-muted",
                  selectedEvent?.id === event.id ? "bg-emerald-50 dark:bg-emerald-500/15/50 border-l-4 border-emerald-500 shadow-inner" : "border-l-4 border-transparent"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter truncate">
                        {event.organization_profiles?.name}
                    </span>
                </div>
                <h3 className="font-bold text-foreground text-sm line-clamp-1">{event.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">{event.event_date}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* RIGHT MAIN: FULL EDITOR */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-10 bg-muted">
        {selectedEvent ? (
          <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-20">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-foreground">Polish Submission</h2>
                <p className="text-xs lg:text-sm text-muted-foreground">Upgrade this event to KINDLY's club standard.</p>
              </div>
              <button 
                onClick={handleApprove}
                disabled={approving}
                className="w-full md:w-auto px-8 py-4 lg:py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approve & Go Live
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {/* Visuals Sidebar */}
                  <div className="md:col-span-1 space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 block mb-2">Cover Image</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative aspect-[16/10] md:aspect-[4/5] bg-muted rounded-3xl overflow-hidden border-2 border-dashed border-border hover:border-emerald-500 transition-all cursor-pointer shadow-sm"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload className="text-white w-8 h-8" />
                            </div>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <div className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Category</label>
                            <select 
                                className="w-full p-3 bg-muted rounded-xl border-0 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                                value={selectedEvent.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-500/15 rounded-2xl border border-amber-100">
                            <span className="text-[11px] font-bold text-amber-700 uppercase">Urgent Tag</span>
                            <input 
                                type="checkbox"
                                checked={selectedEvent.is_urgent}
                                onChange={(e) => handleInputChange('is_urgent', e.target.checked)}
                                className="w-5 h-5 rounded-lg border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                  </div>

                  {/* Main Copy Area */}
                  <div className="md:col-span-2 space-y-6">
                      <div className="bg-card p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-border shadow-sm space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Event Title</label>
                            <input 
                                className="w-full p-3 lg:p-4 bg-muted rounded-2xl border-0 font-black text-lg lg:text-xl text-foreground focus:ring-2 focus:ring-emerald-500"
                                value={selectedEvent.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">The Cause (Description)</label>
                            <textarea 
                                rows={6}
                                className="w-full p-3 lg:p-4 bg-muted rounded-2xl border-0 text-foreground focus:ring-2 focus:ring-emerald-500 text-sm lg:text-base leading-relaxed"
                                value={selectedEvent.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            />
                        </div>
                      </div>
                  </div>
              </div>

              {/* THE AFTER BOX */}
              <div className="bg-[#064e3b] p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-emerald-800 shadow-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-black text-lg">The After</h3>
                  </div>
                  <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-700/50">
                    <p className="text-emerald-300/80 text-[10px] font-bold uppercase tracking-wider mb-1">Org's Proposed After Activity:</p>
                    <p className="text-emerald-100 text-xs italic">"{selectedEvent.connect_plan || "No suggestion provided"}"</p>
                  </div>
                  <textarea
                    placeholder="Describe the curated after-activity... e.g. ☕ Post-event Coffee at Roastery!"
                    rows={3}
                    className="w-full p-4 lg:p-5 bg-emerald-900/50 rounded-2xl border border-emerald-700 text-white placeholder:text-emerald-700 focus:ring-2 focus:ring-emerald-400 text-sm font-medium"
                    value={selectedEvent.connect_plan}
                    onChange={(e) => handleInputChange('connect_plan', e.target.value)}
                  />
              </div>

              {/* Logistics & Contact Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Time & Capacity */}
                    <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm space-y-4">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Schedule & Capacity</label>
                        
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Event Date</span>
                            <input type="date" className="w-full p-3 bg-muted rounded-xl border-0 text-xs font-bold" value={selectedEvent.event_date} onChange={(e) => handleInputChange('event_date', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Start</span>
                                <input type="time" className="w-full p-3 bg-muted rounded-xl border-0 text-xs font-bold" value={selectedEvent.start_time} onChange={(e) => handleInputChange('start_time', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">End</span>
                                <input type="time" className="w-full p-3 bg-muted rounded-xl border-0 text-xs font-bold" value={selectedEvent.end_time} onChange={(e) => handleInputChange('end_time', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Total Slots</span>
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                    <input type="number" className="bg-transparent border-0 w-full font-bold text-xs" value={selectedEvent.total_slots} onChange={(e) => handleInputChange('total_slots', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Min Age</span>
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                                    <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                    <input type="number" className="bg-transparent border-0 w-full font-bold text-xs" value={selectedEvent.minimum_age || ""} onChange={(e) => handleInputChange('minimum_age', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Deadline */}
                    <div className="bg-card p-6 rounded-[32px] border border-border shadow-sm space-y-4">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Communication & Deadlines</label>
                        
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Registration Deadline</span>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="datetime-local"
                                    className="w-full p-3 pl-10 bg-muted rounded-xl border-0 text-xs font-bold focus:ring-2 focus:ring-emerald-500" 
                                    value={selectedEvent.registration_deadline} 
                                    onChange={(e) => handleInputChange('registration_deadline', e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Point of Contact (Admin Override)</span>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    className="w-full p-3 pl-10 bg-muted rounded-xl border-0 text-xs font-bold focus:ring-2 focus:ring-emerald-500" 
                                    value={selectedEvent.point_of_contact || ""} 
                                    onChange={(e) => handleInputChange('point_of_contact', e.target.value)} 
                                    placeholder="Name & Number"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Exact Venue Location</span>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <input 
                                    className="w-full p-3 pl-10 bg-muted rounded-xl border-0 text-xs font-bold focus:ring-2 focus:ring-emerald-500" 
                                    value={selectedEvent.location || ""} 
                                    onChange={(e) => handleInputChange('location', e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Clothing & Items */}
                    <div className="col-span-1 md:col-span-2 bg-card p-6 rounded-[32px] border border-border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Dress Code</span>
                            <input className="w-full p-3 bg-muted rounded-xl border-0 text-xs font-bold" value={selectedEvent.dress_code || ""} onChange={(e) => handleInputChange('dress_code', e.target.value)} placeholder="e.g. White T-shirt" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground ml-1 uppercase">Things to Bring</span>
                            <input className="w-full p-3 bg-muted rounded-xl border-0 text-xs font-bold" value={selectedEvent.things_to_bring || ""} onChange={(e) => handleInputChange('things_to_bring', e.target.value)} placeholder="e.g. Water bottle" />
                        </div>
                    </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-6 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-bold text-sm uppercase tracking-widest">Select an event to polish</p>
            <p className="text-xs text-muted-foreground mt-2">All submissions from Nashik organizations will appear here.</p>
          </div>
        )}
      </main>
    </div>
  )
}