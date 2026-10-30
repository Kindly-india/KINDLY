import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, Award, Bell, Camera, CheckCircle2, Clock, Compass, HandHeart, Heart, History, IdCard, Info, Lock, MapPin,
  MapPinned, Search, ShieldCheck, Sparkles, Star, Ticket, Trophy,
} from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CtaBand } from "@/components/marketing/cta"
import { DeviceDuo, PhoneTrio } from "@/components/marketing/device"
import { FaqAccordion, type FaqItem } from "@/components/marketing/faq"
import { FaqJsonLd } from "@/components/marketing/faq-json-ld"
import { LoopSection } from "@/components/marketing/loop"
import { Container, Eyebrow, GradientText, Section, SectionHeading, ctaPrimary, ctaSecondary } from "@/components/marketing/primitives"
import { MarketingShell } from "@/components/marketing/shell"
import { FeatureShowcase } from "@/components/marketing/showcase"
import { StatStrip } from "@/components/marketing/stats"

export const metadata: Metadata = {
  title: "For volunteers",
  description: "Find events that matter, check in at the venue, and earn certificates, verified hours and a volunteer identity that lasts beyond any single act of kindness.",
  openGraph: {
    title: "Kindly for volunteers",
    description: "Your time is your superpower. Now it has a record.",
    type: "website",
  },
}

const PILLARS = [
  { icon: Compass, title: "Find what fits", text: "Events matched to the causes you care about, with search and filters for date, time of day and duration." },
  { icon: Award, title: "Keep the proof", text: "Check-ins that are verified, hours credited automatically and certificates from the organisations you served." },
  { icon: Heart, title: "Belong to something", text: "A profile, a journey, endorsements and a community that notices when you show up." },
]

const TRUST = [
  { icon: ShieldCheck, title: "Reviewed organisations", text: "Every organisation is reviewed by our team before its events go live, and every event is reviewed too. Approved organisations can carry a verified badge." },
  { icon: MapPinned, title: "Verified check-in", text: "Check-in opens when the event starts and only works within 200 metres of the venue, so your attendance is genuine." },
  { icon: Lock, title: "You control your profile", text: "Keep your account public, or make it private and approve who follows you." },
]

const FAQS: FaqItem[] = [
  { q: "Do I need experience to volunteer?", a: "No. Most events on Kindly need only your time and willingness. Listings clearly say if a specific skill or qualification is needed, and if an event is open to all, no prior experience is required." },
  { q: "Can I volunteer if I’m a student?", a: "Absolutely. Kindly is built with students in mind. Many colleges value community-service hours, and your certificates and verified hours give you something concrete to show. You can volunteer on weekends and build a portfolio of real impact for internship and placement interviews." },
  { q: "How do I get my certificate?", a: "Once the event is over, the organisation issues certificates to everyone who attended. You’ll find yours in your event history and can download it as a PDF any time." },
  { q: "What happens if I cancel a registration?", a: "You can cancel any time before the event starts from your dashboard, and your spot opens up for another volunteer. Cancellations don’t affect your profile. We only ask that you cancel as early as possible." },
  { q: "Is Kindly free?", a: "Yes. Kindly is free to use: there are no subscriptions or paid features. Some organisations ticket workshops or special events. The ticket price is shown on the event page before you book, a secure online payment is used, and a platform fee applies to ticketed events." },
  { q: "Who can see my profile?", a: "By default your profile is visible to other volunteers and organisations. You can make your account private at any time and approve who follows you. Posts can only be created for events you attended." },
]

