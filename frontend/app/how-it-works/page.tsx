import type { Metadata } from "next"
import Link from "next/link"
import { ClipboardCheck, FileCheck, Lock, MapPin, ShieldCheck, Building2 } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CtaBand } from "@/components/marketing/cta"
import { FaqAccordion, type FaqItem } from "@/components/marketing/faq"
import { FaqJsonLd } from "@/components/marketing/faq-json-ld"
import { HowTabs } from "@/components/marketing/how-tabs"
import { LoopSection } from "@/components/marketing/loop"
import { Container, Eyebrow, GradientText, Section, SectionHeading } from "@/components/marketing/primitives"
import { MarketingShell } from "@/components/marketing/shell"

export const metadata: Metadata = {
  title: "How it works",
  description: "See exactly how Kindly works for volunteers and organisations, from signing up and registering to location-verified check-in, certificates and a verified impact profile.",
  openGraph: {
    title: "How Kindly works",
    description: "From intention to real impact: discover, register, check in, earn proof and be seen.",
    type: "website",
  },
}

const TRUST = [
  { icon: Building2, title: "Every organisation is reviewed", text: "Applications, with an optional registration certificate, PAN and proof of organisation, are reviewed by our team before an organisation can go live." },
  { icon: ClipboardCheck, title: "Events are approved first", text: "New events are submitted for review, so volunteers browse listings from approved organisations." },
  { icon: MapPin, title: "Attendance you can rely on", text: "Check-in opens when the event starts and works only within 200 metres of the venue." },
  { icon: FileCheck, title: "Hours and certificates are earned", text: "Volunteer hours come from check-ins rather than self-reporting, and certificates come only from the organisation that issued them." },
  { icon: Lock, title: "Private by design", text: "Verification documents are kept in private storage, and volunteers can make their profile private and approve who follows them." },
  { icon: ShieldCheck, title: "A record of decisions", text: "Approvals, suspensions and other administrative actions are written to an audit log." },
]

const FAQS: FaqItem[] = [
  { q: "Is Kindly free to use?", a: "Yes. Kindly is free to use for volunteers and organisations: there are no subscriptions or paid features. The only charge is on ticketed events, where volunteers pay the organisation’s ticket price through a secure online payment and a platform fee applies." },
  { q: "Is Kindly limited to a particular city?", a: "No. Kindly isn’t tied to any one city or cause. Organisations list events wherever they work, and volunteers browse events by cause, date and place." },
  { q: "How does the geo-lock check-in work?", a: "When you tap Check In, Kindly asks for your location. Check-in opens when the event starts, and Kindly verifies you are within 200 metres of the event’s registered location before recording your attendance. This keeps attendance records genuine." },
  { q: "Who generates the certificate: me or the organisation?", a: "The organisation issues it. After the event, the organisation issues certificates to everyone who attended, so you don’t need to request one. It appears in your event history as a downloadable PDF." },
  { q: "Can I cancel a registration?", a: "Yes. You can cancel from your dashboard at any time before the event starts. Please cancel early so the organisation can offer your spot to another volunteer." },
  { q: "How are organisations verified?", a: "Every organisation submits its details during sign-up, optionally with supporting documents such as a registration certificate, PAN or proof of organisation. Our team reviews each application, and reviews every event before it is published. We focus on NGOs, registered trusts and community groups with a clear public mission." },
]

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <FaqJsonLd items={FAQS} />

      <section className="relative overflow-hidden pb-6 pt-14 text-center sm:pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(55%_60%_at_50%_0%,rgba(255,107,107,0.16),transparent)]" />
        <Container className="max-w-4xl">
          <ScrollReveal>
            <Eyebrow className="justify-center">How it works</Eyebrow>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl lg:leading-[1.04]">
              From intention to <GradientText>real impact.</GradientText>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Kindly is the connective tissue between people who want to help and organisations that need them, giving both a verified identity. Here is exactly how it works, from sign-up to certificate.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      <HowTabs />

      <LoopSection />

      <Section tone="cream">
        <Container>
          <SectionHeading align="center" eyebrow="Built on trust" title="Verification is part of the product, not an add-on." lead="Volunteers need to know an organisation is real. Organisations need to know attendance is honest. Kindly is designed around both." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST.map((t, i) => (
              <ScrollReveal key={t.title} delay={(i % 3) * 0.07}>
                <div className="h-full rounded-3xl border border-border bg-card p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fde8e5] text-[#7b2529] dark:bg-[#ff6b6b]/15 dark:text-[#ffb4ae]"><t.icon className="h-5 w-5" aria-hidden /></span>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{t.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{t.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="faq">
        <Container className="max-w-3xl">
          <SectionHeading align="center" eyebrow="FAQ" title="Frequently asked questions" lead={<>More questions? Visit the <Link href="/resources/help-center" className="font-semibold text-foreground underline underline-offset-4">Help centre</Link>.</>} />
          <div className="mt-12"><FaqAccordion items={FAQS} /></div>
        </Container>
      </Section>

      <CtaBand
        title="Ready to get started?"
        lead="Join the volunteers and organisations making a difference with Kindly."
        primary={{ href: "/signup", label: "Sign up as a volunteer" }}
        secondary={{ href: "/org-signup", label: "Register your organisation" }}
      />
    </MarketingShell>
  )
}
