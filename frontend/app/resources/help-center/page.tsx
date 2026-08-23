"use client"

import { useState } from "react"
import { Search, ChevronDown, Mail, MessageCircle, Users, Settings, ShieldCheck, Award, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

type Category = "getting-started" | "volunteers" | "organisations" | "certificates" | "account" | "technical"

interface FAQItem {
  q: string
  a: string
  category: Category
}

const categories: { id: Category; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { id: "getting-started", label: "Getting Started", icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/15" },
  { id: "volunteers", label: "For Volunteers", icon: MessageCircle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-500/15" },
  { id: "organisations", label: "For Organisations", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/15" },
  { id: "certificates", label: "Certificates", icon: Award, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/15" },
  { id: "account", label: "Account & Privacy", icon: Settings, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/15" },
  { id: "technical", label: "Technical Issues", icon: Search, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/15" }
]

const faqs: FAQItem[] = [
  // Getting Started
  { category: "getting-started", q: "How do I create an account on Kindly?", a: "Go to kindly.co.in and click 'Sign Up'. Choose whether you are signing up as a volunteer or an organisation. Enter your email, create a password, and fill in your profile details. The whole process takes under 2 minutes. You can start browsing events immediately after signing up." },
  { category: "getting-started", q: "What is the difference between a volunteer account and an organisation account?", a: "Volunteer accounts are for individuals who want to discover and attend events. Volunteers can browse events, register, check in via QR code, earn certificates, and build a public volunteer profile. Organisation accounts are for NGOs and community groups who want to create events, manage attendance, and access analytics. You must pick one type at signup — they cannot be merged." },
  { category: "getting-started", q: "Is Kindly free to use?", a: "Yes. Kindly is completely free for volunteers. There are no paid features, no premium tiers, and no hidden charges. Organisations can also create and manage events for free during the current phase of the platform." },
  { category: "getting-started", q: "Which cities does Kindly currently support?", a: "Kindly currently operates in Nashik, Mumbai, Pune, Delhi, Bangalore, Chennai, Hyderabad, and Kolkata. If your city is not listed, you can still sign up and browse events in nearby cities. We are actively expanding based on demand." },
  { category: "getting-started", q: "I signed up but I can't log in. What should I do?", a: "First, check that you are using the correct email address you signed up with. Kindly doesn't use passwords — sign in with a one-time code sent to your email, Google Sign-In, or a saved passkey. If you still cannot log in, contact us at team@kindly.co.in and we will resolve it within 24 hours." },

  // Volunteers
  { category: "volunteers", q: "How do I find and register for events?", a: "Log in and go to 'Discover Events' from the volunteer home screen. Browse the event feed or use filters to narrow down by city, date, or cause category. When you find an event you want to attend, tap it to open the event page and click 'Register'. You'll immediately receive a confirmation and the event will appear in your dashboard." },
  { category: "volunteers", q: "What happens when I register for an event?", a: "Your spot is reserved. The event appears under 'My Events' on your dashboard. You can view all event details — date, time, location, point of contact, and what to bring. A day before the event, check your dashboard for the latest information." },
  { category: "volunteers", q: "How does the QR code check-in work?", a: "On event day, open the Kindly app and go to the registered event. Tap 'Scan QR Code' and point your camera at the QR code displayed at the venue. Kindly will verify your location using GPS — you must be within 200 metres of the event venue. Once verified, your attendance is confirmed instantly. You do not need internet at the time of scan as long as the QR code is visible." },
  { category: "volunteers", q: "The QR scanner says I'm too far from the venue. What do I do?", a: "This means our geo-lock system detected that your GPS location is more than 200 metres from the registered event location. First, ensure your phone's location services are turned on and set to 'High Accuracy'. Move closer to the event venue and try again. If you are physically at the venue and still getting the error, contact the event organiser — they can manually check you in from their dashboard." },
  { category: "volunteers", q: "Can I cancel a registration?", a: "Yes. Go to 'My Events', open the event, and tap 'Cancel Registration'. You can cancel any time before the event starts. Please cancel as early as possible so the organisation can offer your spot to another volunteer. Cancellations do not affect your profile or volunteer history." },
  { category: "volunteers", q: "How do I leave a review for an event?", a: "After attending an event and once the organisation marks it complete, go to that event in your history. You will see an option to rate the experience and leave a written review. Reviews help future volunteers choose quality events and motivate organisations to improve." },

  // Organisations
  { category: "organisations", q: "How does the organisation verification process work?", a: "After creating an organisation account, fill out your profile completely — mission, contact details, and organisation type. The Kindly team reviews your profile and verifies you are a legitimate NGO, registered trust, or community group. This usually takes 1–2 business days. Once verified, you can publish events immediately." },
  { category: "organisations", q: "How do I create an event?", a: "From your organisation dashboard, click 'Create Event'. Fill in the event title, cause category, date, time, GPS location, description, maximum volunteers, and any specific requirements. Once submitted, the event goes through a quick review and appears on the discovery feed for volunteers in your city." },
  { category: "organisations", q: "How do I get the QR code for volunteer check-in?", a: "A unique QR code is automatically generated for each event you create. Go to your event dashboard and tap 'View QR Code'. You can download it and print it as a poster or display it on a screen at the venue. You do not need to do anything to activate it — it works from the moment your event is published." },
  { category: "organisations", q: "Can I manually check in a volunteer who can't use the QR scanner?", a: "Yes. From your event dashboard on event day, tap 'Manage Attendance'. You will see a list of all registered volunteers. Tap any volunteer's name and select 'Manual Check-In'. Use this sparingly — the geo-lock QR scan is the preferred method as it creates a verified record." },
  { category: "organisations", q: "How do I complete an event and issue certificates?", a: "After the event, go to your event dashboard and tap 'Complete Event Report'. Confirm the final attendance list, mark absent volunteers if any, and optionally upload a photo gallery. Once you submit the report and mark the event complete, Kindly automatically generates and delivers digital certificates to all attending volunteers. You do not need to send certificates manually." },
  { category: "organisations", q: "Can I edit or cancel a published event?", a: "Yes. You can edit event details at any time from your event dashboard — including date, time, description, and location. If you need to cancel an event, all registered volunteers will be automatically notified. We ask that you give at least 24 hours notice when cancelling." },

  // Certificates
  { category: "certificates", q: "How do I get my certificate?", a: "Certificates are generated automatically once the organisation marks the event as complete. You do not need to request one. Go to your event history, open the attended event, and you will find a 'Download Certificate' button. Certificates are available as PDF files." },
  { category: "certificates", q: "How long does it take to receive my certificate after an event?", a: "Certificates are issued as soon as the organisation completes the event report. Most organisations do this within 24 hours of the event ending. If 48 hours have passed and you still have not received your certificate, contact the organisation directly or reach out to us at team@kindly.co.in." },
  { category: "certificates", q: "What information is on the certificate?", a: "Your Kindly certificate includes your full name, the event name, the organisation's name, the event date, your verified volunteer hours, and a digital signature from the organisation. Each certificate has a unique verification identifier." },
  { category: "certificates", q: "Are Kindly certificates accepted by colleges and employers?", a: "Kindly certificates include geo-verified attendance records, making them more credible than self-reported volunteer hours. Many colleges and employers recognise them for community service credit and resume purposes. We are actively working to formalise partnerships with educational institutions." },
  { category: "certificates", q: "I attended an event but my certificate is missing. What do I do?", a: "First, check that the event appears as 'Completed' in your history — not 'Registered' or 'Upcoming'. If the event is marked complete and your certificate is missing, it may mean the organisation hasn't submitted the event report yet. If it has been more than 48 hours, contact us at team@kindly.co.in with the event name and your registered email." },

  // Account
  { category: "account", q: "How do I update my volunteer profile?", a: "Go to your profile page and tap 'Edit Profile'. You can update your name, city, bio, skills, interests, and social links at any time. Profile changes take effect immediately and are visible to other users on the platform." },
  { category: "account", q: "How do I change my password?", a: "Kindly doesn't use passwords, so there's nothing to change or reset. Sign in anytime with a one-time code sent to your email, Google Sign-In, or a saved passkey." },
  { category: "account", q: "Is my personal information shared with organisations?", a: "When you register for an event, the organisation can see your Kindly profile — which includes your name, city, skills, and past volunteer history. Your email address and phone number are never shared with organisations automatically. Contact details are only shared if you choose to include them in your public profile." },
  { category: "account", q: "Can I delete my account?", a: "Yes. Contact us at team@kindly.co.in from your registered email and request account deletion. We will delete your profile and all personal data within 7 business days, in accordance with applicable data protection laws. Certificates already downloaded will remain valid." },

  // Technical
  { category: "technical", q: "The app is not loading. What should I do?", a: "First, check your internet connection. Try refreshing the page or clearing your browser cache. If the issue persists on mobile, try opening Kindly in a different browser. If you are experiencing issues on a specific page, note the URL and contact us at team@kindly.co.in with a description of what is happening." },
  { category: "technical", q: "The QR scanner is not working on my phone.", a: "The QR scanner requires camera and location permissions. Go to your phone's settings and ensure Kindly (or your browser) has permission to access both the camera and your location. On iOS, permissions can be found under Settings → Privacy. On Android, go to Settings → Apps → Browser → Permissions." },
  { category: "technical", q: "I'm getting a 'location denied' error when trying to check in.", a: "The check-in scanner requires your GPS location to verify you are at the event venue. Tap your browser's or phone's address bar area and look for a location permission icon. Grant location access and try again. If you are on iOS, you may need to go to Settings → Privacy → Location Services and enable it for your browser." },
  { category: "technical", q: "I uploaded photos to an event gallery but they are not showing.", a: "Gallery uploads may take a few seconds to process. Refresh the event page after 30 seconds. If photos are still not showing after a minute, the upload may have failed — try uploading again with a stable internet connection. Keep individual photo file sizes under 5MB." }
]

export default function HelpCenterPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all")
  const [openItem, setOpenItem] = useState<string | null>(null)

  const filteredFaqs = faqs.filter((f) => {
    const matchesCategory = activeCategory === "all" || f.category === activeCategory
    const matchesSearch = !searchQuery || f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="bg-background min-h-screen">
      {/* Header + Search */}
      <div className="bg-[#1d1d1f] dark:bg-[#0a0a0c] pt-32 pb-16 px-6 text-center">
        <div className="max-w-xl mx-auto flex justify-start mb-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">How can we help?</h1>
        <p className="text-muted-foreground mb-8 text-lg">Search our help articles or browse by category.</p>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search articles — e.g. 'check in', 'certificate', 'cancel'"
            className="w-full h-13 pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all text-[15px]"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Category Filters */}
        {!searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
            <button
              onClick={() => setActiveCategory("all")}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                activeCategory === "all"
                  ? "border-border bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground hover:border-border"
              }`}
            >
              <div className="text-xs font-bold">All Topics</div>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  activeCategory === cat.id
                    ? `border-border ${cat.bg}`
                    : "border-border bg-muted text-muted-foreground hover:border-border"
                }`}
              >
                <cat.icon className={`w-5 h-5 mx-auto mb-1.5 ${activeCategory === cat.id ? cat.color : "text-muted-foreground"}`} />
                <div className={`text-xs font-bold ${activeCategory === cat.id ? cat.color : "text-muted-foreground"}`}>
                  {cat.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {searchQuery && (
          <p className="text-sm text-muted-foreground mb-6">{filteredFaqs.length} result{filteredFaqs.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;</p>
        )}

        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground mb-6">Try a different search term or browse all categories.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all") }}
              className="h-10 px-6 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:bg-primary transition-colors"
            >
              View All Articles
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => {
              const key = `${faq.category}-${i}`
              const cat = categories.find(c => c.id === faq.category)
              return (
                <div key={key} className="border border-border rounded-2xl overflow-hidden hover:border-border transition-colors">
                  <button
                    onClick={() => setOpenItem(openItem === key ? null : key)}
                    className="w-full flex items-start justify-between p-6 text-left gap-4"
                  >
                    <div className="flex items-start gap-3">
                      {cat && (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${cat.bg} ${cat.color}`}>
                          <cat.icon className="w-3 h-3" />
                          {cat.label}
                        </span>
                      )}
                      <span className="font-semibold text-foreground text-[15px]">{faq.q}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 mt-0.5 transition-transform ${openItem === key ? "rotate-180" : ""}`} />
                  </button>
                  {openItem === key && (
                    <div className="px-6 pb-6">
                      <p className="text-muted-foreground leading-relaxed text-[15px]">{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Still need help */}
        <div className="mt-20 bg-muted rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Still need help?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Can&apos;t find what you&apos;re looking for? We respond to every message, usually within one business day.</p>
          <a
            href="mailto:team@kindly.co.in"
            className="inline-flex items-center gap-2 h-12 px-8 bg-primary hover:bg-primary text-primary-foreground text-[15px] font-bold rounded-full transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </a>
        </div>
      </div>
    </div>
  )
}