export default function ForVolunteersPage() {
  return (
    <MarketingShell>
      <FaqJsonLd items={FAQS} />

      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(60%_55%_at_25%_0%,rgba(245,158,11,0.18),transparent)] dark:bg-[radial-gradient(60%_55%_at_25%_0%,rgba(245,158,11,0.12),transparent)]" />
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <ScrollReveal>
              <Eyebrow>For volunteers</Eyebrow>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]">
                Your time is your superpower. <GradientText>Now it has a record.</GradientText>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Kindly turns the desire to help into a habit. Find events near you, check in at the venue, and build a volunteer identity of certificates, verified hours and people who notice that you show up.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className={ctaPrimary}>Create free account <ArrowRight className="h-4 w-4" aria-hidden /></Link>
                <Link href="/events" className={ctaSecondary}>Browse events</Link>
              </div>
              <ul className="mt-8 grid gap-3 text-[15px] text-foreground sm:grid-cols-2">
                {["Free to use", "Sign in with an email code, Google or a passkey", "Certificates and verified hours", "Make your profile private anytime"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <DeviceDuo desktop="events-feed" mobile="event-detail" priority />
              <p className="mt-4 text-center text-xs text-muted-foreground">Event discovery and an event page · Illustrative sample data</p>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      <StatStrip />

      {/* The idea */}
      <Section tone="cream">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Why Kindly"
            title="Most people want to help. Very few keep showing up."
            lead="Good intent isn’t the problem. Nothing makes showing up feel seen or remembered, so a busy week quietly wins. Kindly gives your service a record and a community, so there is a reason to come back."
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

      <FeatureShowcase
        id="discover"
        eyebrow="Discover and register"
        title="Find the right event, then commit in a few taps"
        lead="Browse events that match your interests and see everything you need to decide."
        bullets={[
          { icon: Search, title: "Search and filters", text: "Search by title or place. Filter by cause, date, time of day and duration." },
          { icon: Info, title: "Everything up front", text: "The venue and map, the on-site host, dress code, what to bring, the cause, and The After plan if the organiser has one." },
          { icon: Ticket, title: "Book in a few taps", text: "Reserve a spot and get a ticket. Paid events use a secure online payment." },
        ]}
        note="When you join you pick the causes you care about, so your feed starts personal."
        visual={<DeviceDuo desktop="events-feed" mobile="events-filters" />}
        caption="Event discovery with filters · Illustrative sample data"
      />

      <FeatureShowcase
        id="check-in"
        tone="muted"
        reverse
        eyebrow="Ticket and check-in"
        title="A ticket on your phone, and attendance that is verified"
        lead="On the day, open your ticket and check in with one tap, only when you are really there."
        bullets={[
          { icon: Ticket, title: "Ticket and logistics", text: "Time, venue, on-site host and dress code, plus briefings from the organiser." },
          { icon: MapPin, title: "Location-verified check-in", text: "Check-in opens when the event starts and works only within 200 metres of the venue." },
          { icon: Clock, title: "Hours, credited automatically", text: "Your volunteering hours are recorded from check-in. No sign-in sheets, no chasing." },
        ]}
        visual={<PhoneTrio shots={["registered-ticket", "checkin-too-far", "checkin-success"]} />}
        caption="Your ticket · check-in blocked when too far from the venue · check-in confirmed · Illustrative sample data"
      />

      <FeatureShowcase
        id="proof"
        eyebrow="Proof of service"
        title="Proof of service that is worth keeping"
        lead="Every event you attend becomes part of a record you can show to a college, an employer or a friend."
        bullets={[
          { icon: Award, title: "Certificates from the organiser", text: "After the event, the organisation issues a certificate with your name, hours and a unique verification ID. Download it as a PDF." },
          { icon: History, title: "A history that adds up", text: "Events attended, hours given and certificates earned, all in one place." },
          { icon: Sparkles, title: "An impact report", text: "Hours, causes supported and activity over time in a personal impact report." },
        ]}
        visual={<DeviceDuo desktop="showcase-certificate" mobile="impact-report" />}
        caption="An event showcase with your certificate, and a personal impact report · Illustrative sample data"
      />

      <FeatureShowcase
        id="identity"
        tone="muted"
        reverse
        eyebrow="Your identity"
        title="An identity built from real service"
        lead="Your profile isn’t a CV you wrote. It is a record of what you actually did, and who vouches for it."
        bullets={[
          { icon: IdCard, title: "A profile that tells your story", text: "Headline, bio, skills, social links, cover and photo, plus a gallery from the events you have joined." },
          { icon: Trophy, title: "Journey and badges", text: "A timeline of events you attended, with badges for milestones, certificates and hours." },
          { icon: HandHeart, title: "Endorsements from organisations", text: "Organisations can endorse the skills you showed on the day." },
          { icon: Lock, title: "In your control", text: "Make your account private and approve who follows you." },
        ]}
        visual={<DeviceDuo desktop="profile-own" mobile="profile-own" />}
        caption="A volunteer profile: story, journey, badges and gallery · Illustrative sample data"
      />

      <FeatureShowcase
        id="community"
        eyebrow="Community"
        title="The social layer that brings people back"
        lead="Share the day with the community, and see what your peers are doing next."
        bullets={[
          { icon: Camera, title: "Share the day", text: "Post photos and a caption from events you attended: up to five photos a post and three posts per event." },
          { icon: Heart, title: "Follow, like, comment", text: "Follow volunteers and organisations, react to posts, and discover people through suggestions and search." },
          { icon: Bell, title: "Stay in the loop", text: "In-app notifications for likes, comments and follow requests, and briefings from organisers on the event page." },
        ]}
        note="Posts can only be created for completed events you actually attended, so the feed is made of real, verified service."
        visual={<PhoneTrio shots={["community", "post-detail", "create-post"]} />}
        caption="Community · a post with comments · sharing a post · Illustrative sample data"
      />

      <LoopSection />

      {/* Trust */}
      <Section tone="cream">
        <Container>
          <SectionHeading align="center" eyebrow="Built on trust" title="Show up with confidence." lead="You should never wonder whether an event is real, or whether your hours will count." />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TRUST.map((t, i) => (
              <ScrollReveal key={t.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-border bg-card p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fde8e5] text-[#7b2529] dark:bg-[#ff6b6b]/15 dark:text-[#ffb4ae]"><t.icon className="h-6 w-6" aria-hidden /></span>
                  <h3 className="mt-5 text-xl font-bold text-foreground">{t.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{t.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div className="mx-auto mt-10 flex max-w-3xl items-start gap-4 rounded-3xl border border-border bg-card p-7">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Star className="h-5 w-5" aria-hidden /></span>
            <p className="leading-relaxed text-muted-foreground"><strong className="text-foreground">Free to use.</strong> There are no subscriptions or paid features. If an organisation tickets an event, the price is on the event page before you book.</p>
          </div>
        </Container>
      </Section>

      <Section id="faq">
        <Container className="max-w-3xl">
          <SectionHeading align="center" eyebrow="FAQ" title="Questions from volunteers" />
          <div className="mt-12"><FaqAccordion items={FAQS} /></div>
        </Container>
      </Section>

      <CtaBand
        title="You belong here."
        lead="Join a community of people who don’t just care. They show up."
        primary={{ href: "/signup", label: "Start volunteering today" }}
        secondary={{ href: "/how-it-works", label: "See how it works" }}
      />
    </MarketingShell>
  )
}
