import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, Award, BarChart3, Building2, CalendarCheck, Camera, CheckCircle2, ClipboardCheck, FileCheck,
  ListChecks, MapPin, MapPinned, Megaphone, Repeat, Search, ShieldCheck, Sparkles, Star, Ticket, Users,
} from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CtaBand } from "@/components/marketing/cta"
import { DeviceDuo } from "@/components/marketing/device"
import { FaqAccordion, type FaqItem } from "@/components/marketing/faq"
import { FaqJsonLd } from "@/components/marketing/faq-json-ld"
import { LoopSection } from "@/components/marketing/loop"
import { Container, Eyebrow, GradientText, Section, SectionHeading, ctaPrimary, ctaSecondary } from "@/components/marketing/primitives"
import { MarketingShell } from "@/components/marketing/shell"
import { FeatureShowcase } from "@/components/marketing/showcase"
import { StatStrip } from "@/components/marketing/stats"

export const metadata: Metadata = {
  title: "For organisations",
  description: "Give your NGO or community group a verified public identity, run events with a live roster and location-verified check-in, and recognise every volunteer with certificates.",
  openGraph: {
    title: "Kindly for organisations",
    description: "A verified identity for your organisation, honest attendance and certificates for every volunteer.",
    type: "website",
  },
}

const PILLARS = [
  { icon: Building2, title: "An identity, not just a listing", text: "A verified public profile with your mission, gallery, events, followers and reviews, so volunteers can find you, check you out and trust you at a glance." },
  { icon: MapPinned, title: "Attendance you can rely on", text: "Volunteers check in at the venue, within 200 metres of the location you pinned, once your event has started. No sign-in sheets, no disputes." },
  { icon: Award, title: "Recognition that travels", text: "Certificates, impact hours and posts from your events carry your name onto volunteers’ profiles, and bring the next volunteer to your door." },
]

const STEPS = [
  { icon: Building2, title: "Apply", text: "Create an organisation account and tell us about your work. Optionally attach a registration certificate, PAN or proof of organisation." },
  { icon: ShieldCheck, title: "We review", text: "Our team reviews every application before an organisation goes live. Your documents are kept in private storage." },
  { icon: CheckCircle2, title: "You’re approved", text: "You get an email as soon as you’re approved, and your organisation can carry a verified badge." },
  { icon: CalendarCheck, title: "Events go live", text: "Create your first event. After a quick review it appears in the discovery feed and volunteers can start registering." },
]

const FAQS: FaqItem[] = [
  { q: "How does verification work?", a: "After you create an account, our team reviews your organisation’s details (mission, contact information and type) along with any supporting documents you attach, such as a registration certificate, PAN or proof of organisation. We welcome registered NGOs and trusts, institution-backed groups, informal community groups and individual organisers. You’ll get an email once you’re approved." },
  { q: "Do our events need approval?", a: "Yes. New events are submitted for a quick review by our team and appear in the discovery feed once approved. You can edit event details from your dashboard afterwards." },
  { q: "What does it cost?", a: "Kindly is free to use for organisations and volunteers: there are no subscriptions or paid features. The only charge is on ticketed events. Volunteers pay the ticket price you set through a secure online payment, and a platform fee applies, deducted before we pay out your balance after the event." },
  { q: "Can I see who is coming?", a: "Yes. Every registered volunteer appears on your event roster. Open any name to see their Kindly profile (skills, past events, hours and endorsements) and plan roles before the day." },
  { q: "How does check-in work?", a: "Volunteers check themselves in at the venue with one tap. Check-in opens when your event starts and only works within 200 metres of the location you pinned, so attendance stays genuine. You can also check volunteers in, or undo a check-in, from your roster." },
  { q: "What if a volunteer doesn’t show up?", a: "When you complete an event, registered volunteers who never checked in are marked as missed. Certificates go only to volunteers who attended." },
  { q: "Who issues certificates?", a: "You do. After the event, issue certificates to everyone who attended. Each is signed with your organisation’s signature and carries a unique verification ID, and volunteers download it as a PDF from their profile." },
  { q: "Can I cancel an event?", a: "Yes. If you cancel, every registered volunteer is emailed automatically and paid tickets are refunded. We ask for at least 24 hours’ notice when possible." },
]

