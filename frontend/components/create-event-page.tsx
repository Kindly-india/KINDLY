"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    ChevronLeft,
    ImageIcon,
    Calendar,
    Clock,
    MapPin,
    Users,
    Sparkles,
    Heart,
    Building2,
    AlertTriangle,
    CheckCircle,
    Info,
    Navigation,
    Search,
    Loader2,
    IndianRupee
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

const LocationPickerMap = dynamic(
    () => import("./location-picker-map").then((m) => ({ default: m.LocationPickerMap })),
    { ssr: false, loading: () => <div className="w-full rounded-xl bg-muted animate-pulse" style={{ height: 220 }} /> }
)

const categories = [
    { id: "nature_outdoors", name: "Outdoors & Nature", color: "bg-emerald-500", icon: "🌿" },
    { id: "food_hunger", name: "Food & Hunger Relief", color: "bg-orange-500", icon: "🍱" },
    { id: "animal_welfare", name: "Animals & Rescue", color: "bg-amber-500", icon: "🐾" },
    { id: "elderly_care", name: "Elderly Care", color: "bg-purple-500", icon: "🤝" },
    { id: "education_mentoring", name: "Kids & Learning", color: "bg-blue-500", icon: "📚" },
    { id: "health_medical", name: "Health & Medical", color: "bg-red-500", icon: "❤️" },
    { id: "art_culture", name: "Art, Culture & Heritage", color: "bg-pink-500", icon: "🎨" },
    { id: "civic_community", name: "Community & Civic", color: "bg-cyan-500", icon: "🏘️" },
    { id: "women_empowerment", name: "Women & Safety", color: "bg-rose-500", icon: "💪" },
    { id: "youth_sports", name: "Youth & Sports", color: "bg-lime-500", icon: "⚽" },
    { id: "mental_wellness", name: "Mental Health & Wellness", color: "bg-indigo-500", icon: "🧠" },
    { id: "donation_drives", name: "Donations & Drives", color: "bg-yellow-500", icon: "🎁" },
]

