"use client"

import {
  BarChart3, Users2, Zap, Check, QrCode, FileText, Award,
  ShieldCheck, Bell, Globe, ChevronDown, Calendar, TrendingUp, ArrowLeft
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const features = [
  {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    title: "Create Events in Minutes",
    body: "Build a detailed event listing with title, cause category, date, time, GPS location, description, requirements, and volunteer capacity. Once submitted, your event goes through a quick review and then appears on the Kindly discovery feed for all volunteers in your city."
  },
  {
    icon: Users2,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    title: "See Every Registered Volunteer",
    body: "Your event dashboard shows every registered volunteer with their full Kindly profile — skills, past events, total volunteer hours, and endorsements. You can assess the profile of your incoming volunteers before the event day, helping you plan roles and responsibilities better."
  },
  {
    icon: QrCode,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    title: "QR-Based Attendance — No Paper",
    body: "A unique QR code is generated automatically for each of your events. Volunteers scan it at the venue using the Kindly app to check in. Our geo-lock technology confirms they are physically at your location. Attendance is recorded instantly — no sign-in sheets, no manual counting, no disputes."
  },
  {
    icon: ShieldCheck,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-500/15",
    title: "Geo-Lock Prevents Fake Check-Ins",
    body: "Every check-in is verified against the event's GPS coordinates. Volunteers must be within 200 metres of the venue to complete check-in. This guarantees that every attendance record is genuine, making your reports accurate and your certificates credible to recipients."
  },
  {
    icon: Award,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    title: "Automatic Certificate Generation",
    body: "Once you mark an event complete, Kindly automatically generates a personalised digital certificate for every attending volunteer — signed with your organisation's name. Volunteers download it directly from their profile. You never have to create or send a certificate manually again."
  },
  {
    icon: BarChart3,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    title: "Analytics Dashboard",
    body: "Track your organisation's volunteer program over time. See total events hosted, total volunteers across all events, average turnout rate, and volunteer retention. Understand which types of events attract the most volunteers and which cause categories resonate most in your city."
  },
  {
    icon: FileText,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    title: "Event Reports & Photo Gallery",
    body: "After each event, upload a photo gallery and complete the event report. The report captures final attendance, volunteer hours contributed, and a summary of what was accomplished. This report forms part of your organisation's public profile and impact history on Kindly."
  },
  {
    icon: Bell,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-500/15",
    title: "Volunteer Reviews",
    body: "Attending volunteers can leave reviews of your event after the fact. This gives you honest, direct feedback from the ground. Organisations with high review scores are featured more prominently on the discovery feed, helping you attract more committed volunteers over time."
  },
  {
    icon: TrendingUp,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-500/15",
    title: "Build a Trusted Organisation Profile",
    body: "Your Kindly profile grows with every event you host. Past events, attendee counts, cause categories, and volunteer reviews all build your public reputation. A strong profile makes future volunteer recruitment significantly easier — people sign up for organisations they trust."
  },
  {
    icon: Globe,
    color: "text-muted-foreground",
    bg: "bg-muted",
    title: "Reach Volunteers Across Your City",
    body: "When you publish an event, it appears in the discovery feed of every volunteer in your city who matches your cause category. Volunteers can filter by cause, so your beach cleanup reaches environmentalists, your tutoring event reaches educators, and your food drive reaches the right hands."
  }
]

const steps = [
  { n: "01", title: "Register & get verified", desc: "Create your organisation account. We review your profile before your events go live. Verification typically takes 1–2 business days." },
  { n: "02", title: "Create your first event", desc: "Fill in event details, set the GPS location, add your QR poster, and publish. Volunteers can immediately start registering." },
  { n: "03", title: "Manage your attendees", desc: "Track registrations in real time. View volunteer profiles, communicate event updates, and prepare your QR code for the day." },
  { n: "04", title: "Run the event, track attendance live", desc: "On event day, watch check-ins happen in real time on your dashboard. Geo-verified attendance, no paperwork." },
  { n: "05", title: "Complete the report, send certificates", desc: "Submit the event report, upload photos. Certificates are sent to volunteers automatically. Your analytics update immediately." }
]

const faqs = [
  { q: "How does the organisation verification process work?", a: "After you create an account, Kindly reviews your organisation details — mission, contact information, and type. We verify NGOs, registered trusts, and community groups. The review takes 1–2 business days. Once approved, your events appear on the discovery feed immediately upon publishing." },
  { q: "Is Kindly free for organisations?", a: "Yes. Kindly is currently free for organisations during this phase of the platform. You can create unlimited events, manage unlimited volunteers, and generate unlimited certificates at no cost." },
  { q: "Can I see volunteer profiles before the event?", a: "Yes. Every volunteer who registers for your event is visible in your event dashboard with their full Kindly profile — skills, past volunteer history, and endorsements. You can use this to plan roles and understand your incoming team." },
  { q: "What if a volunteer doesn't show up?", a: "Volunteers who don't check in by the event's end time are automatically marked as absent. You can also manually mark specific volunteers absent from the dashboard. Absent volunteers do not receive certificates." },
  { q: "Can I edit or cancel an event after publishing?", a: "Yes. You can edit event details at any time from your event dashboard. If you need to cancel an event, all registered volunteers are automatically notified. We ask that you give at least 24 hours notice when possible." },
  { q: "How do I get the QR code for check-in?", a: "A unique QR code is automatically generated for each event you create. Find it in your event dashboard under 'Event QR'. You can download and print it or display it on a screen at the venue." }
]

export default function ForOrganisationsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const router = useRouter()

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-bold text-xs tracking-widest uppercase mb-5 block">For Organisations</span>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-[1.1]">
                Run your volunteer program like a pro.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Kindly gives NGOs and community groups the tools to recruit, manage, track, and certify volunteers — without the administrative overhead. Focus on your mission. We handle the logistics.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Geo-verified attendance — no fake check-ins",
                  "Automatic certificates for every attendee",
                  "Analytics dashboard for your entire program",
                  "Volunteer profiles so you know who's showing up"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-foreground text-[15px]">{item}</span>
                  </div>
                ))}
              </div>
              <a
                href="/org-signup"
                className="h-12 px-8 bg-primary hover:bg-primary text-primary-foreground text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
              >
                Register Your Organisation
              </a>
            </div>

            <div className="space-y-4">
              <div className="bg-muted p-6 rounded-3xl">
                <div className="bg-card rounded-2xl shadow-sm p-5 mb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/15 rounded-full flex items-center justify-center">
                      <Users2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">128</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Registered Volunteers</div>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "78%" }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">78 checked in</span>
                    <span className="text-xs text-blue-600 font-medium">61% arrived</span>
                  </div>
                </div>
                <div className="bg-card rounded-2xl shadow-sm p-5 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/15 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">98%</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Turnout Rate</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl shadow-sm p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/15 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">2,450</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Certificates Issued</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works for Orgs */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How it works for you</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From registration to certificates — the full organisation workflow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="font-bold text-foreground text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Every tool you need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Built specifically for how Indian NGOs and community groups actually operate.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-2xl border border-border hover:border-border hover:shadow-sm transition-all">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-muted">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Organisation FAQs</h2>
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
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to grow your volunteer program?</h2>
          <p className="text-muted-foreground mb-8 text-lg">Join verified organisations across India using Kindly to make their missions more effective.</p>
          <a
            href="/org-signup"
            className="h-12 px-10 bg-primary hover:bg-primary text-primary-foreground text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
          >
            Register Your Organisation — It's Free
          </a>
        </div>
      </section>
    </div>
  )
}
