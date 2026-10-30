"use client"

import { useState } from "react"
import {
  UserPlus, Search, Calendar, MapPin, Heart, Award, BarChart3,
  ChevronDown, Building2, Megaphone, Users, ClipboardCheck, FileText, ArrowLeft
} from "lucide-react"
import { useRouter } from "next/navigation"

const volunteerSteps = [
  {
    id: 1,
    icon: UserPlus,
    title: "Create Your Volunteer Profile",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    border: "border-blue-100",
    detail: "Sign in with an email one-time code, Google or a passkey — it takes moments. Tell us which causes you care about, then add your skills and a short bio. Your profile becomes your volunteer identity: organisations can see it when you register for their events, and the causes you pick help personalise the events you see."
  },
  {
    id: 2,
    icon: Search,
    title: "Discover Opportunities",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    border: "border-amber-100",
    detail: "Browse upcoming events and filter by cause (environment, education, health, food, animals, and more), date, time of day and duration — or search by title or place. Each event listing shows the organisation's profile, exact location, volunteer requirements, and what you'll be doing."
  },
  {
    id: 3,
    icon: Calendar,
    title: "Register for an Event",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    border: "border-violet-100",
    detail: "Tap 'Book My Slot' on any event and confirm. You'll immediately receive a confirmation with event details — date, time, location, point of contact, and what to bring. Your spot is reserved, and paid events use a secure online payment. You can manage all your upcoming events from your dashboard and cancel anytime before the event starts."
  },
  {
    id: 4,
    icon: MapPin,
    title: "Check In at the Venue",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    border: "border-emerald-100",
    detail: "On event day, open your ticket in Kindly and tap 'Check In'. Check-in opens when the event starts, and our geo-lock verifies you are within 200 metres of the venue — no remote check-ins. This keeps your attendance genuine and your certificate credible. If your location can't be verified, Kindly tells you how far away you are."
  },
  {
    id: 5,
    icon: Heart,
    title: "Volunteer & Make Impact",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    border: "border-rose-100",
    detail: "Show up, do the work, and make a difference. Your check-in records your attendance and your volunteer hours are credited automatically. Afterwards you can review the event and share photos and a few words with the community — posts are open only to volunteers who actually attended. You can also follow the fellow volunteers you met."
  },
  {
    id: 6,
    icon: Award,
    title: "Get Your Certificate",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    border: "border-orange-100",
    detail: "Once the event is over, the organisation issues certificates to everyone who attended. Each certificate carries your name, the event details and your volunteer hours, is signed by the organisation and has a unique verification ID. Download it as a PDF to add to your resume, LinkedIn, or college portfolio."
  },
  {
    id: 7,
    icon: BarChart3,
    title: "Build Your Impact Profile",
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-500/15",
    border: "border-teal-100",
    detail: "Every event you attend adds to your volunteer profile — total hours, causes you've supported, organisations you've worked with, and skills you've applied. Your profile becomes a living record of your commitment. Follow other volunteers, get endorsed for skills by organisations, and grow your network of people who care. Prefer privacy? You can make your account private and approve who follows you."
  }
]

const orgSteps = [
  {
    id: 1,
    icon: Building2,
    title: "Register Your Organisation",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    detail: "Sign up as an organisation and complete your profile with your mission, logo, website, and contact details. You can attach supporting documents such as a registration certificate, PAN or proof of organisation. Kindly's team reviews every application before your events go live and emails you when you're approved — so volunteers can trust every organisation on the platform."
  },
  {
    id: 2,
    icon: Megaphone,
    title: "Create & Submit Events",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    detail: "Build an event listing in minutes with a guided flow: title, cause category, date and time, a pinned location on the map, volunteer requirements, description, and the number of volunteers you need — with a live preview as you go. Submitted events get a quick review from our team, and once approved they appear on the discovery feed for volunteers. Events are free by default; you can also sell tickets."
  },
  {
    id: 3,
    icon: Users,
    title: "Manage Registrations",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    detail: "Watch registrations come in through your event dashboard and open any volunteer's profile — their skills, past events, and endorsements. Message everyone who has registered with a broadcast. On event day, volunteers check themselves in at the venue, and you can check people in manually if needed."
  },
  {
    id: 4,
    icon: ClipboardCheck,
    title: "Track Attendance in Real Time",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    detail: "Your event roster shows live attendance — who has arrived and who hasn't. Geo-lock verification means every self check-in comes from the actual venue. When you complete the event, volunteers who never checked in are marked as missed, and turnout flows straight into your analytics."
  },
  {
    id: 5,
    icon: FileText,
    title: "Complete the Event & Recognise Volunteers",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    detail: "Close out the event: review the report (turnout, impact hours and average rating), add photos to the gallery, and issue certificates to everyone who attended. Kindly also records the event in your organisation's impact history for future reference."
  },
  {
    id: 6,
    icon: BarChart3,
    title: "View Analytics & Reports",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    detail: "Your analytics dashboard tracks volunteer hours, active volunteers, events hosted, your repeat-volunteer rate and impact growth over time, with an event-by-event performance table. Export a report to share with donors or stakeholders."
  }
]