export default function ForOrganisationsPage() {
  return (
    <MarketingShell>
      <FaqJsonLd items={FAQS} />

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(60%_55%_at_75%_0%,rgba(255,107,107,0.16),transparent)] dark:bg-[radial-gradient(60%_55%_at_75%_0%,rgba(255,107,107,0.12),transparent)]" />
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <ScrollReveal>
              <Eyebrow>For organisations</Eyebrow>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]">
                Give your organisation an identity volunteers <GradientText>trust.</GradientText>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Kindly gives NGOs and community groups a verified public profile and the tools to run events, check volunteers in, issue certificates and understand their impact, so you can spend your time on the mission.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/org-signup" className={ctaPrimary}>Register your organisation <ArrowRight className="h-4 w-4" aria-hidden /></Link>
                <Link href="/how-it-works" className={ctaSecondary}>See how it works</Link>
              </div>
              <ul className="mt-8 grid gap-3 text-[15px] text-foreground sm:grid-cols-2">
                {["Reviewed and verified by our team", "Location-verified attendance", "Certificates for every attendee", "Free to use"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <DeviceDuo desktop="org-profile-public" mobile="org-profile-public" priority />
              <p className="mt-4 text-center text-xs text-muted-foreground">A public organisation profile · Illustrative sample data</p>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      <StatStrip />

      {/* Why */}
      <Section tone="cream">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Why organisations join"
            title="Your work deserves more than a chat group and a spreadsheet."
            lead="Genuine NGOs and community groups look no different from anyone else online. Their events live in chat groups, posters and sign-in sheets: scattered, hard to discover and hard to trust. Kindly gives them one verified place."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-sm">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7b2529] text-white"><p.icon className="h-6 w-6" aria-hidden /></span>
                  <h3 className="mt-6 text-xl font-bold text-foreground">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{p.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Features */}
      <FeatureShowcase
        id="identity"
        eyebrow="Verified identity"
        title="A public profile that does the introducing"
        lead="Volunteers land on your profile from your events, their friends’ posts and search. Make it count."
        bullets={[
          { icon: ShieldCheck, title: "Reviewed before you go live", text: "Every application is reviewed by our team, and approved organisations can carry a verified badge." },
          { icon: Camera, title: "Mission, gallery and track record", text: "Tagline, mission, an action gallery, a wall of fame, and your past and upcoming events, plus the hours volunteers have given you." },
          { icon: Star, title: "Followers and reviews", text: "Volunteers follow you and review the events they attended, so your reputation is built in the open." },
        ]}
        note="Registered NGOs and trusts, institution-backed groups, informal community groups and individual organisers can all apply."
        visual={<DeviceDuo desktop="org-profile-owner" mobile="org-profile-owner" />}
        caption="Your organisation’s profile, with edit controls · Illustrative sample data"
      />

      <FeatureShowcase
        id="events"
        tone="muted"
        reverse
        eyebrow="Create events"
        title="Create an event in minutes"
        lead="A guided, mobile-friendly flow takes you from idea to a listing volunteers can register for."
        bullets={[
          { icon: CalendarCheck, title: "Guided steps, live preview", text: "Details, schedule and logistics, with checks along the way and a live preview of how the listing will look." },
          { icon: MapPin, title: "A pinned location", text: "Search for the venue or drop a pin on the map. Volunteer check-in is verified against this spot." },
          { icon: Users, title: "Slots, deadlines and age limits", text: "Set a volunteer limit or leave it open, a registration deadline and a minimum age." },
          { icon: Ticket, title: "Free or ticketed", text: "Events are free by default. If you choose to sell tickets, volunteers pay through a secure online payment." },
        ]}
        note="New events are reviewed by our team before they appear in the public feed."
        visual={<DeviceDuo desktop="wizard-details" mobile="wizard-schedule" />}
        caption="Event creation: schedule, location, volunteer limit and ticketing, with a live preview · Illustrative sample data"
      />

      <FeatureShowcase
        id="run-the-day"
        eyebrow="Run the day"
        title="Run the day with a live roster"
        lead="See who is coming, check people in as they arrive and keep everyone informed, from a phone or a laptop."
        bullets={[
          { icon: ListChecks, title: "Live headcount", text: "Registered, checked-in and slots-left counts update as volunteers arrive." },
          { icon: ClipboardCheck, title: "Check-in, two ways", text: "Volunteers check themselves in at the venue, or you check them in from the roster, and undo a slip in one tap." },
          { icon: Megaphone, title: "Broadcast to attendees", text: "Send updates to everyone registered: a changed meeting point, what to bring, a thank-you." },
        ]}
        visual={<DeviceDuo desktop="manage-checkin" mobile="manage-roster" />}
        caption="The event roster with real-time check-in status · Illustrative sample data"
      />

      <FeatureShowcase
        id="recognise"
        tone="muted"
        reverse
        eyebrow="Recognise and report"
        title="Recognise your volunteers, then see your impact"
        lead="When the event is over, close the loop: certificates for everyone who attended, and a report you can share with your own supporters."
        bullets={[
          { icon: Award, title: "Certificates with your signature", text: "Issue certificates to everyone who attended. Each carries your organisation’s signature and a unique verification ID." },
          { icon: BarChart3, title: "A post-event report", text: "Turnout, total impact hours, average rating and your event gallery in one page." },
          { icon: Camera, title: "Photos that tell the story", text: "Add photos to the event gallery. They appear on the event’s public showcase page." },
        ]}
        visual={<DeviceDuo desktop="report" mobile="report" />}
        caption="Post-event report: turnout, impact hours and rating · Illustrative sample data"
      />

      <FeatureShowcase
        id="insights"
        eyebrow="Analytics"
        title="Know how your volunteer programme is doing"
        lead="Your command centre shows the hours given, the people behind them and how reliably they turn up."
        bullets={[
          { icon: BarChart3, title: "Impact over time", text: "Total volunteer hours, active volunteers and events hosted, with an impact-growth chart." },
          { icon: Repeat, title: "Repeat-volunteer rate", text: "See how many volunteers come back and how reliably registered volunteers turn up." },
          { icon: FileCheck, title: "Event by event", text: "An event performance table, and a report you can export to share with your supporters." },
        ]}
        visual={<DeviceDuo desktop="org-analytics" mobile="org-analytics" />}
        caption="Organisation analytics: impact growth, reliability and event performance · Illustrative sample data"
      />

      <FeatureShowcase
        id="reach"
        tone="muted"
        reverse
        eyebrow="Reach"
        title="Reach volunteers who care"
        lead="Volunteers find you by cause, date and place, and the feed is personalised around what they care about."
        bullets={[
          { icon: Search, title: "Found by cause, date and place", text: "Search and filters help volunteers find events that fit their week and their interests." },
          { icon: Sparkles, title: "Personal from the first tap", text: "Volunteers choose the causes they care about when they join, and their feed is shaped around them." },
          { icon: ShieldCheck, title: "Listings they can trust", text: "Because every organisation and event is reviewed, volunteers browse and book with confidence." },
        ]}
        visual={<DeviceDuo desktop="events-feed" mobile="event-detail" />}
        caption="What volunteers see: discovery feed and an event page · Illustrative sample data"
      />

      <LoopSection />

      {/* Getting started */}
      <Section id="get-started">
        <Container>
          <SectionHeading align="center" eyebrow="Getting started" title="From application to your first event in four steps" lead="Verification protects volunteers and the organisations they trust. Here is what to expect." />
          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="list-none">
                <ScrollReveal delay={i * 0.07} className="h-full">
                  <div className="h-full rounded-3xl border border-border bg-card p-7">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fde8e5] text-[#7b2529] dark:bg-[#ff6b6b]/15 dark:text-[#ffb4ae]"><s.icon className="h-5 w-5" aria-hidden /></span>
                      <span className="text-3xl font-bold text-muted-foreground/30">{i + 1}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-foreground">{s.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
                  </div>
                </ScrollReveal>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Pricing */}
      <Section tone="cream" id="pricing">
        <Container>
          <SectionHeading align="center" eyebrow="Pricing" title="Free to use. Clear about money." lead="No subscriptions, no paid features. The only charge is on ticketed events." />
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <ScrollReveal>
              <div className="h-full rounded-3xl border border-border bg-card p-8">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">Free</p>
                <h3 className="mt-3 text-2xl font-bold text-foreground">Everything you need to run events</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">Your public profile, event creation, the live roster, check-in, broadcasts, certificates, reports and analytics, at no cost to your organisation or your volunteers.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <div className="h-full rounded-3xl border border-border bg-card p-8">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#7b2529] dark:text-[#f4a6a0]">Ticketed events</p>
                <h3 className="mt-3 text-2xl font-bold text-foreground">Only when you choose to sell tickets</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">Volunteers pay the ticket price you set through a secure online payment. A platform fee applies and is deducted before we pay out your balance after the event.</p>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <Container className="max-w-3xl">
          <SectionHeading align="center" eyebrow="FAQ" title="Questions organisations ask" />
          <div className="mt-12"><FaqAccordion items={FAQS} /></div>
        </Container>
      </Section>

      <CtaBand
        title="Bring your organisation onto Kindly."
        lead="Join the organisations building a verified identity, and a community that keeps showing up."
        primary={{ href: "/org-signup", label: "Register your organisation" }}
        secondary={{ href: "/how-it-works", label: "See how it works" }}
      />
    </MarketingShell>
  )
}
