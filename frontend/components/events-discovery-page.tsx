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

export default function EventsDiscoveryPage() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

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
    const [visibleEvents, setVisibleEvents] = useState(10) // Increased initial load for compact view

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
        setVisibleEvents((prev) => Math.min(prev + 10, filteredEvents.length))
    }

    const isRegistrationOpen = (deadline: string) => {
        return new Date(deadline) > new Date();
    };

const FilterContent = () => (
        <div className="space-y-6 lg:space-y-5 pb-6 lg:pb-0">
            {/* Date Section */}
            <div>
                <h3 className="font-bold text-gray-900 text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Date
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-1.5">
                    {datePills.map((pill) => (
                        <button
                            key={pill.id}
                            onClick={() => setSelectedDate(selectedDate === pill.id ? null : pill.id)}
                            className={cn(
                                "rounded-full font-semibold transition-all px-4 py-2 text-[13px] lg:px-3 lg:py-1.5 lg:text-[11px]",
                                selectedDate === pill.id
                                    ? "bg-black text-white shadow-md"
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
                <h3 className="font-bold text-gray-900 text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Causes
                </h3>
                <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
                    {causes.map((cause) => (
                        <label
                            key={cause.id}
                            className={cn(
                                "flex items-center gap-2 lg:gap-1.5 rounded-xl cursor-pointer transition-all border p-3 lg:p-2",
                                selectedCauses.includes(cause.id)
                                    ? "bg-gray-50 border-black shadow-sm"
                                    : "bg-white border-gray-200 hover:border-gray-300",
                            )}
                        >
                            <Checkbox
                                checked={selectedCauses.includes(cause.id)}
                                onCheckedChange={() => toggleCause(cause.id)}
                                className="w-5 h-5 lg:w-4 lg:h-4 rounded-[4px] border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
                            />
                            <cause.icon className={cn(cause.color, "w-4 h-4 lg:w-3.5 lg:h-3.5")} />
                            <span className="font-semibold text-[#1d1d1f] text-[13px] lg:text-[11px]">
                                {cause.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Duration */}
            <div>
                <h3 className="font-bold text-gray-900 text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Duration
                </h3>
                <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
                    {durationOptions.map((duration) => (
                        <button
                            key={duration.id}
                            onClick={() => setSelectedDuration(selectedDuration === duration.id ? null : duration.id)}
                            className={cn(
                                "rounded-xl font-semibold transition-all border px-4 py-3 text-[13px] lg:px-3 lg:py-2 lg:text-[11px]",
                                selectedDuration === duration.id
                                    ? "bg-[#d4f4dd] border-emerald-400 text-emerald-900"
                                    : "bg-white border-gray-200 text-[#1d1d1f] hover:border-gray-300",
                            )}
                        >
                            {duration.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time of Day Section */}
            <div>
                <h3 className="font-bold text-gray-900 text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Time of Day
                </h3>
                <div className="space-y-2 lg:space-y-1.5">
                    {timeOfDay.map((time) => (
                        <button
                            key={time.id}
                            onClick={() => setSelectedTime(selectedTime === time.id ? null : time.id)}
                            className={cn(
                                "w-full flex items-center gap-3 lg:gap-2 rounded-xl text-left transition-all border p-3 lg:p-2",
                                selectedTime === time.id
                                    ? "bg-[#fef3c7] border-amber-300"
                                    : "bg-white border-gray-200 hover:border-gray-300",
                            )}
                        >
                            <time.icon className={cn(selectedTime === time.id ? "text-amber-600" : "text-gray-400", "w-5 h-5 lg:w-4 lg:h-4")} />
                            <div className="flex-1">
                                <div className={cn("font-bold text-[14px] lg:text-[12px]", selectedTime === time.id ? "text-amber-900" : "text-[#1d1d1f]")}>
                                    {time.label}
                                </div>
                                <div className={cn("text-[12px] lg:text-[10px] font-medium mt-0.5 lg:mt-0", selectedTime === time.id ? "text-amber-700" : "text-gray-500")}>
                                    {time.time}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Location */}
            <div>
                <h3 className="font-bold text-gray-900 text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Location
                </h3>
                <div className="relative">
                    <MapPin className="absolute left-3.5 lg:left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 lg:w-4 lg:h-4" />
                    <input
                        type="text"
                        placeholder="Enter specific location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        // 16px is required on mobile to prevent iOS zoom, but we safely drop it to 12px on desktop!
                        className="w-full h-12 lg:h-9 bg-white border border-gray-200 rounded-xl lg:rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors pl-11 lg:pl-8 pr-4 lg:pr-3 text-[16px] lg:text-[12px]"
                    />
                </div>
            </div>

            {/* Show Filled Events */}
            <div className="bg-[#f5f5f7] rounded-xl lg:rounded-lg p-4 lg:p-3">
                <label className="flex items-center justify-between cursor-pointer">
                    <div>
                        <div className="font-bold text-[#1d1d1f] text-[14px] lg:text-[12px]">
                            Show Filled Events
                        </div>
                        <div className="text-gray-500 text-[12px] lg:text-[10px] mt-0.5 lg:mt-0 font-medium">
                            Display events with no spots
                        </div>
                    </div>
                    <Checkbox
                        checked={showFilledEvents}
                        onCheckedChange={(checked) => setShowFilledEvents(checked as boolean)}
                        className="w-5 h-5 lg:w-4 lg:h-4 rounded-[4px] border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
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
        if (!timeString) return '';
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
                <main className="flex-1 bg-gradient-to-br from-[#fafafa] via-white to-[#f5f5f7] min-h-screen pb-24">

                    {/* Mobile-Optimized Search Bar */}
                    <div className="px-3 sm:px-6 pt-4 pb-2 bg-white/50 backdrop-blur-sm">
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#86868b]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search events..."
                                className="w-full h-11 md:h-12 pl-11 md:pl-12 pr-10 py-3 bg-white border border-[#e8e8ed] rounded-full text-[14px] md:text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/20 focus:border-[#ff6b6b]/30 transition-all shadow-sm"
                            />
                            {searchQuery ? (
                                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <X className="w-4 h-4 text-[#86868b] hover:text-[#1d1d1f]" />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="sticky top-12 md:top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-[#e8e8ed] shadow-sm">
                        <div className="px-3 sm:px-6 py-2 md:py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                {/* Left - Results & Filters */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Mobile Filter Button */}
                                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                        <SheetTrigger asChild>
                                            <button className="lg:hidden flex items-center gap-1.5 px-4 py-2 bg-[#1d1d1f] text-white rounded-full shadow-sm active:scale-95 transition-all">
                                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                                <span className="text-[12px] font-bold">Filters</span>
                                                {hasActiveFilters && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse ml-1" />}
                                            </button>
                                        </SheetTrigger>
                                        
                                        {/* Added z-[100] to overlay the Bottom Nav */}
                                        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl bg-white px-0 z-[100] flex flex-col">
                                            <SheetHeader className="px-5 pt-2 pb-4 border-b border-gray-100 shrink-0">
                                                <div className="flex items-center justify-between">
                                                    <SheetTitle className="text-[18px] font-bold">Filters</SheetTitle>
                                                    {hasActiveFilters && (
                                                        <button onClick={clearAllFilters} className="text-[13px] text-red-500 font-bold active:opacity-70">
                                                            Clear All
                                                        </button>
                                                    )}
                                                </div>
                                            </SheetHeader>
                                            
                                            <div className="flex-1 overflow-y-auto px-5 py-4">
                                                <FilterContent />
                                            </div>
                                            
                                            <div className="shrink-0 p-5 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom,20px)]">
                                                <Button
                                                    onClick={() => setIsFilterOpen(false)}
                                                    className="w-full h-14 bg-black hover:bg-gray-800 text-white rounded-xl text-[15px] font-bold shadow-lg active:scale-[0.98] transition-all"
                                                >
                                                    Show {filteredEvents.length} Events
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>

                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="hidden md:block w-3 h-3 md:w-4 md:h-4 text-[#10b981]" />
                                        <p className="text-[11px] md:text-[13px] text-[#1d1d1f]">
                                            <span className="font-bold text-[#ff6b6b]">{filteredEvents.length}</span> events
                                        </p>
                                    </div>
                                </div>

                                {/* Right - Sort */}
                                <div className="flex items-center gap-1.5">
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-auto min-w-[120px] md:min-w-35 h-8 md:h-9 px-3 md:px-4 bg-white border border-[#e8e8ed] hover:border-[#d1d1d6] shadow-sm rounded-full text-[11px] md:text-[12px] font-medium gap-1">
                                            <span className="text-[#86868b] hidden md:inline">Sort:</span>
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
                        <div className="px-3 sm:px-6 py-2 bg-gradient-to-r from-[#fff5f5] to-[#fffbeb] border-b border-[#ffe8e8] overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="text-[10px] md:text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
                                    Active:
                                </span>
                                {selectedDate && (
                                    <span className="px-2.5 py-1 bg-white rounded-full text-[10px] md:text-[11px] font-medium text-[#1d1d1f] shadow-sm border border-[#e8e8ed]">
                                        {datePills.find((p) => p.id === selectedDate)?.label}
                                    </span>
                                )}
                                {selectedCauses.map((causeId) => (
                                    <span
                                        key={causeId}
                                        className="px-2.5 py-1 bg-white rounded-full text-[10px] md:text-[11px] font-medium text-[#1d1d1f] shadow-sm border border-[#e8e8ed]"
                                    >
                                        {causes.find((c) => c.id === causeId)?.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Events Grid - HYPER COMPACT MOBILE LIST, DESKTOP GRID */}
                    <div className="p-2 sm:p-4 md:p-6">
                        {/* 1 col list on mobile, 2/3 cols on desktop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-5">
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
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.id}`}
                                            className="group flex flex-row md:flex-col h-auto md:h-full bg-white rounded-[16px] md:rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl border border-[#e8e8ed] active:scale-[0.98] transition-all duration-200"
                                        >
                                            {/* IMAGE CONTAINER - Thumbnail on Mobile, Hero on Desktop */}
                                            <div className="relative shrink-0 w-[100px] md:w-full aspect-square md:aspect-[4/3] bg-gray-100 p-2 md:p-0">
                                                <div className="w-full h-full rounded-[12px] md:rounded-none overflow-hidden relative">
                                                    {event.cover_image_url ? (
                                                        <img
                                                            src={event.cover_image_url}
                                                            alt={event.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                            <Calendar className="w-6 h-6 md:w-12 md:h-12 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Desktop Badges - Hidden on mobile */}
                                                <div
                                                    className={cn(
                                                        "hidden md:block absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-sm shadow-sm capitalize",
                                                        getCategoryColor(event.category),
                                                    )}
                                                >
                                                    {event.category}
                                                </div>
                                                {isFastFilling && (
                                                    <div className="hidden md:block absolute top-3 right-3 px-3 py-1 bg-[#ff6b6b] rounded-full text-[10px] font-bold text-white backdrop-blur-sm shadow-sm animate-pulse">
                                                        {isAlmostFull ? 'Almost Full' : 'Fast Filling'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* CONTENT CONTAINER */}
                                            <div className="p-3 md:p-4 flex flex-col flex-1 min-w-0">
                                                {/* Mobile Badge + Fast Filling - Shown only on mobile inline */}
                                                <div className="flex md:hidden items-center gap-1.5 mb-1.5">
                                                     <div className={cn("w-2 h-2 rounded-full", getCategoryColor(event.category))} />
                                                     <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{event.category}</span>
                                                     {isFastFilling && (
                                                        <span className="text-[10px] font-bold text-[#ff6b6b] ml-auto">
                                                            {isAlmostFull ? '1 left' : 'Filling'}
                                                        </span>
                                                     )}
                                                </div>

                                                <h3 className="text-[14px] md:text-lg font-bold text-[#1d1d1f] mb-1.5 md:mb-3 line-clamp-2 md:line-clamp-2 group-hover:text-[#ff6b6b] transition-colors leading-tight">
                                                    {event.title}
                                                </h3>

                                                {/* Date & Location Details */}
                                                <div className="space-y-1 md:space-y-2 mb-2 md:mb-4">
                                                    <div className="flex items-center gap-1.5 md:gap-2 text-[#6e6e73]">
                                                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ff6b6b] shrink-0" />
                                                        <span className="text-[11px] md:text-[13px] font-medium truncate">
                                                            {formatDate(event.event_date)} • {formatTime(event.start_time)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 md:gap-2 text-[#6e6e73]">
                                                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#10b981] shrink-0" />
                                                        <span className="text-[11px] md:text-[13px] font-medium truncate">{event.location}</span>
                                                    </div>
                                                </div>

                                                {/* Desktop Footer (Hidden on mobile) */}
                                                <div className="hidden md:flex mt-auto items-center justify-between pt-4 border-t border-[#f5f5f7]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 text-[#10b981]">
                                                            <Users className="w-4 h-4" />
                                                            <span className="text-[13px] font-bold">{event.registered_count}</span>
                                                        </div>
                                                        {isRegistrationOpen(event.registration_deadline) && spotsLeft > 0 && (
                                                            <span className="text-[11px] font-semibold text-[#ff6b6b]">
                                                                {spotsLeft} left
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="h-8 px-5 bg-[#1d1d1f] text-white rounded-full text-[12px] font-bold flex items-center justify-center group-hover:bg-[#ff6b6b] transition-colors">
                                                        Book
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })
                            )}
                        </div>

                        {/* Load More */}
                        {visibleEvents < filteredEvents.length && (
                            <div className="flex justify-center mt-6 md:mt-8">
                                <Button
                                    onClick={loadMore}
                                    className="px-6 py-5 md:px-8 md:py-6 bg-white border border-gray-200 text-[#1d1d1f] rounded-full text-[13px] md:text-[14px] font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                                >
                                    Load More
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}