const faqs = [
  { q: "Is Kindly free to use?", a: "Yes. Kindly is free for volunteers. Organisations can create and manage events at no cost during the current phase of the platform; if an organisation sells tickets for an event, a platform fee applies." },
  { q: "Is Kindly limited to a particular city?", a: "No. Kindly isn't tied to any one city or cause. Organisations list events wherever they work, and volunteers browse events by cause, date and place." },
  { q: "How does the geo-lock check-in work?", a: "When you tap Check In, Kindly asks for your location. Check-in opens when the event starts, and Kindly verifies you are within 200 metres of the event's registered GPS coordinates before recording your attendance. This ensures all attendance records are genuine." },
  { q: "Who generates the certificate — me or the organisation?", a: "The organisation issues it. After the event, the organisation issues certificates to everyone who attended — you don't need to request one. It appears in your event history as a downloadable PDF." },
  { q: "Can I cancel a registration?", a: "Yes. You can cancel your registration from your event dashboard at any time before the event starts. Please cancel early so the organisation can offer your spot to another volunteer." },
  { q: "How are organisations verified?", a: "Every organisation submits its details during sign-up, optionally with supporting documents such as a registration certificate, PAN or proof of organisation. Kindly's team reviews each application, and reviews every event before it is published on the discovery feed. We focus on NGOs, registered trusts, and community groups with a clear public mission." },
]

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<"volunteers" | "orgs">("volunteers")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const router = useRouter()

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-muted to-white dark:to-background text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-start mb-6">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">How It Works</span>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-6 leading-[1.05]">
            From intention<br />to{" "}
            <span className="bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] bg-clip-text text-transparent">
              real impact.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Kindly is the connective tissue between people who want to help and organisations that need them — giving both a verified identity. Here is exactly how it all works, from signup to certificate.
          </p>
        </div>
      </section>

      {/* Tab Toggle */}
      <div className="sticky top-16 z-30 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 flex gap-0">
          <button
            onClick={() => setActiveTab("volunteers")}
            className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === "volunteers"
                ? "text-foreground border-border"
                : "text-muted-foreground border-transparent hover:text-muted-foreground"
            }`}
          >
            For Volunteers
          </button>
          <button
            onClick={() => setActiveTab("orgs")}
            className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === "orgs"
                ? "text-foreground border-border"
                : "text-muted-foreground border-transparent hover:text-muted-foreground"
            }`}
          >
            For Organisations
          </button>
        </div>
      </div>

      {/* Steps */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {(activeTab === "volunteers" ? volunteerSteps : orgSteps).map((step) => (
              <div key={step.id} className={`flex gap-6 p-6 md:p-8 rounded-2xl border ${(step as any).border || "border-border"} bg-card shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                  <step.icon className={`w-7 h-7 ${step.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold ${step.color} uppercase tracking-wider`}>Step {step.id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-muted">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left gap-4"
                >
                  <span className="font-semibold text-foreground text-[15px]">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground leading-relaxed text-[15px]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Join the volunteers and organisations making a difference with Kindly.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="h-12 px-8 bg-primary hover:bg-primary text-primary-foreground text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
            >
              Sign up as a Volunteer
            </a>
            <a
              href="/org-signup"
              className="h-12 px-8 bg-card border-2 border-border hover:bg-muted text-foreground text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
            >
              Register your Organisation
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
