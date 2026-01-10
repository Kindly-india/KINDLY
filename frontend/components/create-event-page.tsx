"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
    Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

const categories = [
    { id: "environment", name: "Environment", color: "bg-emerald-500", icon: "🌿" },
    { id: "education", name: "Education", color: "bg-blue-500", icon: "📚" },
    { id: "health", name: "Health", color: "bg-red-500", icon: "❤️" },
    { id: "animals", name: "Animals", color: "bg-amber-500", icon: "🐾" },
    { id: "elderly", name: "Elderly Care", color: "bg-purple-500", icon: "👴" },
    { id: "community", name: "Community", color: "bg-cyan-500", icon: "🏘️" },
]

export function CreateEventPage() {
    const [step, setStep] = useState(1)
    const [isUrgent, setIsUrgent] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false); 

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        location: '',
        dressCode: '',
        thingsToBring: '',
        totalSlots: 50,
        registrationDeadline: '', 
        minimumAge: undefined as number | undefined,
    });

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setGettingLocation(false);
                alert(`Location detected (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Please type the specific building name or street address to confirm on the map.`);
            },
            () => {
                setGettingLocation(false);
                alert("Unable to retrieve your location");
            }
        );
    };

    const handlePublish = async () => {
        try {
            // Validate required fields
            if (!formData.title || !formData.description || !formData.category) {
                alert('Please fill in all required fields');
                return;
            }

            if (!formData.eventDate || !formData.startTime || !formData.endTime || !formData.location) {
                alert('Please complete schedule and location details');
                return;
            }

            if (!formData.totalSlots || formData.totalSlots < 1) {
                alert('Please set valid volunteer slots');
                return;
            }

            // --- Validate Registration Deadline Logic ---
            if (!formData.registrationDeadline) {
                alert('Please set a registration deadline');
                return;
            }

            const eventStartDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);
            const eventEndDateTime = new Date(`${formData.eventDate}T${formData.endTime}`);
            const regDeadline = new Date(formData.registrationDeadline);
            
            // Check: End time after Start time
            if (eventEndDateTime <= eventStartDateTime) {
                alert('Event end time must be after start time');
                return;
            }

            // Check: Deadline in the past
            if (regDeadline < new Date()) {
                alert('Registration deadline cannot be in the past');
                return;
            }

            // Check: Deadline after Event Start (Strict Logic)
            // We enforce at least 1 hour buffer
            const oneHourBeforeStart = new Date(eventStartDateTime.getTime() - 60 * 60 * 1000);
            
            if (regDeadline > oneHourBeforeStart) {
                alert('Registration deadline must be at least 1 hour before the event starts.');
                return;
            }
            // ---

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
                totalSlots: formData.totalSlots,
                registrationDeadline: deadlineISO,
                minimumAge: formData.minimumAge,
            });

            setShowSuccess(true);
        } catch (error: any) {
            alert(error.message || 'Failed to create event');
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#f0f7ff] flex items-center justify-center p-4 overflow-hidden relative">
                <div className="absolute top-8 left-8 md:top-16 md:left-24 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                </div>
                <div className="absolute top-12 right-8 md:top-20 md:right-32 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
                </div>
                <div className="absolute bottom-20 left-8 md:bottom-24 md:left-32 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                </div>
                <div className="absolute bottom-16 right-8 md:bottom-20 md:right-24 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                </div>

                <div className="text-center max-w-md">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-[#1d1d1f] mb-3">Event Published!</h1>
                    <p className="text-[#86868b] text-sm md:text-base mb-8">
                        Your event is now live and visible to volunteers in your area.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/org-events"
                            className="px-6 py-3 bg-[#1d1d1f] text-white rounded-xl font-medium hover:bg-[#424245] transition-colors"
                        >
                            View My Events
                        </Link>
                        <Link
                            href="/org-home"
                            className="px-6 py-3 bg-white text-[#1d1d1f] rounded-xl font-medium border border-[#d2d2d7] hover:bg-[#f5f5f7] transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fef7f0] via-white to-[#f0fdf4] overflow-x-hidden">
            <div className="fixed top-20 left-4 md:left-12 w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center z-10 opacity-60">
                <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <div className="fixed top-32 right-4 md:right-16 w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center z-10 opacity-60">
                <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="fixed bottom-32 left-4 md:left-16 w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center z-10 opacity-60">
                <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="fixed bottom-20 right-4 md:right-12 w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center z-10 opacity-60">
                <Users className="w-5 h-5 text-emerald-400" />
            </div>

            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#f5f5f7]">
                <div className="max-w-3xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
                    <Link
                        href="/org-events"
                        className="flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:inline">Back to Events</span>
                    </Link>
                    <h1 className="text-base md:text-lg font-semibold text-[#1d1d1f]">Create Event</h1>
                    <div className="w-20" />
                </div>
            </header>

            <div className="bg-white border-b border-[#f5f5f7]">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-2">
                        {[
                            { num: 1, label: "Details" },
                            { num: 2, label: "Schedule" },
                            { num: 3, label: "Capacity" },
                        ].map((s, i) => (
                            <div key={s.num} className="flex items-center flex-1">
                                <div className="flex items-center gap-2 flex-1">
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                                            step >= s.num
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                                                : "bg-[#f5f5f7] text-[#86868b]",
                                        )}
                                    >
                                        {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xs md:text-sm font-medium hidden sm:inline",
                                            step >= s.num ? "text-[#1d1d1f]" : "text-[#86868b]",
                                        )}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div
                                        className={cn(
                                            "h-0.5 flex-1 mx-2 rounded-full transition-all",
                                            step > s.num ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-[#e5e5e7]",
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
                {step === 1 && (
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Cover Image</label>
                            <div className="aspect-video bg-gradient-to-br from-[#f0fdf4] to-[#e0f2fe] rounded-2xl border-2 border-dashed border-[#d2d2d7] hover:border-emerald-400 transition-colors cursor-pointer flex flex-col items-center justify-center group">
                                <input
                                    type="file"
                                    id="coverImage"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // 2MB Size Limit
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
                                            <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                                <ImageIcon className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <p className="text-[#1d1d1f] font-medium">
                                                {uploading ? 'Uploading...' : 'Click to upload cover image'}
                                            </p>
                                            <p className="text-xs text-[#86868b] mt-1">16:9 ratio recommended • PNG, JPG up to 2MB</p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Event Title</label>
                            <input
                                type="text"
                                placeholder="Give your event a catchy name"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Category</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFormData({ ...formData, category: cat.id })}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all text-left",
                                            formData.category === cat.id
                                                ? "border-emerald-500 bg-emerald-50"
                                                : "border-[#e5e5e7] bg-white hover:border-[#d2d2d7]",
                                        )}
                                    >
                                        <span className="text-2xl mb-2 block">{cat.icon}</span>
                                        <span className="text-sm font-medium text-[#1d1d1f]">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#1d1d1f]">Mark as Urgent</p>
                                    <p className="text-xs text-[#86868b]">Highlight this event for immediate action</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsUrgent(!isUrgent)}
                                className={cn(
                                    "w-12 h-7 rounded-full transition-all relative",
                                    isUrgent ? "bg-amber-500" : "bg-[#e5e5e7]",
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
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">Description</label>
                            <textarea
                                placeholder="What will volunteers be doing? What's the cause? Share the details..."
                                rows={5}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none text-sm md:text-base"
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                    <Calendar className="w-4 h-4 inline mr-2 text-emerald-500" />
                                    Event Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.eventDate}
                                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                    className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                    <Clock className="w-4 h-4 inline mr-2 text-emerald-500" />
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                <Clock className="w-4 h-4 inline mr-2 text-emerald-500" />
                                End Time
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                            />
                        </div>

                        {/* --- UPDATED PRECISE LOCATION SECTION --- */}
                        <div>
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                <MapPin className="w-4 h-4 inline mr-2 text-emerald-500" />
                                Exact Location
                            </label>
                            
                            <div className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter specific venue, building, or street address"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full h-12 px-4 pl-10 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                                    />
                                </div>
                                <button 
                                    onClick={handleGetCurrentLocation}
                                    disabled={gettingLocation}
                                    className="h-12 px-4 bg-white border border-[#e5e5e7] hover:bg-[#f5f5f7] rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                                    title="Use my current location"
                                >
                                    <Navigation className={`w-4 h-4 text-emerald-600 ${gettingLocation ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline text-sm font-medium text-[#1d1d1f]">Locate Me</span>
                                </button>
                            </div>

                            {/* Map Preview Embed */}
                            <div className="aspect-2/1 bg-[#f5f5f7] rounded-xl overflow-hidden border border-[#e5e5e7] shadow-inner">
                                {formData.location ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: 0 }}
                                        src={`https://www.google.com/maps?q=${encodeURIComponent(formData.location)}&output=embed`}
                                        allowFullScreen
                                        loading="lazy"
                                        className="w-full h-full"
                                    ></iframe>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#f5f5f7] to-[#e5e5e7] flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                                            <MapPin className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-500">Enter a location to verify on map</p>
                                        <p className="text-xs text-gray-400 mt-1">This ensures volunteers find you easily</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                    Dress Code
                                    <span className="text-xs text-[#86868b] font-normal ml-2">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Comfortable clothes"
                                    value={formData.dressCode}
                                    onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                                    className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                    Things to Bring
                                    <span className="text-xs text-[#86868b] font-normal ml-2">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Water bottle, gloves"
                                    value={formData.thingsToBring}
                                    onChange={(e) => setFormData({ ...formData, thingsToBring: e.target.value })}
                                    className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                <Users className="w-4 h-4 inline mr-2 text-emerald-500" />
                                Total Volunteer Slots
                            </label>
                            <input
                                type="number"
                                placeholder="50"
                                value={formData.totalSlots}
                                onChange={(e) => setFormData({ ...formData, totalSlots: parseInt(e.target.value) || 0 })}
                                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                            />
                        </div>

                        {/* --- NEW REGISTRATION DEADLINE SECTION --- */}
                        <div>
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                <Clock className="w-4 h-4 inline mr-2 text-emerald-500" />
                                Registration Deadline
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.registrationDeadline}
                                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                min={new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                                // Add max attribute if date and start time are set
                                max={formData.eventDate && formData.startTime ? `${formData.eventDate}T${formData.startTime}` : undefined}
                                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                            />
                            <p className="text-xs text-[#86868b] mt-2">
                                Must be at least 1 hour before event start time
                            </p>
                        </div>
                        {/* -------------------------------------- */}

                        <div>
                            <label className="block text-sm font-semibold text-[#1d1d1f] mb-3">
                                Minimum Age
                                <span className="text-xs text-[#86868b] font-normal ml-2">(Optional)</span>
                            </label>
                            <input
                                type="number"
                                placeholder="18"
                                value={formData.minimumAge || ''}
                                onChange={(e) => setFormData({ ...formData, minimumAge: parseInt(e.target.value) || undefined })}
                                className="w-full h-12 md:h-14 px-4 bg-[#f5f5f7] rounded-xl border-0 text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm md:text-base"
                            />
                        </div>

                        <div className="p-4 md:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="w-4 h-4 text-emerald-600" />
                                <p className="text-sm font-semibold text-emerald-700">Event Preview</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                {coverImageUrl ? (
                                    <div className="aspect-video rounded-lg mb-3 overflow-hidden">
                                        <img src={coverImageUrl} alt="Event cover" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-gradient-to-br from-[#f5f5f7] to-[#e5e5e7] rounded-lg mb-3 flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}

                                <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                                    {formData.title || 'Event Title'}
                                </h3>

                                {formData.category && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full mb-3">
                                        <span className="text-xs">
                                            {categories.find(c => c.id === formData.category)?.icon}
                                        </span>
                                        <span className="text-xs font-medium text-emerald-700">
                                            {categories.find(c => c.id === formData.category)?.name}
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-1.5 mb-3">
                                    {formData.eventDate && (
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
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
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="line-clamp-1">{formData.location}</span>
                                        </div>
                                    )}
                                </div>

                                {formData.totalSlots > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                0/{formData.totalSlots} Registered
                                            </span>
                                            <span className="font-medium text-emerald-600">0%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: '0%' }} />
                                        </div>
                                    </div>
                                )}

                                {isUrgent && (
                                    <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-amber-100 rounded-lg w-fit">
                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                        <span className="text-xs font-medium text-amber-700">Urgent</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-[#f5f5f7]">
                <div className="max-w-3xl mx-auto px-4 py-4 flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex-1 h-12 md:h-14 bg-[#f5f5f7] text-[#1d1d1f] rounded-xl font-semibold hover:bg-[#e5e5e7] transition-colors text-sm md:text-base"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (step < 3) setStep(step + 1)
                            else handlePublish()
                        }}
                        className="flex-1 h-12 md:h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg text-sm md:text-base"
                    >
                        {step === 3 ? "Publish Event" : "Continue"}
                    </button>
                </div>
            </footer>
        </div>
    )
}