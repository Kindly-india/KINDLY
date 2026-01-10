"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
    Search,
    X,
    MapPin,
    Users,
    SlidersHorizontal,
    Calendar,
    Leaf,
    GraduationCap,
    Heart,
    Dog,
    Sun,
    Sunset,
    Moon,
    TrendingUp,
    Filter,
    Sparkles,
    ChevronDown,
    Menu,
    Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

const causes = [
    { id: "environment", label: "Environment", icon: Leaf, color: "text-emerald-500" },
    { id: "education", label: "Education", icon: GraduationCap, color: "text-amber-500" },
    { id: "animals", label: "Animals", icon: Dog, color: "text-purple-500" },
    { id: "health", label: "Health", icon: Heart, color: "text-red-500" },
    { id: "elderly", label: "Elderly Care", icon: Users, color: "text-pink-500" },
    { id: "community", label: "Community", icon: Sparkles, color: "text-cyan-500" },
]

const timeOfDay = [
    { id: "morning", label: "Morning", icon: Sun, time: "6 AM - 12 PM" },
    { id: "afternoon", label: "Afternoon", icon: Sunset, time: "12 PM - 5 PM" },
    { id: "evening", label: "Evening", icon: Moon, time: "5 PM - 9 PM" },
]

const datePills = [
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "weekend", label: "Weekend" },
    { id: "week", label: "This Week" },
]

const durationOptions = [
    { id: "1-2", label: "1-2 hrs" },
    { id: "2-4", label: "2-4 hrs" },
    { id: "4-8", label: "4-8 hrs" },
    { id: "full-day", label: "Full Day" },
]

