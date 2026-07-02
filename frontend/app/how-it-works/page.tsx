"use client"

import { useState } from "react"
import {
  UserPlus, Search, Calendar, QrCode, Heart, Award, BarChart3,
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
    detail: "Sign up with your email in under 2 minutes. Add your skills, interests, city, and a short bio. Your profile becomes your volunteer identity — organizations can see it when you register for their events. The more detailed your profile, the better matched you are to meaningful opportunities."
  },
  {
    id: 2,
    icon: Search,
    title: "Discover Local Opportunities",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    border: "border-amber-100",
    detail: "Browse events across 8 Indian cities — Nashik, Mumbai, Pune, Delhi, Bangalore, Chennai, Hyderabad, and Kolkata. Filter by cause category (environment, education, health, food, animals, and more), date, or city. Each event listing shows the organization's verified profile, exact location, volunteer requirements, and what you'll be doing."
  },
  {
    id: 3,
    icon: Calendar,
    title: "Register for an Event",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    border: "border-violet-100",
    detail: "Tap 'Register' on any event. You'll immediately receive a confirmation with event details — date, time, location, point of contact, and what to bring. Your spot is reserved. You can manage all your upcoming events from your dashboard and cancel anytime before the event starts."
  },
  {
    id: 4,
    icon: QrCode,
    title: "Check In at the Venue",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    border: "border-emerald-100",
    detail: "On event day, open Kindly and scan the organization's QR code at the venue. Our geo-lock technology verifies you are physically present at the location — no remote check-ins. This ensures your attendance is genuine and your certificate carries real credibility. If the scanner can't verify your location, it will tell you exactly why."
  },
  {
    id: 5,
    icon: Heart,
    title: "Volunteer & Make Impact",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    border: "border-rose-100",
    detail: "Show up, do the work, and make a difference. The organization tracks attendance and hours. After the event, you can leave a review for the organization — this helps other volunteers choose quality events. You can also connect with fellow volunteers you met at the event through the platform."
  },
  {
    id: 6,
    icon: Award,
    title: "Get Your Certificate",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    border: "border-orange-100",
    detail: "Once the organization marks the event complete, your digital certificate is generated automatically. Each certificate is personalized with your name, the event details, volunteer hours, and is digitally signed by the organization. Download it as a PDF to add to your resume, LinkedIn, or college portfolio."
  },
  {
    id: 7,
    icon: BarChart3,
    title: "Build Your Impact Profile",
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-500/15",
    border: "border-teal-100",
    detail: "Every event you attend adds to your public volunteer profile — total hours, causes you've supported, organizations you've worked with, and skills you've applied. Your profile becomes a living record of your commitment. Follow other volunteers, get endorsed for skills, and grow your network of people who care."
  }
]

const orgSteps = [
  {
    id: 1,
    icon: Building2,
    title: "Register Your Organisation",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    detail: "Sign up as an organisation and complete your profile with your mission, logo, website, and contact details. Kindly's team reviews your organisation before your events go live. This verification process ensures that volunteers can trust every opportunity on the platform."
  },
  {
    id: 2,
    icon: Megaphone,
    title: "Create & Publish Events",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    detail: "Build an event listing in minutes. Set the title, cause category, date, time, exact GPS location, volunteer requirements, description, and the maximum number of volunteers you need. Once published, your event appears on the discovery feed for all volunteers in your city."
  },
  {
    id: 3,
    icon: Users,
    title: "Manage Registrations",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    detail: "Watch registrations come in through your event dashboard. See every registered volunteer's profile — their skills, past events, and endorsements. On event day, your QR code is auto-generated. Volunteers scan it to mark attendance. You can also check in volunteers manually if needed."
  },
  {
    id: 4,
    icon: ClipboardCheck,
    title: "Track Attendance in Real Time",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    detail: "Your event dashboard shows live attendance — who has arrived, who hasn't shown up. Geo-lock verification means every check-in is from the actual venue. After the event, you can mark absent volunteers and add a photo gallery. The system auto-calculates turnout rate for your analytics."
  },
  {
    id: 5,
    icon: FileText,
    title: "Complete the Event Report",
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    detail: "Close out the event by completing the report — confirm final attendance, upload photos, and add any notes. Once complete, certificates are automatically generated and delivered to every attending volunteer. Kindly also records the event in your organization's impact history for future reference."
  },
  {
    id: 6,
    icon: BarChart3,
    title: "View Analytics & Reports",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    detail: "Your analytics dashboard tracks total events hosted, total volunteers across all events, average turnout rate, and volunteer retention. Download impact reports to share with donors or stakeholders. The data shows how your volunteer program is growing over time."
  }
]

const faqs = [
  { q: "Is Kindly free to use?", a: "Yes. Kindly is completely free for volunteers. Organisations can create and manage events at no cost during the current phase of the platform." },
  { q: "Which cities does Kindly currently support?", a: "Kindly currently supports Nashik, but in future would expand to Mumbai, Pune, Delhi, Bangalore, Chennai, Hyderabad, and Kolkata. More cities are being added based on demand." },
  { q: "How does the geo-lock check-in work?", a: "When you tap the check-in button, Kindly asks for your location. It then verifies you are within 200 metres of the event's registered GPS coordinates before allowing the scan. This ensures all attendance records are genuine." },
  { q: "Who generates the certificate — me or the organisation?", a: "Certificates are generated automatically by the platform once the organisation marks the event as complete. You do not need to request one manually. It appears in your event history as a downloadable PDF." },
  { q: "Can I cancel a registration?", a: "Yes. You can cancel your registration from your event dashboard at any time before the event starts. Please cancel early so the organisation can offer your spot to another volunteer." },
  { q: "How are organisations verified?", a: "Every organisation submits basic information during sign-up. Kindly reviews the submission before their events are published on the discovery feed. We focus on NGOs, registered trusts, and community groups with a clear public mission." },
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
            Kindly is the connective tissue between people who want to help and organisations that need them. Here is exactly how it all works — from signup to certificate.
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
          <p className="text-muted-foreground mb-8 text-lg">Join thousands of volunteers across India making a difference every week.</p>
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