export function CreateEventPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isUrgent, setIsUrgent] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [limitVolunteers, setLimitVolunteers] = useState(false);
    const [isPaidEvent, setIsPaidEvent] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const searchContainerRef = useRef<HTMLDivElement>(null)
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>()
    const mapCenterRef = useRef({ lng: 73.7898, lat: 19.9975 })

    const [formData, setFormData] = useState({
        title: '',
        description: '', // UI Label: The Cause
        category: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        location: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
        dressCode: '',
        thingsToBring: '',
        // --- NEW FIELDS ---
        pointOfContact: '',
        connectPlan: '',
        // ------------------
        totalSlots: 0,
        registrationDeadline: '',
        minimumAge: undefined as number | undefined,
        ticketPriceRupees: undefined as number | undefined,
    });

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser")
            return
        }
        setGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                try {
                    const { label } = await api.reverseGeocodeLocation(latitude, longitude)
                    const address = label || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                    setFormData(prev => ({ ...prev, location: address, latitude, longitude }))
                    mapCenterRef.current = { lng: longitude, lat: latitude }
                } catch {
                    setFormData(prev => ({ ...prev, location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, latitude, longitude }))
                } finally {
                    setGettingLocation(false)
                }
            },
            () => {
                setGettingLocation(false)
                toast.error("Location access denied. Please enable location in your browser settings.")
            }
        )
    }

    const handleSearchChange = (value: string) => {
        setFormData(prev => ({ ...prev, location: value }))
        clearTimeout(searchDebounceRef.current)
        if (value.length < 2) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }
        searchDebounceRef.current = setTimeout(async () => {
            setSearchLoading(true)
            try {
                const { lng, lat } = mapCenterRef.current
                const { suggestions } = await api.searchLocations(value, lat, lng)
                setSuggestions(suggestions)
                setShowSuggestions(true)
                setHighlightedIndex(-1)
            } catch {
                toast.error("Location search unavailable. Please drag the pin manually.")
            } finally {
                setSearchLoading(false)
            }
        }, 300)
    }

    const handleSelectSuggestion = (suggestion: { label: string; lat: number; lng: number }) => {
        const { label, lat, lng } = suggestion
        setFormData(prev => ({ ...prev, location: label, latitude: lat, longitude: lng }))
        mapCenterRef.current = { lng, lat }
        setSuggestions([])
        setShowSuggestions(false)
        setHighlightedIndex(-1)
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Escape') setShowSuggestions(false)
            return
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightedIndex(prev => Math.max(prev - 1, -1))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const target = highlightedIndex >= 0 ? suggestions[highlightedIndex] : suggestions[0]
            if (target) handleSelectSuggestion(target)
        } else if (e.key === 'Escape') {
            setShowSuggestions(false)
            setHighlightedIndex(-1)
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handlePublish = async () => {
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            // Validate required fields
            if (!formData.title || !formData.description || !formData.category) {
                alert('Please fill in all required fields in Step 1');
                return;
            }

            if (!formData.eventDate || !formData.startTime || !formData.endTime || !formData.location) {
                alert('Please complete schedule and location details in Step 2');
                return;
            }

            // New validation for Contact
            if (!formData.pointOfContact) {
                alert('Please provide a Point of Contact in Step 3');
                return;
            }

            if (limitVolunteers && (!formData.totalSlots || formData.totalSlots < 1)) {
                alert('Please set a valid volunteer slot count, or turn off the limit');
                return;
            }

            if (!formData.registrationDeadline) {
                alert('Please set a registration deadline');
                return;
            }

            if (isPaidEvent && (!formData.ticketPriceRupees || formData.ticketPriceRupees < 1)) {
                alert('Please set a valid ticket price, or turn off "Paid Event"');
                return;
            }

            const eventStartDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
            const eventEndDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
            const regDeadline = new Date(formData.registrationDeadline);
            
            if (eventEndDateTime <= eventStartDateTime) {
                alert('Event end time must be after start time');
                return;
            }

            if (regDeadline < new Date()) {
                alert('Registration deadline cannot be in the past');
                return;
            }

            const oneHourBeforeStart = new Date(eventStartDateTime.getTime() - 60 * 60 * 1000);
            
            if (regDeadline > oneHourBeforeStart) {
                alert('Registration deadline must be at least 1 hour before the event starts.');
                return;
            }

            let coverUrl = coverImageUrl;
            if (coverImage) {
                setUploading(true);
                try {
                    coverUrl = await api.uploadEventImage(coverImage);
                } catch (error: any) {
                    alert(error.message || 'Failed to upload image');
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            const deadlineISO = new Date(formData.registrationDeadline).toISOString();

            await api.createEvent({
                title: formData.title,
                description: formData.description,
                coverImageUrl: coverUrl,
                category: formData.category,
                isUrgent,
                eventDate: formData.eventDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                location: formData.location,
                dressCode: formData.dressCode,
                thingsToBring: formData.thingsToBring,
                pointOfContact: formData.pointOfContact,
                connectPlan: formData.connectPlan,
                totalSlots: limitVolunteers ? formData.totalSlots : null,
                registrationDeadline: deadlineISO,
                minimumAge: formData.minimumAge,
                latitude: formData.latitude,
                longitude: formData.longitude,
                ticketPrice: isPaidEvent && formData.ticketPriceRupees ? Math.round(formData.ticketPriceRupees * 100) : null,
            });

            setShowSuccess(true);
        } catch (error: any) {
            alert(error.message || 'Failed to submit event for approval');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderEventPreview = () => (
        <div className="p-4 md:p-6 bg-emerald-50/50 dark:bg-emerald-500/[0.07] backdrop-blur-xl rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
            <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Event Preview</p>
            </div>
            <div className="bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md rounded-xl p-4 shadow-sm border border-black/5 dark:border-white/10">
                {coverImageUrl ? (
                    <div className="aspect-video rounded-lg mb-3 overflow-hidden">
                        <img src={coverImageUrl} alt="Event cover" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="aspect-video bg-gradient-to-br from-muted to-border rounded-lg mb-3 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                )}

                <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">
                    {formData.title || 'Event Title'}
                </h3>

                {formData.category && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full mb-3">
                        <span className="text-xs">
                            {categories.find(c => c.id === formData.category)?.icon}
                        </span>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            {categories.find(c => c.id === formData.category)?.name}
                        </span>
                    </div>
                )}

                <div className="space-y-1.5 mb-3">
                    {formData.eventDate && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>
                                {new Date(formData.eventDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                                {formData.startTime && ` • ${formData.startTime}`}
                            </span>
                        </div>
                    )}
                    {formData.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="line-clamp-1">{formData.location}</span>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {limitVolunteers && formData.totalSlots > 0
                                ? `0/${formData.totalSlots} Registered`
                                : '0 Registered'}
                        </span>
                        {limitVolunteers && formData.totalSlots > 0
                            ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">0%</span>
                            : <span className="font-semibold text-emerald-600 dark:text-emerald-400">Unlimited</span>}
                    </div>
                    {limitVolunteers && formData.totalSlots > 0 && (
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: '0%' }} />
                        </div>
                    )}
                </div>

                {isUrgent && (
                    <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 rounded-lg w-fit">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Urgent</span>
                    </div>
                )}
            </div>
        </div>
    )

    if (showSuccess) {
        const successOrnaments = [
            { icon: Sparkles, color: "text-amber-500", pos: "top-8 left-8 md:top-16 md:left-24", delay: 0 },
            { icon: Heart, color: "text-[#ff6b6b]", pos: "top-12 right-8 md:top-20 md:right-32", delay: 0.6 },
            { icon: Users, color: "text-emerald-500", pos: "bottom-20 left-8 md:bottom-24 md:left-32", delay: 1.2 },
            { icon: Calendar, color: "text-blue-500", pos: "bottom-16 right-8 md:bottom-20 md:right-24", delay: 1.8 },
        ]
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-black flex items-center justify-center p-4 overflow-hidden relative">
                <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-400/[0.12] dark:from-emerald-400/[0.1] to-transparent blur-3xl" />

                {successOrnaments.map(({ icon: Icon, color, pos, delay }, i) => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
                        className={cn("absolute w-10 h-10 md:w-14 md:h-14 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-lg shadow-neutral-200/40 dark:shadow-black/40 flex items-center justify-center", pos)}
                    >
                        <Icon className={cn("w-5 h-5 md:w-6 md:h-6", color)} />
                    </motion.div>
                ))}

                <ScrollReveal className="relative text-center max-w-lg">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                        <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">Event Submitted!</h1>
                    <p className="text-muted-foreground text-sm md:text-base mb-8">
                        Your event has been submitted for review. Our team will verify the details and may suggest an exciting post-event activity to help volunteers connect before making it live!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/org-events"
                            className="px-6 py-3 bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white rounded-xl font-semibold hover:scale-105 transition-all"
                        >
                            View Pending Events
                        </Link>
                        <Link
                            href="/org-home"
                            className="px-6 py-3 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl text-foreground rounded-xl font-semibold border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </ScrollReveal>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black overflow-x-hidden relative">
            <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#ff6b6b]/[0.1] dark:from-[#ff6b6b]/[0.08] to-transparent blur-3xl" />

            {[
                { icon: Heart, color: "text-rose-400", pos: "top-20 left-4 md:left-12", delay: 0 },
                { icon: Sparkles, color: "text-amber-400", pos: "top-32 right-4 md:right-16", delay: 0.6 },
                { icon: Building2, color: "text-blue-400", pos: "bottom-32 left-4 md:left-16", delay: 1.2 },
                { icon: Users, color: "text-emerald-400", pos: "bottom-20 right-4 md:right-12", delay: 1.8 },
            ].map(({ icon: Icon, color, pos, delay }, i) => (
                <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
                    className={cn("fixed w-10 h-10 md:w-12 md:h-12 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-lg shadow-neutral-200/40 dark:shadow-black/40 flex items-center justify-center z-10 opacity-60", pos)}
                >
                    <Icon className={cn("w-5 h-5", color)} />
                </motion.div>
            ))}

            <header className="sticky top-0 z-50 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
                <div className="max-w-5xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                    <Link
                        href="/org-events"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:inline">Back to Events</span>
                    </Link>
                    <h1 className="text-base md:text-lg font-semibold text-foreground">Create Event</h1>
                    <div className="w-20" />
                </div>
            </header>

            <div className="relative bg-white/50 dark:bg-neutral-900/30 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-2">
                        {[
                            { num: 1, label: "Details" },
                            { num: 2, label: "Schedule" },
                            { num: 3, label: "Logistics" },
                        ].map((s, i) => (
                            <div key={s.num} className="flex items-center flex-1">
                                <div className="flex items-center gap-2 flex-1">
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                                            step >= s.num
                                                ? "bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] text-white shadow-md shadow-[#ff6b6b]/20"
                                                : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xs md:text-sm font-semibold hidden sm:inline",
                                            step >= s.num ? "text-foreground" : "text-muted-foreground",
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div
                                        className={cn(
                                            "h-0.5 flex-1 mx-2 rounded-full transition-all",
                                            step > s.num ? "bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a]" : "bg-border",
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <main className="relative max-w-5xl mx-auto px-4 py-6 md:py-10">
              <div className="md:grid md:grid-cols-5 md:gap-8">
                <div className="md:col-span-3">
                {step === 1 && (
                    <ScrollReveal className="space-y-6 md:space-y-8">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">Cover Image</label>
                            <div className="aspect-video bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border-2 border-dashed border-black/10 dark:border-white/15 hover:border-[#ff6b6b] transition-colors cursor-pointer flex flex-col items-center justify-center group">
                                <input
                                    type="file"
                                    id="coverImage"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 2 * 1024 * 1024) { 
                                                alert("File size exceeds 2MB limit. Please upload a smaller image.");
                                                return;
                                            }
                                            setCoverImage(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setCoverImageUrl(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <label htmlFor="coverImage" className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                                    {coverImageUrl ? (
                                        <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-card rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                                <ImageIcon className="w-8 h-8 text-[#ff6b6b]" />
                                            </div>
                                            <p className="text-foreground font-medium">
                                                {uploading ? 'Uploading...' : 'Click to upload cover image'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">16:9 ratio recommended • PNG, JPG up to 2MB</p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">Event Title</label>
                            <input
                                type="text"
                                placeholder="Give your event a catchy name"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">Category</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFormData({ ...formData, category: cat.id })}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.02] active:scale-[0.98]",
                                            formData.category === cat.id
                                                ? "border-[#ff6b6b] bg-[#ff6b6b]/5 dark:bg-[#ff6b6b]/10"
                                                : "border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl hover:border-black/10 dark:hover:border-white/20",
                                        )}
                                    >
                                        <span className="text-2xl mb-2 block">{cat.icon}</span>
                                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 dark:from-amber-500/10 to-orange-50 dark:to-orange-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Mark as Urgent</p>
                                    <p className="text-xs text-muted-foreground">Highlight this event for immediate action</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsUrgent(!isUrgent)}
                                className={cn(
                                    "w-12 h-7 rounded-full transition-all relative",
                                    isUrgent ? "bg-amber-500" : "bg-border",
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all",
                                        isUrgent ? "right-1" : "left-1",
                                    )}
                                />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">The Cause (Description)</label>
                            <p className="text-xs text-muted-foreground mb-3">Why are you doing this? What impact will volunteers have?</p>
                            <textarea
                                placeholder="Share the story behind this event..."
                                rows={5}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all resize-none text-sm md:text-base"
                            />
                        </div>
                    </ScrollReveal>
                )}

                {step === 2 && (
                    <ScrollReveal className="space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Calendar className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                    Event Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.eventDate}
                                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                    className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Clock className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                <Clock className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                End Time
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                <MapPin className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                Exact Location
                            </label>
                            
                            <div ref={searchContainerRef} className="relative mb-3">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        {searchLoading
                                            ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ff6b6b] animate-spin" />
                                            : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        }
                                        <input
                                            type="text"
                                            placeholder="Enter specific venue, building, or street address"
                                            value={formData.location}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            onKeyDown={handleSearchKeyDown}
                                            className="w-full h-12 px-4 pl-10 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={handleGetCurrentLocation}
                                        disabled={gettingLocation}
                                        className="h-12 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                                        title="Use my current location"
                                    >
                                        <Navigation className={`w-4 h-4 text-[#ff6b6b] ${gettingLocation ? 'animate-spin' : ''}`} />
                                        <span className="hidden sm:inline text-sm font-medium text-foreground">Locate Me</span>
                                    </button>
                                </div>
                                {showSuggestions && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-xl shadow-lg border border-black/5 dark:border-white/10 z-[1000] max-h-60 overflow-y-auto">
                                        {suggestions.length === 0 ? (
                                            <div className="px-4 py-3 text-sm text-muted-foreground">No locations found. Try a different search term.</div>
                                        ) : (
                                            suggestions.map((suggestion, i) => {
                                                const [primary, ...rest] = suggestion.label.split(', ')
                                                const secondary = rest.join(', ')
                                                return (
                                                    <button
                                                        key={`${suggestion.lat},${suggestion.lng},${i}`}
                                                        onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(suggestion) }}
                                                        className={`w-full px-4 py-3 text-left flex flex-col gap-0.5 transition-colors ${i === highlightedIndex ? 'bg-[#ff6b6b]/10' : 'hover:bg-black/5 dark:hover:bg-white/5'} ${i > 0 ? 'border-t border-black/5 dark:border-white/10' : ''}`}
                                                    >
                                                        <span className="text-sm font-medium text-foreground truncate">{primary}</span>
                                                        <span className="text-xs text-muted-foreground truncate">{secondary}</span>
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                )}
                            </div>

                            <LocationPickerMap
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onCoordinatesChange={(lat, lng) =>
                                    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
                                }
                                onCenterChange={(lat, lng) => {
                                    mapCenterRef.current = { lng, lat }
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Dress Code
                                    <span className="text-xs text-muted-foreground font-normal ml-2">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Comfortable clothes"
                                    value={formData.dressCode}
                                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                                    className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Things to Bring
                                    <span className="text-xs text-muted-foreground font-normal ml-2">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Water bottle, gloves"
                                    value={formData.thingsToBring}
                                    onChange={(e) => setFormData({ ...formData, thingsToBring: e.target.value })}
                                    className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                                />
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {step === 3 && (
                    <ScrollReveal className="space-y-6 md:space-y-8">

                        {/* --- THE NEW CLUB FIELDS YOU WERE MISSING! --- */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">
                                Point of Contact
                            </label>
                            <p className="text-xs text-muted-foreground mb-3">Who should volunteers look for or call when they arrive?</p>
                            <input
                                type="text"
                                placeholder="e.g., Rahul Verma (9876543210)"
                                value={formData.pointOfContact}
                                onChange={(e) => setFormData({ ...formData, pointOfContact: e.target.value })}
                                className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">
                                The After
                                <span className="text-xs text-muted-foreground font-normal ml-2">(Optional)</span>
                            </label>
                            <p className="text-xs text-muted-foreground mb-3">What's the after-event hangout? Chai? Walk? Breakfast together? If blank, our team may suggest one.</p>
                            <input
                                type="text"
                                placeholder="e.g., Grabbing breakfast at Roastery Coffee after!"
                                value={formData.connectPlan}
                                onChange={(e) => setFormData({ ...formData, connectPlan: e.target.value })}
                                className="w-full h-12 md:h-14 px-4 bg-emerald-50/50 dark:bg-emerald-500/[0.07] backdrop-blur-xl rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm md:text-base border border-emerald-200 dark:border-emerald-500/20"
                            />
                        </div>

                        <hr className="border-black/5 dark:border-white/10 my-6" />
                        {/* --------------------------------------------- */}

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#ff6b6b]" />
                                    Volunteer Limit
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setLimitVolunteers(v => !v)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${limitVolunteers ? 'bg-[#ff6b6b]' : 'bg-muted'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${limitVolunteers ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {limitVolunteers ? (
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 50"
                                    value={formData.totalSlots || ''}
                                    onKeyDown={(e) => {
                                        if (e.key === '-' || e.key === 'e' || e.key === '.') e.preventDefault();
                                    }}
                                    onChange={(e) => setFormData({ ...formData, totalSlots: parseInt(e.target.value) || 0 as any })}
                                    className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 px-4 py-3">
                                    Unlimited — anyone can register
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4 text-[#ff6b6b]" />
                                    Paid Event
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsPaidEvent(v => !v)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isPaidEvent ? 'bg-[#ff6b6b]' : 'bg-muted'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isPaidEvent ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {isPaidEvent ? (
                                <>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 100"
                                            value={formData.ticketPriceRupees ?? ''}
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                                            }}
                                            onChange={(e) => setFormData({ ...formData, ticketPriceRupees: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            className="w-full h-12 md:h-14 pl-8 pr-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        You'll keep 92% of every ticket sold — KINDLY retains an 8% platform fee to cover payment processing and platform costs. Your payout is calculated automatically once the event is marked complete.
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 px-4 py-3">
                                    Free — anyone can register at no cost
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                <Clock className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                Registration Deadline
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.registrationDeadline}
                                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                min={(() => {
                                    const d = new Date(Date.now() + 60 * 60 * 1000);
                                    const pad = (n: number) => String(n).padStart(2, '0');
                                    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                })()}
                                max={formData.eventDate && formData.startTime ? (() => {
                                    const start = new Date(`${formData.eventDate}T${formData.startTime}`);
                                    const m = new Date(start.getTime() - 60 * 60 * 1000);
                                    const pad = (n: number) => String(n).padStart(2, '0');
                                    return `${m.getFullYear()}-${pad(m.getMonth()+1)}-${pad(m.getDate())}T${pad(m.getHours())}:${pad(m.getMinutes())}`;
                                })() : undefined}
                                className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Must be at least 1 hour before event start time
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                Minimum Age
                                <span className="text-xs text-muted-foreground font-normal ml-2">(Optional)</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                placeholder="18"
                                value={formData.minimumAge || ''}
                                onKeyDown={(e) => {
                                    if (e.key === '-' || e.key === 'e' || e.key === '.') e.preventDefault();
                                }}
                                onChange={(e) => setFormData({ ...formData, minimumAge: parseInt(e.target.value) || undefined })}
                                className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                            />
                        </div>

                        {/* Preview also inline on mobile — the sidebar version below is desktop-only */}
                        <div className="md:hidden">{renderEventPreview()}</div>
                    </ScrollReveal>
                )}
                </div>

                {/* Persistent live preview — desktop-only bento sidebar, visible from
                    Step 1 onward so the event visibly comes together as fields fill in. */}
                <div className="hidden md:block md:col-span-2">
                    <div className="sticky top-24">
                        <ScrollReveal delay={0.1}>{renderEventPreview()}</ScrollReveal>
                    </div>
                </div>
              </div>
            </main>

            <footer className="sticky bottom-0 z-40 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border-t border-black/5 dark:border-white/10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 md:flex-none md:px-8 h-12 md:h-14 bg-black/5 dark:bg-white/10 text-foreground rounded-xl font-semibold hover:bg-black/10 dark:hover:bg-white/15 transition-colors text-sm md:text-base"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (step < 3) setStep(step + 1)
                            else handlePublish()
                        }}
                        disabled={isSubmitting}
                        className="flex-1 h-12 md:h-14 bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white rounded-xl font-semibold hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ease-out shadow-lg shadow-[#ff6b6b]/20 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : step === 3 ? "Submit for Approval" : "Continue"}
                    </button>
                </div>
            </footer>
        </div>
    )
}