export function EventsDiscoveryPage() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [menuOpen, setMenuOpen] = useState(false)
    
    // Profile State
    const [profile, setProfile] = useState<any>(null)

    // Filters
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedCauses, setSelectedCauses] = useState<string[]>([])
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [selectedDuration, setSelectedDuration] = useState<string | null>(null)
    const [locationFilter, setLocationFilter] = useState("") 
    const [showFilledEvents, setShowFilledEvents] = useState(true)

    const [sortBy, setSortBy] = useState("newest")
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [visibleEvents, setVisibleEvents] = useState(6)

    // Fetch events & Profile
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [eventsRes, profileRes] = await Promise.all([
                    api.getPublicEvents(),
                    api.getUserProfile().catch(() => null)
                ])
                
                setEvents(eventsRes.events || [])
                if (profileRes?.profile) {
                    setProfile(profileRes.profile)
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load data')
                console.error('Error fetching data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const toggleCause = (causeId: string) => {
        setSelectedCauses((prev) => (prev.includes(causeId) ? prev.filter((c) => c !== causeId) : [...prev, causeId]))
    }

    const clearAllFilters = () => {
        setSelectedDate(null)
        setSelectedCauses([])
        setSelectedTime(null)
        setSelectedDuration(null)
        setLocationFilter("")
        setShowFilledEvents(true)
        setSearchQuery("")
    }

    const hasActiveFilters =
        selectedDate || selectedCauses.length > 0 || selectedTime || selectedDuration || locationFilter

    const loadMore = () => {
        setVisibleEvents((prev) => Math.min(prev + 6, filteredEvents.length))
    }

    const isRegistrationOpen = (deadline: string) => {
        return new Date(deadline) > new Date();
    };

    // Display Logic for Profile
    const displayImage = profile?.avatar_url || profile?.logo_url
    const displayName = profile?.full_name || profile?.name || "User"
    const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : "U"

    const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className={cn("space-y-4", isMobile ? "space-y-3" : "space-y-5")}>
            {/* Date Section */}
            <div>
                <h3 className={cn("font-semibold text-[#1d1d1f] uppercase tracking-wide", isMobile ? "text-[10px] mb-2" : "text-[12px] mb-3")}>
                    Date
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {datePills.map((pill) => (
                        <button
                            key={pill.id}
                            onClick={() => setSelectedDate(selectedDate === pill.id ? null : pill.id)}
                            className={cn(
                                "rounded-full font-medium transition-all",
                                isMobile ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]",
                                selectedDate === pill.id
                                    ? "bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white shadow-md"
                                    : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]",
                            )}
                        >
                            {pill.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Causes Section */}
            <div>
                <h3 className={cn("font-semibold text-[#1d1d1f] uppercase tracking-wide", isMobile ? "text-[10px] mb-2" : "text-[12px] mb-3")}>
                    Causes
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                    {causes.map((cause) => (
                        <label
                            key={cause.id}
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg cursor-pointer transition-all border",
                                isMobile ? "p-2" : "p-2.5",
                                selectedCauses.includes(cause.id)
                                    ? "bg-gradient-to-br from-white to-[#f5f5f7] border-[#1d1d1f] shadow-sm"
                                    : "bg-white border-[#e8e8ed] hover:border-[#d1d1d6]",
                            )}
                        >
                            <Checkbox
                                checked={selectedCauses.includes(cause.id)}
                                onCheckedChange={() => toggleCause(cause.id)}
                                className={cn(
                                    "rounded border-[#d1d1d6] data-[state=checked]:bg-[#1d1d1f] data-[state=checked]:border-[#1d1d1f]",
                                    isMobile ? "w-3 h-3" : "w-4 h-4",
                                )}
                            />
                            <cause.icon className={cn(cause.color, isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />
                            <span className={cn("font-medium text-[#1d1d1f]", isMobile ? "text-[9px]" : "text-[11px]")}>
                                {cause.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Duration */}
            <div>
                <h3 className={cn("font-semibold text-[#1d1d1f] uppercase tracking-wide", isMobile ? "text-[10px] mb-2" : "text-[12px] mb-3")}>
                    Duration
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                    {durationOptions.map((duration) => (
                        <button
                            key={duration.id}
                            onClick={() => setSelectedDuration(selectedDuration === duration.id ? null : duration.id)}
                            className={cn(
                                "rounded-lg font-medium transition-all border",
                                isMobile ? "px-2 py-1.5 text-[9px]" : "px-3 py-2 text-[11px]",
                                selectedDuration === duration.id
                                    ? "bg-gradient-to-br from-[#d4f4dd] to-[#b8f2c5] border-emerald-300 text-emerald-800"
                                    : "bg-white border-[#e8e8ed] text-[#1d1d1f] hover:border-[#d1d1d6]",
                            )}
                        >
                            {duration.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time of Day Section */}
            <div>
                <h3 className={cn("font-semibold text-[#1d1d1f] uppercase tracking-wide", isMobile ? "text-[10px] mb-2" : "text-[12px] mb-3")}>
                    Time of Day
                </h3>
                <div className="space-y-1.5">
                    {timeOfDay.map((time) => (
                        <button
                            key={time.id}
                            onClick={() => setSelectedTime(selectedTime === time.id ? null : time.id)}
                            className={cn(
                                "w-full flex items-center gap-2 rounded-lg text-left transition-all border",
                                isMobile ? "p-2" : "p-2.5",
                                selectedTime === time.id
                                    ? "bg-gradient-to-br from-[#fef3c7] to-[#fde68a] border-amber-300"
                                    : "bg-white border-[#e8e8ed] hover:border-[#d1d1d6]",
                            )}
                        >
                            <time.icon className={cn(selectedTime === time.id ? "text-amber-600" : "text-[#86868b]", isMobile ? "w-3 h-3" : "w-4 h-4")} />
                            <div className="flex-1">
                                <div className={cn("font-medium", selectedTime === time.id ? "text-amber-900" : "text-[#1d1d1f]", isMobile ? "text-[10px]" : "text-[12px]")}>
                                    {time.label}
                                </div>
                                <div className={cn(selectedTime === time.id ? "text-amber-700" : "text-[#86868b]", isMobile ? "text-[8px]" : "text-[10px]")}>
                                    {time.time}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Location */}
            <div>
                <h3 className={cn("font-semibold text-[#1d1d1f] uppercase tracking-wide", isMobile ? "text-[10px] mb-2" : "text-[12px] mb-3")}>
                    Location
                </h3>
                <div className="relative">
                    <MapPin className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868b]", isMobile ? "w-3 h-3" : "w-4 h-4")} />
                    <input
                        type="text"
                        placeholder="Enter specific location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className={cn("w-full bg-white border border-[#e8e8ed] rounded-lg text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#06b6d4] transition-colors", isMobile ? "pl-7 pr-3 py-2 text-[10px]" : "pl-9 pr-4 py-2.5 text-[12px]")}
                    />
                </div>
            </div>

            {/* Show Filled Events */}
            <div className={cn("bg-[#f5f5f7] rounded-lg", isMobile ? "p-3" : "p-4")}>
                <label className="flex items-center justify-between cursor-pointer">
                    <div>
                        <div className={cn("font-medium text-[#1d1d1f]", isMobile ? "text-[10px]" : "text-[12px]")}>
                            Show Filled Events
                        </div>
                        <div className={cn("text-[#86868b]", isMobile ? "text-[8px]" : "text-[10px]")}>
                            Display events with no spots
                        </div>
                    </div>
                    <Checkbox
                        checked={showFilledEvents}
                        onCheckedChange={(checked) => setShowFilledEvents(checked as boolean)}
                        className={cn("rounded border-[#d1d1d6] data-[state=checked]:bg-[#1d1d1f] data-[state=checked]:border-[#1d1d1f]", isMobile ? "w-4 h-4" : "w-5 h-5")}
                    />
                </label>
            </div>
        </div>
    )

    // Helper functions
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            environment: "bg-[#10b981]",
            education: "bg-[#f59e0b]",
            health: "bg-[#ef4444]",
            animals: "bg-[#8b5cf6]",
            elderly: "bg-[#ec4899]",
            community: "bg-[#06b6d4]",
        }
        return colors[category] || "bg-gray-500"
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour} ${ampm}`
    }

    // Filter events
    const filteredEvents = events.filter(event => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const matchTitle = event.title?.toLowerCase().includes(query)
            const matchLocation = event.location?.toLowerCase().includes(query)
            const matchOrg = event.org_name?.toLowerCase().includes(query) 
            if (!matchTitle && !matchLocation && !matchOrg) return false
        }

        if (locationFilter && !event.location?.toLowerCase().includes(locationFilter.toLowerCase())) {
            return false
        }

        if (selectedCauses.length > 0 && !selectedCauses.includes(event.category)) {
            return false
        }

        if (selectedDate) {
            const eventDate = new Date(event.event_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(today.getDate() + 1)

            if (selectedDate === 'today') {
                if (eventDate.toDateString() !== today.toDateString()) return false
            } else if (selectedDate === 'tomorrow') {
                if (eventDate.toDateString() !== tomorrow.toDateString()) return false
            } else if (selectedDate === 'weekend') {
                const day = eventDate.getDay()
                if (day !== 0 && day !== 6) return false
            } else if (selectedDate === 'week') {
                const nextWeek = new Date(today)
                nextWeek.setDate(today.getDate() + 7)
                if (eventDate < today || eventDate > nextWeek) return false
            }
        }

        if (selectedTime) {
            if (!event.start_time) return false
            const hour = parseInt(event.start_time.split(':')[0])
            if (selectedTime === 'morning' && (hour < 6 || hour >= 12)) return false
            if (selectedTime === 'afternoon' && (hour < 12 || hour >= 17)) return false
            if (selectedTime === 'evening' && (hour < 17 || hour >= 21)) return false
        }

        if (selectedDuration) {
            if (!event.start_time || !event.end_time) return false
            const startHour = parseInt(event.start_time.split(':')[0]) + (parseInt(event.start_time.split(':')[1] || '0') / 60)
            const endHour = parseInt(event.end_time.split(':')[0]) + (parseInt(event.end_time.split(':')[1] || '0') / 60)
            const duration = endHour - startHour

            if (selectedDuration === '1-2' && (duration < 1 || duration > 2)) return false
            if (selectedDuration === '2-4' && (duration <= 2 || duration > 4)) return false
            if (selectedDuration === '4-8' && (duration <= 4 || duration > 8)) return false
            if (selectedDuration === 'full-day' && duration <= 8) return false
        }

        if (!showFilledEvents && event.registered_count >= event.total_slots) {
            return false
        }

        return true
    })

    const sortedEvents = [...filteredEvents].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        } else if (sortBy === 'oldest') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        } else if (sortBy === 'soon') {
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        } else if (sortBy === 'popular') {
            return b.registered_count - a.registered_count
        }
        return 0
    })

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* ✅ NEW CONSISTENT NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#f5f5f7]">
                <div className="max-w-350 mx-auto px-4 md:px-8 h-12 md:h-14 flex items-center justify-between relative">
                    
                    {/* 1. Left: Logo */}
                    <Link href="/home" className="flex items-center shrink-0">
                        <Image 
                            src="/logo.png" 
                            alt="Kindly" 
                            width={120} 
                            height={40} 
                            className="h-8 md:h-10 w-auto" 
                            priority 
                        />
                    </Link>

                    {/* 2. Center: Navigation Links */}
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Link href="/events" className="text-[13px] md:text-[15px] text-[#0066cc] font-semibold transition-colors">
                            Events
                        </Link>
                        <Link href="/history" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">
                            History
                        </Link>
                        <Link href="/social" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium">
                            Social
                        </Link>
                        <Link href="/volunteer-impact" className="text-[13px] md:text-[15px] text-[#1d1d1f] hover:text-[#0066cc] transition-colors font-medium flex items-center gap-1.5">
                            Impact
                        </Link>
                    </div>

                    {/* 3. Right: Profile & Mobile Menu */}
                    <div className="flex items-center gap-4 shrink-0">
                        <Link
                            href={profile?.id ? `/volunteers/${profile.id}` : '#'}
                            className="hidden md:block group"
                        >
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-gray-200 group-hover:border-gray-400 group-active:scale-95 transition-all bg-gray-50 flex items-center justify-center shadow-sm">
                                {displayImage ? (
                                    <img
                                        src={displayImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
                                        {displayInitial}
                                    </span>
                                )}
                            </div>
                        </Link>

                        <div className="relative md:hidden">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center hover:bg-[#e5e5e7] transition-colors"
                            >
                                {menuOpen ? <X className="w-5 h-5 text-[#1d1d1f]" /> : <Menu className="w-5 h-5 text-[#1d1d1f]" />}
                            </button>

                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-xl shadow-xl border border-[#e5e5e7] overflow-hidden">
                                        <Link
                                            href="/profile"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]"
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#f5f5f7] flex items-center justify-center bg-gray-50">
                                                {displayImage ? (
                                                    <img
                                                        src={displayImage}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-xs text-gray-500">{displayInitial}</span>
                                                )}
                                            </div>
                                            <span className="text-[13px] font-medium text-[#1d1d1f]">Profile</span>
                                        </Link>
                                        <Link
                                            href="/home"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7]"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fef3c7] to-[#fde68a] flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                                            </div>
                                            <span className="text-[13px] font-medium text-[#1d1d1f]">Home</span>
                                        </Link>
                                        <Link
                                            href="/history"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-[#2e7d32]" />
                                            </div>
                                            <span className="text-[13px] font-medium text-[#1d1d1f]">Event History</span>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Left Sidebar - Desktop Only */}
                <aside className="hidden lg:block w-70 shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto border-r border-[#f5f5f7] bg-gradient-to-b from-white to-[#fafafa]">
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-[#ff6b6b]" />
                                <h2 className="text-[14px] font-bold text-[#1d1d1f]">Filters</h2>
                            </div>
                            {hasActiveFilters && (
                                <button onClick={clearAllFilters} className="text-[11px] text-[#ff6b6b] hover:underline font-medium">
                                    Clear All
                                </button>
                            )}
                        </div>
                        <FilterContent />
                    </div>
                </aside>

                {/* Right Content Area */}
                <main className="flex-1 bg-gradient-to-br from-[#fafafa] via-white to-[#f5f5f7] min-h-[calc(100vh-64px)]">
                    
                    {/* ✅ MOVED SEARCH BAR HERE */}
                    <div className="px-3 md:px-6 pt-4 pb-2 bg-white/50 backdrop-blur-sm">
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by event name, location, or organization..."
                                className="w-full pl-11 pr-10 py-3 bg-white border border-[#e8e8ed] rounded-full text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/20 focus:border-[#ff6b6b]/30 transition-all shadow-sm"
                            />
                            {searchQuery ? (
                                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <X className="w-4 h-4 text-[#86868b] hover:text-[#1d1d1f]" />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="sticky top-12 md:top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-[#e8e8ed] shadow-sm">
                        <div className="px-3 md:px-6 py-2 md:py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                {/* Left - Results & Filters */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Mobile Filter Button */}
                                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                        <SheetTrigger asChild>
                                            <button className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#1d1d1f] text-white rounded-full shadow-sm hover:shadow-md transition-all">
                                                <SlidersHorizontal className="w-3 h-3" />
                                                <span className="text-[10px] font-semibold">Filters</span>
                                                {hasActiveFilters && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                            </button>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl bg-white px-5">
                                            <SheetHeader className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <SheetTitle className="text-[16px] font-bold">Filters</SheetTitle>
                                                    {hasActiveFilters && (
                                                        <button onClick={clearAllFilters} className="text-[11px] text-[#ff6b6b] font-medium">
                                                            Clear All
                                                        </button>
                                                    )}
                                                </div>
                                            </SheetHeader>
                                            <div className="overflow-y-auto h-[calc(100%-90px)] pb-16 px-1">
                                                <FilterContent isMobile={true} />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-3 px-5 bg-white border-t border-[#f5f5f7]">
                                                <Button
                                                    onClick={() => setIsFilterOpen(false)}
                                                    className="w-full bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] hover:from-[#ff5252] hover:to-[#ff7a3a] text-white rounded-full py-5 text-[12px] font-semibold shadow-lg"
                                                >
                                                    Show {filteredEvents.length} Events
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>

                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-[#10b981]" />
                                        <p className="text-[10px] md:text-[13px] text-[#1d1d1f]">
                                            <span className="font-bold text-[#ff6b6b]">{filteredEvents.length}</span> events
                                        </p>
                                    </div>
                                </div>

                                {/* Right - Sort Only */}
                                <div className="flex items-center gap-1.5">
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-auto min-w-25 md:min-w-35 h-7 md:h-9 px-2 md:px-4 bg-white border border-[#e8e8ed] hover:border-[#d1d1d6] shadow-sm rounded-full text-[10px] md:text-[12px] font-medium gap-1">
                                            <span className="text-[#86868b]">Sort:</span>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest</SelectItem>
                                            <SelectItem value="oldest">Oldest</SelectItem>
                                            <SelectItem value="soon">Happening Soon</SelectItem>
                                            <SelectItem value="popular">Most Popular</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Pills */}
                    {hasActiveFilters && (
                        <div className="px-3 md:px-6 py-2 bg-gradient-to-r from-[#fff5f5] to-[#fffbeb] border-b border-[#ffe8e8]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
                                    Active:
                                </span>
                                {selectedDate && (
                                    <span className="px-2 py-0.5 bg-white rounded-full text-[9px] md:text-[11px] font-medium text-[#1d1d1f] shadow-sm border border-[#e8e8ed]">
                                        {datePills.find((p) => p.id === selectedDate)?.label}
                                    </span>
                                )}
                                {selectedCauses.map((causeId) => (
                                    <span
                                        key={causeId}
                                        className="px-2 py-0.5 bg-white rounded-full text-[9px] md:text-[11px] font-medium text-[#1d1d1f] shadow-sm border border-[#e8e8ed]"
                                    >
                                        {causes.find((c) => c.id === causeId)?.label}
                                    </span>
                                ))}
                                {selectedTime && (
                                    <span className="px-2 py-0.5 bg-white rounded-full text-[9px] md:text-[11px] font-medium text-[#1d1d1f] shadow-sm border border-[#e8e8ed]">
                                        {timeOfDay.find((t) => t.id === selectedTime)?.label}
                                    </span>
                                )}
                                {selectedDuration && (
                                    <span className="px-2 py-0.5 bg-white rounded-full text-[9px] md:text-[11px] font-medium text-[#1d1d1f] shadow-sm border border-[#e8e8ed]">
                                        {durationOptions.find((d) => d.id === selectedDuration)?.label}
                                    </span>
                                )}
                                {locationFilter && (
                                    <span className="px-2 py-0.5 bg-white rounded-full text-[9px] md:text-[11px] font-medium text-[#1d1d1f] shadow-sm border border-[#e8e8ed]">
                                        📍 {locationFilter}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Events Grid - Always List View */}
                    <div className="p-2 md:p-6">
                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-5">
                            {loading ? (
                                <div className="col-span-full text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b6b] mb-4"></div>
                                    <p className="text-sm text-gray-600">Loading events...</p>
                                </div>
                            ) : error ? (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            ) : sortedEvents.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600">No events found</p>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearAllFilters}
                                            className="mt-2 text-sm text-[#ff6b6b] hover:underline"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                sortedEvents.slice(0, visibleEvents).map((event) => {
                                    const spotsLeft = event.total_slots - event.registered_count
                                    const isFastFilling = spotsLeft <= 5 && spotsLeft > 0
                                    const isAlmostFull = spotsLeft === 1

                                    return (
                                        <div
                                            key={event.id}
                                            className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border border-[#f5f5f7]"
                                        >
                                            {/* Image */}
                                            <div className="relative aspect-4/3 md:aspect-video overflow-hidden">
                                                {event.cover_image_url ? (
                                                    <img
                                                        src={event.cover_image_url}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                        <Calendar className="w-12 h-12 text-gray-400" />
                                                    </div>
                                                )}
                                                <div
                                                    className={cn(
                                                        "absolute top-1.5 md:top-3 left-1.5 md:left-3 px-1.5 md:px-3 py-0.5 md:py-1.5 rounded-full text-[8px] md:text-[11px] font-bold text-white backdrop-blur-sm shadow-lg capitalize",
                                                        getCategoryColor(event.category),
                                                    )}
                                                >
                                                    {event.category}
                                                </div>
                                                {isFastFilling && (
                                                    <div className="absolute top-1.5 md:top-3 right-1.5 md:right-3 px-1.5 md:px-3 py-0.5 md:py-1.5 bg-[#ff6b6b] rounded-full text-[7px] md:text-[10px] font-bold text-white backdrop-blur-sm shadow-lg animate-pulse">
                                                        {isAlmostFull ? 'Almost Full' : 'Fast'}
                                                    </div>
                                                )}
                                                {event.is_urgent && (
                                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500 text-white rounded text-[9px] md:text-[11px] font-semibold">
                                                        Urgent
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-2 md:p-5">
                                                <h3 className="text-[11px] md:text-[16px] font-bold text-[#1d1d1f] mb-1.5 md:mb-3 line-clamp-1 group-hover:text-[#ff6b6b] transition-colors">
                                                    {event.title}
                                                </h3>

                                                <div className="space-y-1 md:space-y-2 mb-2 md:mb-4">
                                                    <div className="flex items-center gap-1 md:gap-2 text-[#86868b]">
                                                        <Calendar className="w-2.5 h-2.5 md:w-4 md:h-4 text-[#ff6b6b]" />
                                                        <span className="text-[9px] md:text-[13px] font-medium">
                                                            {formatDate(event.event_date)} • {formatTime(event.start_time)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 md:gap-2 text-[#86868b]">
                                                        <MapPin className="w-2.5 h-2.5 md:w-4 md:h-4 text-[#10b981]" />
                                                        <span className="text-[9px] md:text-[13px] font-medium line-clamp-1">{event.location}</span>
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-[#f5f5f7]">
                                                    <div className="flex items-center gap-1 md:gap-3">
                                                        <div className="flex items-center gap-0.5 md:gap-1.5 text-[#10b981]">
                                                            <Users className="w-2.5 h-2.5 md:w-4 md:h-4" />
                                                            <span className="text-[9px] md:text-[12px] font-bold">{event.registered_count}</span>
                                                        </div>
                                                        {isRegistrationOpen(event.registration_deadline) && spotsLeft > 0 && (
                                                            <span className="text-[8px] md:text-[11px] font-semibold text-[#ff6b6b] hidden md:inline">
                                                                {spotsLeft} left
                                                            </span>
                                                        )}
                                                    </div>

                                                    {!isRegistrationOpen(event.registration_deadline) ? (
                                                        <span className="px-2 md:px-3 py-1 md:py-1.5 bg-gray-100 text-gray-600 rounded-full text-[9px] md:text-[11px] font-semibold">
                                                            Closed
                                                        </span>
                                                    ) : spotsLeft <= 0 ? (
                                                        <span className="px-2 md:px-3 py-1 md:py-1.5 bg-amber-100 text-amber-700 rounded-full text-[9px] md:text-[11px] font-semibold">
                                                            Full
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={`/events/${event.id}`}
                                                            className="px-2 py-1 md:px-5 md:py-2 bg-gradient-to-r from-[#1d1d1f] to-[#3d3d3f] hover:from-[#ff6b6b] hover:to-[#ff8e53] rounded-full text-[9px] md:text-[12px] font-bold text-white transition-all shadow-md hover:shadow-lg"
                                                        >
                                                            Book
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Load More */}
                        {visibleEvents < filteredEvents.length && (
                            <div className="flex justify-center mt-4 md:mt-8">
                                <Button
                                    onClick={loadMore}
                                    className="px-6 py-4 md:px-8 md:py-6 bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] hover:from-[#ff5252] hover:to-[#ff7a3a] text-white rounded-full text-[11px] md:text-[14px] font-bold shadow-lg hover:shadow-xl transition-all"
                                >
                                    Load More
                                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 ml-1.5" />
                                </Button>
                            </div>
                        )}

                        {visibleEvents >= sortedEvents.length && sortedEvents.length > 0 && (
                            <p className="text-center text-[10px] md:text-[13px] text-[#86868b] mt-4 md:mt-8">All events loaded</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}