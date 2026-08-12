"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Search,
    X,
    MapPin,
    Users,
    SlidersHorizontal,
    ChevronLeft,
    Calendar,
    Leaf,
    GraduationCap,
    Heart,
    Dog,
    Sun,
    Sunset,
    Moon,
    TrendingUp,
    Coffee,
    Utensils,
    Shield,
    Trophy,
    Brain,
    Gift,
    Palette,
    Building2,
    Clock,
    CheckCircle2,
} from "lucide-react"
import { cn, formatLabel, formatHoursTotal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { InstagramIcon } from "@/components/ui/social-icons"
import { api } from "@/lib/api"

const causes = [
    { id: "nature_outdoors", label: "Outdoors & Nature", icon: Leaf, color: "text-emerald-500" },
    { id: "food_hunger", label: "Food & Hunger Relief", icon: Utensils, color: "text-orange-500" },
    { id: "animal_welfare", label: "Animals & Rescue", icon: Dog, color: "text-purple-500" },
    { id: "elderly_care", label: "Elderly Care", icon: Users, color: "text-pink-500" },
    { id: "education_mentoring", label: "Kids & Learning", icon: GraduationCap, color: "text-amber-500" },
    { id: "health_medical", label: "Health & Medical", icon: Heart, color: "text-red-500" },
    { id: "art_culture", label: "Art, Culture & Heritage", icon: Palette, color: "text-fuchsia-500" },
    { id: "civic_community", label: "Community & Civic", icon: Building2, color: "text-cyan-500" },
    { id: "women_empowerment", label: "Women & Safety", icon: Shield, color: "text-rose-500" },
    { id: "youth_sports", label: "Youth & Sports", icon: Trophy, color: "text-lime-500" },
    { id: "mental_wellness", label: "Mental Health & Wellness", icon: Brain, color: "text-indigo-500" },
    { id: "donation_drives", label: "Donations & Drives", icon: Gift, color: "text-yellow-500" },
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
    const router = useRouter()
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Filters
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedCauses, setSelectedCauses] = useState<string[]>([])
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [selectedDuration, setSelectedDuration] = useState<string | null>(null)
    const [showFilledEvents, setShowFilledEvents] = useState(true)

    const [sortBy, setSortBy] = useState("newest")
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [visibleEvents, setVisibleEvents] = useState(10)

    const [completedEvents, setCompletedEvents] = useState<any[]>([])
    const [completedLoading, setCompletedLoading] = useState(true)

    // Fetch events & Profile
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [eventsRes, profileRes] = await Promise.all([
                    api.getPublicEvents(),
                    api.getUserProfile().catch(() => null)
                ])

                // Onboarding guard: redirect volunteers who haven't completed it
                if (profileRes?.userType === 'volunteer' && profileRes?.profile?.onboarding_completed === false) {
                    router.push('/onboarding')
                    return
                }

                setEvents(eventsRes.events || [])
            } catch (err: any) {
                setError(err.message || 'Failed to load data')
                console.error('Error fetching data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router])

    useEffect(() => {
        let mounted = true
        api.getCompletedEvents()
            .then(res => { if (mounted) setCompletedEvents(res.events || []) })
            .catch(() => {})
            .finally(() => { if (mounted) setCompletedLoading(false) })
        return () => { mounted = false }
    }, [])

    const toggleCause = (causeId: string) => {
        setSelectedCauses((prev) => (prev.includes(causeId) ? prev.filter((c) => c !== causeId) : [...prev, causeId]))
    }

    const clearAllFilters = () => {
        setSelectedDate(null)
        setSelectedCauses([])
        setSelectedTime(null)
        setSelectedDuration(null)
        setShowFilledEvents(true)
        setSearchQuery("")
    }

    const hasActiveFilters =
        selectedDate || selectedCauses.length > 0 || selectedTime || selectedDuration

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
                <h3 className="font-bold text-foreground text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Date
                </h3>
                <div className="flex flex-wrap gap-2 lg:gap-1.5">
                    {datePills.map((pill) => (
                        <button
                            key={pill.id}
                            onClick={() => setSelectedDate(selectedDate === pill.id ? null : pill.id)}
                            className={cn(
                                "rounded-full font-semibold transition-all duration-300 ease-out px-4 py-2 text-[13px] lg:px-3 lg:py-1.5 lg:text-[11px] hover:scale-[1.03] active:scale-95",
                                selectedDate === pill.id
                                    ? "bg-primary text-primary-foreground dark:bg-white dark:text-black shadow-md"
                                    : "bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10",
                            )}
                        >
                            {pill.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Causes Section */}
            <div>
                <h3 className="font-bold text-foreground text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Causes
                </h3>
                <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
                    {causes.map((cause) => (
                        <label
                            key={cause.id}
                            className={cn(
                                "flex items-center gap-2 lg:gap-1.5 rounded-xl cursor-pointer transition-all duration-300 ease-out border p-3 lg:p-2 hover:scale-[1.02]",
                                selectedCauses.includes(cause.id)
                                    ? "bg-primary/10 dark:bg-white/10 border-primary/30 dark:border-white/30 shadow-sm"
                                    : "bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20",
                            )}
                        >
                            <Checkbox
                                checked={selectedCauses.includes(cause.id)}
                                onCheckedChange={() => toggleCause(cause.id)}
                                className="w-5 h-5 lg:w-4 lg:h-4 rounded-[4px] border-border"
                            />
                            <cause.icon className={cn(cause.color, "w-4 h-4 lg:w-3.5 lg:h-3.5")} />
                            <span className="font-semibold text-foreground text-[13px] lg:text-[11px]">
                                {cause.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Duration */}
            <div>
                <h3 className="font-bold text-foreground text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Duration
                </h3>
                <div className="grid grid-cols-2 gap-2 lg:gap-1.5">
                    {durationOptions.map((duration) => (
                        <button
                            key={duration.id}
                            onClick={() => setSelectedDuration(selectedDuration === duration.id ? null : duration.id)}
                            className={cn(
                                "rounded-xl font-semibold transition-all duration-300 ease-out border px-4 py-3 text-[13px] lg:px-3 lg:py-2 lg:text-[11px] hover:scale-[1.02]",
                                selectedDuration === duration.id
                                    ? "bg-[#d4f4dd] dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-400"
                                    : "bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 text-foreground hover:border-black/10 dark:hover:border-white/20",
                            )}
                        >
                            {duration.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time of Day Section */}
            <div>
                <h3 className="font-bold text-foreground text-[12px] lg:text-[11px] uppercase tracking-wider mb-3 lg:mb-2">
                    Time of Day
                </h3>
                <div className="space-y-2 lg:space-y-1.5">
                    {timeOfDay.map((time) => (
                        <button
                            key={time.id}
                            onClick={() => setSelectedTime(selectedTime === time.id ? null : time.id)}
                            className={cn(
                                "w-full flex items-center gap-3 lg:gap-2 rounded-xl text-left transition-all duration-300 ease-out border p-3 lg:p-2 hover:scale-[1.01]",
                                selectedTime === time.id
                                    ? "bg-[#fef3c7] dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40"
                                    : "bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20",
                            )}
                        >
                            <time.icon className={cn(selectedTime === time.id ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground", "w-5 h-5 lg:w-4 lg:h-4")} />
                            <div className="flex-1">
                                <div className={cn("font-bold text-[14px] lg:text-[12px]", selectedTime === time.id ? "text-amber-900 dark:text-amber-400" : "text-foreground")}>
                                    {time.label}
                                </div>
                                <div className={cn("text-[12px] lg:text-[10px] font-medium mt-0.5 lg:mt-0", selectedTime === time.id ? "text-amber-700 dark:text-amber-500" : "text-muted-foreground")}>
                                    {time.time}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Show Filled Events */}
            <div className="bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl lg:rounded-lg p-4 lg:p-3">
                <label className="flex items-center justify-between cursor-pointer">
                    <div>
                        <div className="font-bold text-foreground text-[14px] lg:text-[12px]">
                            Show Filled Events
                        </div>
                        <div className="text-muted-foreground text-[12px] lg:text-[10px] mt-0.5 lg:mt-0 font-medium">
                            Display events with no spots
                        </div>
                    </div>
                    <Checkbox
                        checked={showFilledEvents}
                        onCheckedChange={(checked) => setShowFilledEvents(checked as boolean)}
                        className="w-5 h-5 lg:w-4 lg:h-4 rounded-[4px] border-border"
                    />
                </label>
            </div>
        </div>
    )

    // Helper functions
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            nature_outdoors: "bg-[#10b981]",
            food_hunger: "bg-[#f97316]",
            animal_welfare: "bg-[#8b5cf6]",
            elderly_care: "bg-[#ec4899]",
            education_mentoring: "bg-[#f59e0b]",
            health_medical: "bg-[#ef4444]",
            art_culture: "bg-[#e879f9]",
            civic_community: "bg-[#06b6d4]",
            women_empowerment: "bg-[#f43f5e]",
            youth_sports: "bg-[#84cc16]",
            mental_wellness: "bg-[#6366f1]",
            donation_drives: "bg-[#eab308]",
        }
        return colors[category] || "bg-gray-500"
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const formatTime = (timeString: string) => {
        if (!timeString) return '';
        const [hours] = timeString.split(':')
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
            const matchDescription = event.description?.toLowerCase().includes(query)
            const matchLocation = event.location?.toLowerCase().includes(query)
            const matchOrg = event.org_name?.toLowerCase().includes(query)
            if (!matchTitle && !matchDescription && !matchLocation && !matchOrg) return false
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

        if (!showFilledEvents && event.total_slots != null && event.registered_count >= event.total_slots) {
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
        <div className="min-h-screen bg-background dark:bg-black overflow-x-hidden relative">
            {/* Ambient glow — same subtle navy motif as the rest of the redesign */}
            <div
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] max-w-[200vw] bg-gradient-to-b from-indigo-200/20 dark:from-indigo-500/10 to-transparent blur-3xl pointer-events-none"
            />
            <div className="flex relative">
                {/* Left Sidebar - Desktop Only. Collapses to a slim icon rail — click the
                    "Filters" label or its icon to toggle, no separate button (industry-standard
                    rail pattern: Notion/Linear/VS Code all collapse to an icon-only strip rather
                    than vanishing entirely, so there's always something to click back open, and
                    an active-filter dot still shows while collapsed per filter-UX best practice). */}
                <aside
                    className={cn(
                        "hidden lg:flex lg:flex-col shrink-0 sticky top-14 h-[calc(100vh-56px)] border-r border-black/5 dark:border-white/5 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl transition-[width] duration-300 ease-out overflow-hidden",
                        sidebarCollapsed ? "w-14" : "w-70",
                    )}
                >
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSidebarCollapsed((v) => !v)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                setSidebarCollapsed((v) => !v)
                            }
                        }}
                        className={cn(
                            "flex items-center shrink-0 cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                            sidebarCollapsed ? "justify-center p-4" : "justify-between px-5 py-4",
                        )}
                        aria-expanded={!sidebarCollapsed}
                        aria-label={sidebarCollapsed ? "Show filters" : "Hide filters"}
                        title={sidebarCollapsed ? "Show filters" : "Hide filters"}
                    >
                        <span className="flex items-center gap-2 relative">
                            <SlidersHorizontal className="w-4 h-4 text-[#ff6b6b] shrink-0" />
                            {hasActiveFilters && sidebarCollapsed && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#ff6b6b] ring-2 ring-white dark:ring-neutral-900" />
                            )}
                            {!sidebarCollapsed && <h2 className="text-[14px] font-bold text-foreground">Filters</h2>}
                        </span>
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-3">
                                {hasActiveFilters && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            clearAllFilters()
                                        }}
                                        className="text-[11px] text-[#ff6b6b] hover:underline font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {!sidebarCollapsed && (
                        <div className="px-5 pb-5 flex-1 overflow-y-auto">
                            <FilterContent />
                        </div>
                    )}
                </aside>

                {/* Right Content Area */}
                <main className="flex-1 bg-gradient-to-br from-muted via-white dark:via-black to-muted dark:to-black min-h-screen pb-24">

                    {/* Mobile-Optimized Search Bar */}
                    <div className="px-3 sm:px-6 pt-4 pb-2">
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by title, location, or description..."
                                className="w-full h-11 md:h-12 pl-11 md:pl-12 pr-10 py-3 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full text-[14px] md:text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/20 focus:border-[#ff6b6b]/30 transition-all shadow-sm"
                            />
                            {searchQuery ? (
                                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="sticky top-12 md:top-14 z-40 bg-white/70 dark:bg-black/60 backdrop-blur-xl border-b border-black/5 dark:border-white/10 shadow-sm">
                        <div className="px-3 sm:px-6 py-2 md:py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                {/* Left - Results & Filters */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Mobile Filter Button */}
                                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                        <SheetTrigger asChild>
                                            <Button variant="nav-pill" className="lg:hidden h-9 px-4 gap-1.5">
                                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                                <span className="text-[12px] font-bold">Filters</span>
                                                {hasActiveFilters && <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse ml-1" />}
                                            </Button>
                                        </SheetTrigger>

                                        {/* Added z-[100] to overlay the Bottom Nav */}
                                        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl bg-white/95 dark:bg-black/95 backdrop-blur-xl px-0 z-[100] flex flex-col">
                                            <SheetHeader className="px-5 pt-4 pb-4 border-b border-black/5 dark:border-white/10 shrink-0">
                                                <div className="flex items-center justify-between h-8">
                                                    <SheetTitle className="text-[18px] font-bold leading-none">Filters</SheetTitle>
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

                                            <div className="shrink-0 p-5 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-black/5 dark:border-white/10 pb-[env(safe-area-inset-bottom,20px)]">
                                                <Button
                                                    variant="outline-pill"
                                                    onClick={() => setIsFilterOpen(false)}
                                                    className="w-full h-14 text-[15px] shadow-lg"
                                                >
                                                    Show {filteredEvents.length} Events
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>

                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="hidden md:block w-3 h-3 md:w-4 md:h-4 text-[#10b981]" />
                                        <p className="text-[11px] md:text-[13px] text-foreground">
                                            <span className="font-bold text-[#ff6b6b]">{filteredEvents.length}</span> events
                                        </p>
                                    </div>
                                </div>

                                {/* Right - Sort */}
                                <div className="flex items-center gap-1.5">
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-auto min-w-[120px] md:min-w-35 h-8 md:h-9 px-3 md:px-4 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 shadow-sm rounded-full text-[11px] md:text-[12px] font-medium gap-1 transition-all duration-300">
                                            <span className="text-muted-foreground hidden md:inline">Sort:</span>
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
                        <div className="px-3 sm:px-6 py-2 bg-gradient-to-r from-[#fff5f5] to-[#fffbeb] dark:from-neutral-900/60 dark:to-neutral-900/60 border-b border-[#ffe8e8] dark:border-white/5 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="text-[10px] md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    Active:
                                </span>
                                {selectedDate && (
                                    <span className="px-2.5 py-1 bg-card rounded-full text-[10px] md:text-[11px] font-medium text-foreground shadow-sm border border-border">
                                        {datePills.find((p) => p.id === selectedDate)?.label}
                                    </span>
                                )}
                                {selectedCauses.map((causeId) => (
                                    <span
                                        key={causeId}
                                        className="px-2.5 py-1 bg-card rounded-full text-[10px] md:text-[11px] font-medium text-foreground shadow-sm border border-border"
                                    >
                                        {causes.find((c) => c.id === causeId)?.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Events Grid */}
                    <div className="p-2 sm:p-4 md:p-6">

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b6b] mb-4" />
                                <p className="text-sm text-muted-foreground">Loading events...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        ) : (
                            <>
                                {/* ── UPCOMING EVENTS ── */}
                                {events.length === 0 ? (
                                    /* No upcoming events at all — designed empty state */
                                    <ScrollReveal className="flex flex-col items-center justify-center py-14 text-center">
                                        <div className="w-20 h-20 rounded-full bg-[#fff5f5] dark:bg-white/5 flex items-center justify-center mb-5 shadow-inner">
                                            <Calendar className="w-9 h-9 text-[#ff6b6b]" />
                                        </div>
                                        <h2 className="text-[20px] font-bold text-foreground mb-2 tracking-tight">
                                            No events right now.
                                        </h2>
                                        <p className="text-[14px] text-muted-foreground mb-7 max-w-[260px] leading-relaxed">
                                            Next drop coming soon. Follow us to be the first to know when new events go live.
                                        </p>
                                        <a
                                            href="https://www.instagram.com/kindly.co.in"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-[14px] text-foreground bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all duration-300 ease-out"
                                        >
                                            <InstagramIcon className="w-5 h-5" />
                                            Follow @kindly.co.in for event drops
                                        </a>
                                    </ScrollReveal>
                                ) : sortedEvents.length === 0 ? (
                                    /* Filters applied, no matches */
                                    <ScrollReveal className="text-center py-12">
                                        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm text-muted-foreground">No events match your filters</p>
                                        <button onClick={clearAllFilters} className="mt-2 text-sm text-[#ff6b6b] hover:underline">
                                            Clear filters
                                        </button>
                                    </ScrollReveal>
                                ) : (
                                    /* Event cards grid */
                                    <ScrollReveal>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-5">
                                        {sortedEvents.slice(0, visibleEvents).map((event) => {
                                            const isUnlimited = event.total_slots == null
                                            const spotsLeft = isUnlimited ? Infinity : Math.max(0, event.total_slots - event.registered_count)
                                            const isFastFilling = !isUnlimited && spotsLeft <= 5 && spotsLeft > 0
                                            const isAlmostFull = spotsLeft === 1

                                            return (
                                                <Link
                                                    key={event.id}
                                                    href={`/events/${event.id}`}
                                                    className="group flex flex-row md:flex-col h-auto md:h-full bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl md:rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl dark:shadow-black/50 hover:shadow-xl border border-black/5 dark:border-white/5 active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-300 ease-out"
                                                >
                                                    {/* IMAGE — thumbnail on mobile, hero on desktop */}
                                                    <div className="relative shrink-0 w-[100px] md:w-full aspect-square md:aspect-[4/3] bg-muted">
                                                        <div className="absolute inset-2 md:inset-0 rounded-[12px] md:rounded-none overflow-hidden">
                                                            {event.cover_image_url ? (
                                                                <img
                                                                    src={event.cover_image_url}
                                                                    alt={event.title}
                                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-muted flex items-center justify-center">
                                                                    <Calendar className="w-6 h-6 md:w-12 md:h-12 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Badge className={cn("hidden md:block absolute top-3 left-3 border-0 text-white backdrop-blur-sm shadow-sm", getCategoryColor(event.category))}>
                                                            {formatLabel(event.category)}
                                                        </Badge>
                                                        {isUnlimited ? (
                                                            <Badge className="hidden md:block absolute top-3 right-3 border-0 bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm">
                                                                Unlimited
                                                            </Badge>
                                                        ) : isFastFilling ? (
                                                            <Badge className="hidden md:block absolute top-3 right-3 border-0 bg-[#ff6b6b] text-white backdrop-blur-sm shadow-sm animate-pulse">
                                                                {isAlmostFull ? 'Almost Full' : 'Fast Filling'}
                                                            </Badge>
                                                        ) : null}
                                                    </div>

                                                    {/* CONTENT */}
                                                    <div className="p-3 md:p-4 flex flex-col flex-1 min-w-0">
                                                        <div className="flex md:hidden items-center gap-1.5 mb-1.5">
                                                            <div className={cn("w-2 h-2 rounded-full", getCategoryColor(event.category))} />
                                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{formatLabel(event.category)}</span>
                                                            {isUnlimited ? (
                                                                <span className="text-[10px] font-bold text-emerald-600 ml-auto">Unlimited</span>
                                                            ) : isFastFilling ? (
                                                                <span className="text-[10px] font-bold text-[#ff6b6b] ml-auto">
                                                                    {isAlmostFull ? '1 left' : 'Filling'}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <h3 className="text-[14px] md:text-lg font-bold text-foreground mb-1.5 md:mb-3 line-clamp-2 group-hover:text-[#ff6b6b] transition-colors leading-tight">
                                                            {event.title}
                                                        </h3>
                                                        <div className="space-y-1 md:space-y-2 mb-2 md:mb-4">
                                                            <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                                                                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#ff6b6b] shrink-0" />
                                                                <span className="text-[11px] md:text-[13px] font-medium truncate">
                                                                    {formatDate(event.event_date)} • {formatTime(event.start_time)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                                                                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#10b981] shrink-0" />
                                                                <span className="text-[11px] md:text-[13px] font-medium truncate">{event.location}</span>
                                                            </div>
                                                            {event.connect_plan && (
                                                                <div className="flex items-center gap-1.5 md:gap-2">
                                                                    <Coffee className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 shrink-0" />
                                                                    <span className="text-[11px] md:text-[13px] font-medium text-amber-700 truncate">
                                                                        The After: {event.connect_plan}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="hidden md:flex mt-auto items-center justify-between pt-4 border-t border-border">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1.5 text-[#10b981]">
                                                                    <Users className="w-4 h-4" />
                                                                    <span className="text-[13px] font-bold">{event.registered_count}</span>
                                                                </div>
                                                                {isUnlimited ? (
                                                                    <span className="text-[11px] font-semibold text-emerald-600">Unlimited slots</span>
                                                                ) : isRegistrationOpen(event.registration_deadline) && spotsLeft > 0 ? (
                                                                    <span className="text-[11px] font-semibold text-[#ff6b6b]">{spotsLeft} left</span>
                                                                ) : null}
                                                            </div>
                                                            <span className="h-8 px-5 bg-primary text-primary-foreground dark:bg-white dark:text-black rounded-full text-[12px] font-bold flex items-center justify-center group-hover:bg-[#ff6b6b] dark:group-hover:bg-[#ff6b6b] dark:group-hover:text-white transition-colors">
                                                                Book
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                    </ScrollReveal>
                                )}

                                {/* Load More — upcoming events only */}
                                {visibleEvents < filteredEvents.length && (
                                    <div className="flex justify-center mt-6 md:mt-8">
                                        <Button
                                            onClick={loadMore}
                                            variant="outline-pill"
                                            className="px-6 py-5 md:px-8 md:py-6 text-[13px] md:text-[14px] font-bold shadow-sm active:scale-95"
                                        >
                                            Load More
                                        </Button>
                                    </div>
                                )}

                                {/* ── RECENTLY COMPLETED ── */}
                                {(completedLoading || completedEvents.length > 0) && (
                                    <ScrollReveal delay={0.1} className="mt-10">
                                        {/* Section divider */}
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="flex-1 h-px bg-muted" />
                                            <div className="flex items-center gap-2 px-1">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    Recently Completed
                                                </span>
                                            </div>
                                            <div className="flex-1 h-px bg-muted" />
                                        </div>

                                        {completedLoading ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-5">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex flex-row md:flex-col bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl md:rounded-3xl overflow-hidden border border-black/5 dark:border-white/5 animate-pulse">
                                                        <div className="shrink-0 w-[100px] md:w-full aspect-square md:aspect-[4/3] bg-muted" />
                                                        <div className="p-3 md:p-4 flex-1 space-y-2">
                                                            <div className="h-3.5 bg-muted rounded-full w-3/4" />
                                                            <div className="h-3 bg-muted rounded-full w-1/2" />
                                                            <div className="h-3 bg-muted rounded-full w-1/3" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-5">
                                                {completedEvents.map((ev) => (
                                                    <Link
                                                        key={ev.id}
                                                        href={`/events/${ev.id}/showcase`}
                                                        className="group flex flex-row md:flex-col h-auto md:h-full bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl md:rounded-3xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm dark:shadow-2xl dark:shadow-black/50 active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-300 ease-out"
                                                    >
                                                        {/* IMAGE with dark overlay */}
                                                        <div className="relative shrink-0 w-[100px] md:w-full aspect-square md:aspect-[4/3] bg-muted">
                                                            <div className="absolute inset-2 md:inset-0 rounded-[12px] md:rounded-none overflow-hidden">
                                                                {ev.cover_image_url ? (
                                                                    <img
                                                                        src={ev.cover_image_url}
                                                                        alt={ev.title}
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-muted" />
                                                                )}
                                                                {/* ~50% dark overlay */}
                                                                <div className="absolute inset-0 bg-black/50" />
                                                                {/* Event Ended badge */}
                                                                <Badge className="absolute bottom-2 left-2 border-0 bg-black/60 text-white backdrop-blur-sm text-[9px] tracking-wider">
                                                                    Event Ended
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* CONTENT */}
                                                        <div className="p-3 md:p-4 flex flex-col flex-1 min-w-0">
                                                            <h3 className="text-[14px] md:text-base font-bold text-muted-foreground mb-1 line-clamp-2 leading-tight group-hover:text-foreground transition-colors">
                                                                {ev.title}
                                                            </h3>
                                                            {ev.org_name && (
                                                                <p className="text-[11px] text-muted-foreground font-medium mb-2 truncate">
                                                                    {ev.org_name}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-auto text-[11px] text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                                    {formatDate(ev.event_date)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3 shrink-0" />
                                                                    {ev.attendee_count}
                                                                </span>
                                                                {ev.total_hours > 0 && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3 shrink-0" />
                                                                        {formatHoursTotal(ev.total_hours)}h
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollReveal>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}