"use client"

import {
  BarChart3, Users2, Check, FileText, Award, ShieldCheck, Globe, ChevronDown,
  Calendar, TrendingUp, ArrowLeft, MapPin, Megaphone
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const features = [
  {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    title: "Create Events in Minutes",
    body: "A guided flow takes you from idea to listing: title, cause category, date and time, a pinned location on the map, requirements, volunteer limit and registration deadline — with a live preview as you go. Once submitted, your event goes through a quick review and then appears on the Kindly discovery feed."
  },
  {
    icon: Users2,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-500/15",
    title: "See Every Registered Volunteer",
    body: "Your event roster lists every registered volunteer. Open any name to see their Kindly profile — skills, past events, volunteer hours and endorsements — so you can plan roles and responsibilities before the event day."
  },
  {
    icon: MapPin,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    title: "Check-In Without the Paperwork",
    body: "On the day, volunteers check themselves in at the venue with a single tap, and you can check anyone in (or undo a mistake) from your roster. Attendance is recorded instantly and your headcount updates live — no sign-in sheets, no manual counting, no disputes."
  },
  {
    icon: ShieldCheck,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-500/15",
    title: "Geo-Lock Keeps Attendance Honest",
    body: "Self check-in opens when your event starts and only works within 200 metres of the location you pinned. That keeps every attendance record genuine, making your reports accurate and your certificates credible to the people who receive them."
  },
  {
    icon: Award,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    title: "Certificates You Issue in One Go",
    body: "After you complete an event, issue a personalised certificate to everyone who attended — signed with your organisation's signature and carrying a unique verification ID. Volunteers download it from their profile, so you never have to create or send certificates by hand."
  },
  {
    icon: BarChart3,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-500/15",
    title: "Analytics Dashboard",
    body: "Track your volunteer program over time: total volunteer hours, active volunteers, events hosted, your repeat-volunteer rate and an impact-growth chart. An event-by-event performance table shows what works, and you can export a report to share with your supporters."
  },
  {
    icon: FileText,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-500/15",
    title: "Event Reports & Photo Gallery",
    body: "After each event, review the report — turnout, total impact hours and average rating — and add photos to the event gallery. Each event also gets a public showcase page that volunteers can share."
  },
  {
    icon: Megaphone,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-500/15",
    title: "Message Everyone Registered",
    body: "Send a broadcast to every registered volunteer — a changed meeting point, what to bring, a last-minute thank-you. Updates appear on the volunteer's event page, and cancelling an event emails everyone who registered."
  },
  {
    icon: TrendingUp,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-500/15",
    title: "A Public Identity Volunteers Trust",
    body: "Your organisation gets a profile of its own: tagline, mission, an action gallery, past and upcoming events, followers and volunteer reviews. Approved organisations can carry a verified badge. Your profile grows with every event you host — people sign up for organisations they trust."
  },
  {
    icon: Globe,
    color: "text-muted-foreground",
    bg: "bg-muted",
    title: "Reach Volunteers Who Care",
    body: "Volunteers browse the discovery feed by cause, date and place, and tell us which causes they care about when they join. So your river clean-up reaches people who love the outdoors, your tutoring event reaches educators, and your food drive reaches the right hands."
  }
]

const steps = [
  { n: "01", title: "Register & get verified", desc: "Create your organisation account and tell us about your work. Our team reviews every application before your events go live, and you'll get an email as soon as you're approved." },
  { n: "02", title: "Create your first event", desc: "Add the details, pin the location on the map, set your volunteer limit and submit. Once our team approves it, it appears on the discovery feed and volunteers can start registering." },
  { n: "03", title: "Manage your attendees", desc: "Track registrations in real time, open volunteer profiles, and message everyone who has registered with event updates." },
  { n: "04", title: "Run the event, track attendance live", desc: "Volunteers check in at the venue — within 200 metres, once the event has started. Watch the roster update live, or check people in yourself." },
  { n: "05", title: "Complete the event, recognise your volunteers", desc: "Mark the event complete, add photos and issue certificates to everyone who attended. Your analytics update immediately." }
]

const faqs = [
  { q: "How does the organisation verification process work?", a: "After you create an account, our team reviews your organisation's details — mission, contact information and type — along with any supporting documents you attach, such as a registration certificate, PAN or proof of organisation. We welcome NGOs, registered trusts, institution-backed groups and community groups. Once you're approved you'll get an email, and your events go live after their own quick review." },
  { q: "Is Kindly free for organisations?", a: "Kindly is currently free for organisations during this phase of the platform — you can create events, manage volunteers and issue certificates at no cost. If you choose to sell tickets for an event, a platform fee applies; we'll share the details when you set up a paid event." },
  { q: "Can I see volunteer profiles before the event?", a: "Yes. Every volunteer who registers appears on your event roster. Open any name to see their Kindly profile — skills, past volunteer history, hours and endorsements — and use it to plan roles and understand your incoming team." },
  { q: "What if a volunteer doesn't show up?", a: "When an event is completed, registered volunteers who never checked in are marked as missed. You can also check volunteers in, or undo a check-in, from your roster. Certificates go only to volunteers who attended." },
  { q: "Can I edit or cancel an event after publishing?", a: "You can edit event details from your event dashboard. If you need to cancel an event, every registered volunteer is emailed automatically. We ask that you give at least 24 hours' notice when possible." },
  { q: "How does check-in work?", a: "Volunteers check themselves in at the venue with one tap. Check-in opens when your event starts and only works within 200 metres of the location you pinned, so attendance records stay genuine. You can also check volunteers in from your roster." }
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
                Give your organisation an identity volunteers trust.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Kindly gives NGOs and community groups a verified public profile and the tools to recruit, check in, certify and recognise volunteers — without the administrative overhead. Focus on your mission. We handle the logistics.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "A verified public profile volunteers can trust",
                  "Location-verified check-in — attendance you can rely on",
                  "Certificates you can issue to everyone who attended",
                  "Analytics and volunteer profiles for your whole program"
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
                      <div className="text-2xl font-bold text-foreground">40</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Registered Volunteers</div>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "80%" }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">32 checked in</span>
                    <span className="text-xs text-blue-600 font-medium">80% arrived</span>
                  </div>
                </div>
                <div className="bg-card rounded-2xl shadow-sm p-5 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-500/15 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">32</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Location-Verified Check-Ins</div>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl shadow-sm p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/15 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">32</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Certificates Issued</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Illustrative sample event</p>
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
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Built for how NGOs and community groups actually operate.</p>
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
          <p className="text-muted-foreground mb-8 text-lg">Join verified organisations using Kindly to make their missions more effective.</p>
          <a
            href="/org-signup"
            className="h-12 px-10 bg-primary hover:bg-primary text-primary-foreground text-[15px] font-bold rounded-full inline-flex items-center justify-center transition-colors"
          >
            Register Your Organisation — It&apos;s Free
          </a>
        </div>
      </section>
    </div>
  )
}
