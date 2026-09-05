"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
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
    IndianRupee,
    AlertCircle,
    X
} from "lucide-react"
import { cn, coverObjectPosition, eventHours, formatHours, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CoverFocalPointPicker, type FocalPoint } from "@/components/cover-focal-point-picker"

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

const STEP_LABELS: Record<number, string> = { 1: "Details", 2: "Schedule", 3: "Logistics" }

// An end time earlier than the start means the event runs past midnight —
// eventHours() already wraps it. Cap the wrap so a typo (or a deliberate
// 14:00→13:00) can't book itself 23 hours of volunteer impact.
export const MAX_OVERNIGHT_HOURS = 12

/** Parses a date+time as India time, matching the backend's hardcoded +05:30. */
function istDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00+05:30`)
}

/** Red asterisk marking a field the form won't submit without. */
function Req() {
    return <span className="text-[#ff6b6b] ml-0.5" aria-hidden="true">*</span>
}

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null
    return (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-[#ff6b6b] mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            {msg}
        </p>
    )
}

interface CreateEventPageProps {
    // When set, this form is being used by an admin creating an event on
    // behalf of the given org (picked from an org picker) rather than the
    // normal self-service org flow — see frontend/app/admin/create-event.
    adminOrg?: { id: string; name: string }
}

export function CreateEventPage({ adminOrg }: CreateEventPageProps = {}) {
    const [step, setStep] = useState(1)
    const [isUrgent, setIsUrgent] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    // Local object-URL for preview vs. the uploaded remote URL are separate
    // concerns: the preview must never be a base64 data-URL (a 25MB photo
    // becomes a ~33MB string held in state and in the DOM).
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [coverUploadedUrl, setCoverUploadedUrl] = useState<string>('');
    const coverInputRef = useRef<HTMLInputElement>(null);
    const [coverFocal, setCoverFocal] = useState<FocalPoint>({ x: 50, y: 50 });
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
    const skipScrollTopRef = useRef(false)

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

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Autosaved draft. Keyed per-org so an admin filling one org's form can't
    // resurface it while creating for another. The cover photo is deliberately
    // excluded — it lives as a File/data-URL and would blow the storage quota.
    const draftKey = `kindly:create-event-draft${adminOrg ? `:admin:${adminOrg.id}` : ''}`
    const [pendingDraft, setPendingDraft] = useState<{ savedAt: number; data: any } | null>(null);
    const [draftChecked, setDraftChecked] = useState(false);

    // Every field edit clears that field's error, so a message never lingers
    // after the user has already fixed what it was complaining about.
    const update = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
    }

    const validateStep = (s: number): Record<string, string> => {
        const e: Record<string, string> = {}

        if (s === 1) {
            if (!formData.title.trim()) e.title = 'Give your event a name.'
            if (!formData.category) e.category = 'Pick the category that fits best.'
            if (!formData.description.trim()) e.description = 'Tell volunteers why this event matters.'
        }

        if (s === 2) {
            if (!formData.eventDate) e.eventDate = 'Pick the date this event happens.'
            if (!formData.startTime) e.startTime = 'Set a start time.'
            if (!formData.endTime) e.endTime = 'Set an end time.'
            if (formData.startTime && formData.endTime) {
                if (formData.startTime === formData.endTime) {
                    e.endTime = 'Start and end time can’t be the same.'
                } else if (formData.endTime < formData.startTime && eventHours(formData.startTime, formData.endTime) > MAX_OVERNIGHT_HOURS) {
                    e.endTime = `An event running past midnight can be at most ${MAX_OVERNIGHT_HOURS} hours. Check the start and end times.`
                }
            }
            if (!formData.location.trim()) e.location = 'Add the venue or address volunteers should go to.'
        }

        if (s === 3) {
            if (!formData.pointOfContact.trim()) {
                e.pointOfContact = 'Volunteers need a name to ask for when they arrive.'
            }
            if (limitVolunteers && (!formData.totalSlots || formData.totalSlots < 1)) {
                e.totalSlots = 'Enter how many volunteers you can take, or turn the limit off.'
            }
            if (isPaidEvent && (!formData.ticketPriceRupees || formData.ticketPriceRupees < 1)) {
                e.ticketPriceRupees = 'Enter a price of ₹1 or more, or turn Paid Event off.'
            }
            if (!formData.registrationDeadline) {
                e.registrationDeadline = 'Set the last moment volunteers can sign up.'
            } else {
                const deadline = new Date(formData.registrationDeadline)
                if (deadline < new Date()) {
                    e.registrationDeadline = 'This deadline is already in the past.'
                } else if (formData.eventDate && formData.startTime) {
                    const start = new Date(`${formData.eventDate}T${formData.startTime}`)
                    if (deadline > new Date(start.getTime() - 60 * 60 * 1000)) {
                        e.registrationDeadline = 'Must be at least 1 hour before the event starts.'
                    }
                }
            }
        }

        return e
    }

    // Moves the user to the thing that's wrong instead of just naming it.
    const revealField = (field: string) => {
        requestAnimationFrame(() => {
            const container = document.querySelector<HTMLElement>(`[data-field="${field}"]`)
            if (!container) return
            container.scrollIntoView({ block: 'center', behavior: 'smooth' })
            container.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true })
        })
    }

    const handleContinue = () => {
        const stepErrors = validateStep(step)
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors)
            revealField(Object.keys(stepErrors)[0])
            return
        }
        setErrors({})
        setStep(step + 1)
    }

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
                    setErrors(prev => (prev.location ? { ...prev, location: '' } : prev))
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
        update('location', value)
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
        setErrors(prev => (prev.location ? { ...prev, location: '' } : prev))
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

    // A step change swaps the whole form body, so it has to read like a new
    // page: start at the top instead of inheriting the previous step's scroll
    // position, which drops the user into the middle of fields they never saw.
    // ...unless we're jumping back to a step specifically to show a bad field,
    // in which case revealField owns the scroll position.
    useEffect(() => {
        if (skipScrollTopRef.current) {
            skipScrollTopRef.current = false
            return
        }
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }, [step, showSuccess])

    useEffect(() => {
        try {
            const raw = localStorage.getItem(draftKey)
            const parsed = raw ? JSON.parse(raw) : null
            if (parsed?.v === 1 && parsed.data) {
                setPendingDraft({ savedAt: parsed.savedAt, data: parsed.data })
            }
        } catch { /* private mode / corrupt entry — just start fresh */ }
        setDraftChecked(true)
    }, [draftKey])

    // Only ever persist a form the user has actually put something into, and
    // never while the resume prompt is up — that would overwrite the very
    // draft being offered with the empty form sitting behind it.
    const hasContent =
        Object.values(formData).some(v => v !== '' && v !== undefined && v !== 0) ||
        isUrgent || limitVolunteers || isPaidEvent

    useEffect(() => {
        if (!draftChecked || pendingDraft || showSuccess || !hasContent) return
        try {
            localStorage.setItem(draftKey, JSON.stringify({
                v: 1,
                savedAt: Date.now(),
                data: { formData, isUrgent, limitVolunteers, isPaidEvent, coverFocal, step },
            }))
        } catch { /* quota/private mode — autosave is best-effort */ }
    }, [formData, isUrgent, limitVolunteers, isPaidEvent, coverFocal, step, draftChecked, pendingDraft, showSuccess, hasContent, draftKey])

    // Object URLs leak until revoked.
    useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview) }, [coverPreview])

    const clearCover = () => {
        setCoverPreview('')
        setCoverUploadedUrl('')
        setCoverFocal({ x: 50, y: 50 })
        // Without this, re-picking the same file fires no change event.
        if (coverInputRef.current) coverInputRef.current.value = ''
    }

    // Uploading as soon as the photo is picked means the wait happens while the
    // org is still filling in Steps 2-3, instead of stalling the Submit click.
    const handleCoverSelect = async (file: File) => {
        if (file.size > MAX_UPLOAD_BYTES) {
            toast.error(`Image is too large. Please pick a file under ${MAX_UPLOAD_MB}MB.`)
            return
        }
        setCoverPreview(URL.createObjectURL(file))
        setCoverUploadedUrl('')
        setCoverFocal({ x: 50, y: 50 })
        setUploading(true)
        try {
            setCoverUploadedUrl(await api.uploadEventImage(file))
        } catch (err: any) {
            toast.error(err.message || 'Could not upload that image. Please try again.')
            clearCover()
        } finally {
            setUploading(false)
        }
    }

    const discardDraft = () => {
        try { localStorage.removeItem(draftKey) } catch { /* nothing to clean up */ }
    }

    const resumeDraft = () => {
        if (!pendingDraft) return
        const d = pendingDraft.data
        setFormData(prev => ({ ...prev, ...d.formData }))
        setIsUrgent(!!d.isUrgent)
        setLimitVolunteers(!!d.limitVolunteers)
        setIsPaidEvent(!!d.isPaidEvent)
        if (d.coverFocal) setCoverFocal(d.coverFocal)
        if (d.formData?.latitude != null && d.formData?.longitude != null) {
            mapCenterRef.current = { lng: d.formData.longitude, lat: d.formData.latitude }
        }
        setStep(d.step ?? 1)
        setPendingDraft(null)
        toast.success('Draft restored')
    }

    const handlePublish = async () => {
        if (isSubmitting) return;

        if (uploading) {
            toast.error('Your cover photo is still uploading — one moment.');
            return;
        }

        // Re-check every step, not just the one on screen — a field can be
        // emptied after it was validated. Land the user on the earliest step
        // that's wrong, with the offending field focused.
        for (const s of [1, 2, 3]) {
            const stepErrors = validateStep(s);
            if (Object.keys(stepErrors).length > 0) {
                // Only arm the flag on a real step change — setStep to the step
                // we're already on fires no effect, and the flag would then eat
                // the scroll-to-top of whatever navigation came next.
                if (s !== step) skipScrollTopRef.current = true;
                setStep(s);
                setErrors(stepErrors);
                toast.error(`Something needs fixing in ${STEP_LABELS[s]}`);
                revealField(Object.keys(stepErrors)[0]);
                return;
            }
        }

        try {
            setIsSubmitting(true);
            setErrors({});

            const deadlineISO = new Date(formData.registrationDeadline).toISOString();

            const payload = {
                title: formData.title,
                description: formData.description,
                coverImageUrl: coverUploadedUrl || undefined,
                coverFocalX: coverFocal.x,
                coverFocalY: coverFocal.y,
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
            };

            if (adminOrg) {
                await api.adminCreateEvent(adminOrg.id, payload);
            } else {
                await api.createEvent(payload);
            }

            discardDraft();
            setShowSuccess(true);
        } catch (error: any) {
            toast.error(error.message || (adminOrg ? 'Failed to create event' : 'Failed to submit event for approval'));
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
                {coverPreview ? (
                    <div className="aspect-video rounded-lg mb-3 overflow-hidden">
                        <img
                            src={coverPreview}
                            alt="Event cover"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: coverObjectPosition(coverFocal.x, coverFocal.y) }}
                        />
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
                    <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                        {adminOrg ? "Event Published!" : "Event Submitted!"}
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base mb-8">
                        {adminOrg
                            ? `The event is live for ${adminOrg.name} — no further approval needed.`
                            : "Your event has been submitted for review. Our team will verify the details and may suggest an exciting post-event activity to help volunteers connect before making it live!"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {adminOrg ? (
                            <>
                                <Link
                                    href={`/admin/organizations/${adminOrg.id}`}
                                    className="px-6 py-3 bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white rounded-xl font-semibold hover:scale-105 transition-all"
                                >
                                    Back to Organization
                                </Link>
                                <Link
                                    href="/admin/events"
                                    className="px-6 py-3 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl text-foreground rounded-xl font-semibold border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    View All Events
                                </Link>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
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
                        href={adminOrg ? "/admin/create-event" : "/org-events"}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:inline">{adminOrg ? "Change Org" : "Back to Events"}</span>
                    </Link>
                    <h1 className="text-base md:text-lg font-semibold text-foreground">
                        {adminOrg ? `Create Event for ${adminOrg.name}` : "Create Event"}
                    </h1>
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
              {pendingDraft && (
                <div className="mb-5 md:mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">You have an unfinished event</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Saved {new Date(pendingDraft.savedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · the cover photo isn&apos;t part of a draft
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={resumeDraft}
                      className="px-4 h-10 rounded-xl bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white text-sm font-semibold transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => { discardDraft(); setPendingDraft(null) }}
                      className="px-4 h-10 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-foreground text-sm font-semibold transition-colors"
                    >
                      Start fresh
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mb-5 md:mb-6">
                Fields marked <Req /> are required.
              </p>
              <div className="md:grid md:grid-cols-5 md:gap-8">
                <div className="md:col-span-3">
                {step === 1 && (
                    <ScrollReveal className="space-y-6 md:space-y-8">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                Cover Image
                                <span className="text-xs text-muted-foreground font-normal ml-2">(Optional)</span>
                            </label>
                            <div className="relative aspect-video bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border-2 border-dashed border-black/10 dark:border-white/15 hover:border-[#ff6b6b] transition-colors flex flex-col items-center justify-center group">
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    id="coverImage"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleCoverSelect(file)
                                    }}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <label htmlFor="coverImage" className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                                    {coverPreview ? (
                                        <img
                                            src={coverPreview}
                                            alt="Cover preview"
                                            className="w-full h-full object-cover rounded-2xl"
                                            style={{ objectPosition: coverObjectPosition(coverFocal.x, coverFocal.y) }}
                                        />
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-card rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                                <ImageIcon className="w-8 h-8 text-[#ff6b6b]" />
                                            </div>
                                            <p className="text-foreground font-medium">Click to upload cover image</p>
                                            <p className="text-xs text-muted-foreground mt-1">16:9 ratio recommended • PNG, JPG up to {MAX_UPLOAD_MB}MB</p>
                                        </>
                                    )}
                                </label>

                                {coverPreview && !uploading && (
                                    <button
                                        type="button"
                                        onClick={clearCover}
                                        aria-label="Remove cover image"
                                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}

                                {uploading && (
                                    <div className="absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-white">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <p className="text-sm font-semibold">Uploading photo…</p>
                                    </div>
                                )}
                            </div>
                            {coverPreview && !uploading && coverUploadedUrl && (
                                <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Photo uploaded — you won&apos;t wait for it when you submit.
                                </p>
                            )}
                            {coverPreview && (
                                <div className="mt-4 p-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10">
                                    <CoverFocalPointPicker imageUrl={coverPreview} value={coverFocal} onChange={setCoverFocal} />
                                </div>
                            )}
                        </div>

                        <div data-field="title">
                            <label className="block text-sm font-semibold text-foreground mb-3">Event Title<Req /></label>
                            <input
                                type="text"
                                placeholder="Give your event a catchy name"
                                value={formData.title}
                                onChange={(e) => update('title', e.target.value)}
                                aria-invalid={!!errors.title}
                                className={cn(
                                    "w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base",
                                    errors.title ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                )}
                            />
                            <FieldError msg={errors.title} />
                        </div>

                        <div data-field="category">
                            <label className="block text-sm font-semibold text-foreground mb-3">Category<Req /></label>
                            <div className={cn(
                                "grid grid-cols-2 sm:grid-cols-3 gap-3",
                                errors.category && "ring-2 ring-[#ff6b6b] rounded-xl p-2 -m-2"
                            )}>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => update('category', cat.id)}
                                        aria-pressed={formData.category === cat.id}
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
                            <FieldError msg={errors.category} />
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
                                type="button"
                                role="switch"
                                aria-checked={isUrgent}
                                aria-label="Mark as urgent"
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

                        <div data-field="description">
                            <label className="block text-sm font-semibold text-foreground mb-1">The Cause (Description)<Req /></label>
                            <p className="text-xs text-muted-foreground mb-3">Why are you doing this? What impact will volunteers have?</p>
                            <textarea
                                placeholder="Share the story behind this event..."
                                rows={5}
                                value={formData.description}
                                onChange={(e) => update('description', e.target.value)}
                                aria-invalid={!!errors.description}
                                className={cn(
                                    "w-full px-4 py-3 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all resize-none text-sm md:text-base",
                                    errors.description ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                )}
                            />
                            <FieldError msg={errors.description} />
                        </div>
                    </ScrollReveal>
                )}

                {step === 2 && (
                    <ScrollReveal className="space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div data-field="eventDate">
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Calendar className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                    Event Date<Req />
                                </label>
                                <input
                                    type="date"
                                    value={formData.eventDate}
                                    onChange={(e) => update('eventDate', e.target.value)}
                                    aria-invalid={!!errors.eventDate}
                                    className={cn(
                                        "w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base",
                                        errors.eventDate ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                    )}
                                />
                                <FieldError msg={errors.eventDate} />
                            </div>
                            <div data-field="startTime">
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Clock className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                    Start Time<Req />
                                </label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => update('startTime', e.target.value)}
                                    aria-invalid={!!errors.startTime}
                                    className={cn(
                                        "w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base",
                                        errors.startTime ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                    )}
                                />
                                <FieldError msg={errors.startTime} />
                            </div>
                        </div>

                        <div data-field="endTime">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                <Clock className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                End Time<Req />
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => update('endTime', e.target.value)}
                                aria-invalid={!!errors.endTime}
                                className={cn(
                                    "w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base",
                                    errors.endTime ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                )}
                            />
                            <FieldError msg={errors.endTime} />
                            {formData.startTime && formData.endTime && formData.startTime !== formData.endTime && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Duration: <span className="font-semibold text-foreground">{formatHours(eventHours(formData.startTime, formData.endTime))}</span>
                                    {formData.endTime < formData.startTime && ' — ends the next day'}
                                </p>
                            )}
                        </div>

                        <div data-field="location">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                <MapPin className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                Exact Location<Req />
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
                                            aria-invalid={!!errors.location}
                                            className={cn(
                                                "w-full h-12 px-4 pl-10 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm",
                                                errors.location ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                            )}
                                        />
                                    </div>
                                    <button
                                        type="button"
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
                            <FieldError msg={errors.location} />
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
                                    onChange={(e) => update('dressCode', e.target.value)}
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
                                    onChange={(e) => update('thingsToBring', e.target.value)}
                                    className="w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base"
                                />
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {step === 3 && (
                    <ScrollReveal className="space-y-6 md:space-y-8">

                        {/* --- THE NEW CLUB FIELDS YOU WERE MISSING! --- */}
                        <div data-field="pointOfContact">
                            <label className="block text-sm font-semibold text-foreground mb-1">
                                Point of Contact<Req />
                            </label>
                            <p className="text-xs text-muted-foreground mb-3">Who should volunteers look for or call when they arrive?</p>
                            <input
                                type="text"
                                placeholder="e.g., Rahul Verma (9876543210)"
                                value={formData.pointOfContact}
                                onChange={(e) => update('pointOfContact', e.target.value)}
                                aria-invalid={!!errors.pointOfContact}
                                className={cn(
                                    "w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base",
                                    errors.pointOfContact ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                )}
                            />
                            <FieldError msg={errors.pointOfContact} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1">
                                The After
                                <span className="text-xs text-muted-foreground font-normal ml-2">(Optional)</span>
                            </label>
                            <p className="text-xs text-muted-foreground mb-3">What&apos;s the after-event hangout? Chai? Walk? Breakfast together? If blank, our team may suggest one.</p>
                            <input
                                type="text"
                                placeholder="e.g., Grabbing breakfast at Roastery Coffee after!"
                                value={formData.connectPlan}
                                onChange={(e) => update('connectPlan', e.target.value)}
                                className="w-full h-12 md:h-14 px-4 bg-emerald-50/50 dark:bg-emerald-500/[0.07] backdrop-blur-xl rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm md:text-base border border-emerald-200 dark:border-emerald-500/20"
                            />
                        </div>

                        <hr className="border-black/5 dark:border-white/10 my-6" />
                        {/* --------------------------------------------- */}

                        <div data-field="totalSlots">
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
                                <>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 50"
                                        value={formData.totalSlots || ''}
                                        onKeyDown={(e) => {
                                            if (e.key === '-' || e.key === 'e' || e.key === '.') e.preventDefault();
                                        }}
                                        onChange={(e) => update('totalSlots', parseInt(e.target.value) || 0)}
                                        aria-invalid={!!errors.totalSlots}
                                        className={cn(
                                            "w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base",
                                            errors.totalSlots ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                        )}
                                    />
                                    <FieldError msg={errors.totalSlots} />
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 px-4 py-3">
                                    Unlimited — anyone can register
                                </p>
                            )}
                        </div>

                        <div data-field="ticketPriceRupees">
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
                                            onChange={(e) => update('ticketPriceRupees', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            aria-invalid={!!errors.ticketPriceRupees}
                                            className={cn(
                                                "w-full h-12 md:h-14 pl-8 pr-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base",
                                                errors.ticketPriceRupees ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                            )}
                                        />
                                    </div>
                                    <FieldError msg={errors.ticketPriceRupees} />
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        You&apos;ll keep 92% of every ticket sold — KINDLY retains an 8% platform fee to cover payment processing and platform costs. Your payout is calculated automatically once the event is marked complete.
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border border-black/5 dark:border-white/10 px-4 py-3">
                                    Free — anyone can register at no cost
                                </p>
                            )}
                        </div>

                        <div data-field="registrationDeadline">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                <Clock className="w-4 h-4 inline mr-2 text-[#ff6b6b]" />
                                Registration Deadline<Req />
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.registrationDeadline}
                                onChange={(e) => update('registrationDeadline', e.target.value)}
                                aria-invalid={!!errors.registrationDeadline}
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
                                className={cn(
                                    "w-full h-12 md:h-14 px-4 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl border text-foreground focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all text-sm md:text-base",
                                    errors.registrationDeadline ? "border-[#ff6b6b]" : "border-black/5 dark:border-white/10"
                                )}
                            />
                            <FieldError msg={errors.registrationDeadline} />
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
                                onChange={(e) => update('minimumAge', parseInt(e.target.value) || undefined)}
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

            <footer className="sticky bottom-0 z-[60] bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border-t border-black/5 dark:border-white/10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex gap-3">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="flex-1 md:flex-none md:px-8 h-12 md:h-14 bg-black/5 dark:bg-white/10 text-foreground rounded-xl font-semibold hover:bg-black/10 dark:hover:bg-white/15 transition-colors text-sm md:text-base"
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            if (step < 3) handleContinue()
                            else handlePublish()
                        }}
                        disabled={isSubmitting}
                        className="flex-1 h-12 md:h-14 bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white rounded-xl font-semibold hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ease-out shadow-lg shadow-[#ff6b6b]/20 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {adminOrg ? "Publishing..." : "Submitting..."}
                            </>
                        ) : step === 3 ? (adminOrg ? "Publish Event" : "Submit for Approval") : "Continue"}
                    </button>
                </div>
            </footer>
        </div>
    )
}