import type { Metadata } from "next"
import { Building2, FileCheck, Heart, Repeat, Shield, Sparkles, TrendingUp, Users, Zap } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CtaBand } from "@/components/marketing/cta"
import { Container, Eyebrow, GradientText, Section, SectionHeading } from "@/components/marketing/primitives"
import { MarketingShell } from "@/components/marketing/shell"
import { StatStrip } from "@/components/marketing/stats"
import { CONTACT_EMAIL, STATS } from "@/lib/marketing-content"

export const metadata: Metadata = {
  title: "About",
  description: "Kindly gives organisations and volunteers an identity. Learn why we built it, what we believe, and where we are heading.",
  openGraph: {
    title: "About Kindly",
    description: "We believe in the power of showing up.",
    type: "website",
  },
}

const GAPS = [
  { icon: Sparkles, title: "Intent without motivation", text: "Most volunteers mean well. But nothing makes showing up feel seen or remembered, so a busy week quietly wins." },
  { icon: Building2, title: "Organisations without an identity", text: "Genuine NGOs and community groups look no different from anyone else online. Their work lives in chat groups, posters and spreadsheets." },
  { icon: FileCheck, title: "Service without proof", text: "Attendance is taken on paper and paper certificates are hard to trust. A volunteer’s effort can’t easily be verified or shown to anyone." },
]

const VALUES = [
  { icon: Shield, title: "Integrity over optics", text: "Volunteer hours on Kindly are recorded from check-in, and self check-in only works at the venue, within 200 metres. We built verification into the foundation because credibility, for volunteers and organisations alike, is the only thing worth building on." },
  { icon: Heart, title: "Community before product", text: "Kindly is a product, but it is more importantly a community. The decisions we make about features, design and policy start with one question: does this make it easier or harder for someone to show up and help? Technology is just the enabler." },
  { icon: TrendingUp, title: "Long-term impact", text: "One-off charity drives create feel-good moments. Long-term volunteering creates change. Kindly is built to turn a first-time volunteer into a habitual one, through recognition, community and a profile that grows with every event attended." },
  { icon: Users, title: "Real causes, close to home", text: "The most powerful act of kindness is one that happens close to home. Kindly does not aggregate generic campaigns. It connects you with real organisations running real events in your community, wherever that is." },
  { icon: Zap, title: "Friction is the enemy", text: "The number one reason people don’t volunteer is not lack of desire, it’s lack of a clear, easy path. Every design decision on Kindly is made to reduce friction: fewer steps, no gatekeeping, no bureaucracy. Showing up should be simple." },
  { icon: Repeat, title: "Transparency by default", text: "Every organisation on Kindly is reviewed before it goes live. Volunteer hours come from check-ins, not self-reporting, and certificates come only from the organisations that issued them. Trust is built by showing the truth, not curating it." },
]

const TIMELINE = [
  { when: "End 2025", title: "The idea", text: "I noticed that local community organisations struggle not with funding but with reliable manpower. Meanwhile, thousands of students and young professionals want to contribute but cannot find vetted opportunities. The idea for Kindly is written on a notebook." },
  { when: "Early 2026", title: "First version", text: "I worked in some organisations to find out that events are created and carried out manually. Attendance is tracked on paper." },
  { when: "Early 2026", title: "Platform launch", text: "That’s when I brought the idea in my head to life, and Kindly was created. Kindly is a full platform: event creation, volunteer profiles, location-verified check-in and certificates." },
  { when: STATS.asOf, title: "Where we are now", text: `${STATS.volunteers} volunteers, ${STATS.organisations} organisations and ${STATS.hours} volunteer hours so far, and growing.` },
  { when: "Vision for 2026 onwards", title: "Growing the community", text: "Kindly should be available to every organisation and volunteer who wants it, wherever they are. 50,000 volunteers. 1,200+ events hosted. Location-verified check-ins already keep attendance honest. The aim is certificates credible enough to be accepted by colleges and employers. This is just the beginning." },
]

export default function AboutPage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-14 text-center sm:pb-24 sm:pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(55%_60%_at_50%_0%,rgba(255,107,107,0.16),transparent)]" />
        <Container className="max-w-4xl">
          <ScrollReveal>
            <Eyebrow className="justify-center">About Kindly</Eyebrow>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl lg:leading-[1.04]">
              We believe in the power of <GradientText>showing up.</GradientText>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Kindly is a volunteering platform that gives organisations and volunteers an identity. We connect people who want to help with organisations that need them, and we verify every step of the way. Not because we don’t trust people. Because trust is what makes impact real.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      <StatStrip />

      {/* Mission */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
            <ScrollReveal>
              <Eyebrow>Our mission</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:leading-[1.1]">Build the infrastructure for volunteering.</h2>
            </ScrollReveal>
            <ScrollReveal delay={0.08} className="space-y-5 text-[17px] leading-relaxed text-muted-foreground">
              <p>India has one of the youngest populations in the world and one of the most pressing sets of social challenges: in education, environment, food security, health, and more. At the same time, there are millions of students and young professionals who genuinely want to contribute but have no reliable way to connect with the causes that need them.</p>
              <p>Kindly exists to close that gap. We are building the infrastructure for volunteering: an identity for every organisation, authentic proof for every volunteer, and a community that gives people a reason to keep showing up. The goal is to make volunteering as easy, reliable and habitual as ordering a meal.</p>
              <p>Kindly is also building a community. A place where doing good becomes a part of your identity. Where your volunteer hours tell a story. Where the people you meet on event day become people you associate with for years.</p>
              <p>We measure success not in downloads or revenue but in hours volunteered, certificates earned, and organisations that can now do more with the reliable human energy Kindly brings to them.</p>
            </ScrollReveal>
          </div>
        </Container>
      </Section>

      {/* The idea */}
      <Section tone="cream">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="The idea"
            title={<>Intent is common. Motivation can be <GradientText>designed.</GradientText></>}
            lead="Good intent isn’t the problem. Three gaps stand between a kind impulse and a lasting habit of service. Kindly is built to close all three at once: an identity for organisations, authentic proof for volunteers, and a social layer that makes showing up worth it."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {GAPS.map((g, i) => (
              <ScrollReveal key={g.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-sm">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7b2529] text-white"><g.icon className="h-6 w-6" aria-hidden /></span>
                  <h3 className="mt-6 text-xl font-bold text-foreground">{g.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{g.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section>
        <Container>
          <SectionHeading align="center" eyebrow="What we believe" title="Principles that drive every product decision" lead="These are not slogans. They are the choices we hold ourselves to." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <ScrollReveal key={v.title} delay={(i % 3) * 0.07}>
                <div className="h-full rounded-3xl border border-border bg-card p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fde8e5] text-[#7b2529] dark:bg-[#ff6b6b]/15 dark:text-[#ffb4ae]"><v.icon className="h-5 w-5" aria-hidden /></span>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{v.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{v.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Story */}
      <Section tone="muted">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="Our story" title="From a notebook to a platform" />
          <ol className="mt-12">
            {TIMELINE.map((t, i) => (
              <li key={t.title} className="relative flex gap-6 pb-12 last:pb-0">
                {i < TIMELINE.length - 1 && <span aria-hidden className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-border" />}
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#f59e0b] text-sm font-bold text-white">{i + 1}</span>
                <ScrollReveal className="pb-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{t.when}</p>
                  <h3 className="mt-1 text-xl font-bold text-foreground">{t.title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-muted-foreground">{t.text}</p>
                </ScrollReveal>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Founder */}
      <Section>
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="A note from the founder" title="Why we built this" />
          <ScrollReveal>
            <figure className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
              <blockquote className="text-lg italic leading-relaxed text-muted-foreground sm:text-xl">
                “The real work in our communities has always been done quietly. I watched people build communities after their 9-to-5s without asking for a microphone. But today, good intentions get lost in the noise. KINDLY is our answer to that. We built a platform that turns intent into measurable, real-world action. It’s for the people who actually want to show up, not just talk about it.”
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#f59e0b] text-lg font-bold text-white" aria-hidden>MD</span>
                <span>
                  <span className="block font-bold text-foreground">Manas Dhivare</span>
                  <span className="block text-sm text-muted-foreground">Founder, Kindly</span>
                </span>
              </figcaption>
            </figure>
          </ScrollReveal>
        </Container>
      </Section>

      <CtaBand
        title="Get in touch."
        lead={`We read every message, whether you’re a volunteer, an organisation, a journalist, or someone who just wants to say hello. Write to ${CONTACT_EMAIL}.`}
        primary={{ href: `mailto:${CONTACT_EMAIL}`, label: "Write to us" }}
        secondary={{ href: "/how-it-works", label: "See how it works" }}
      />
    </MarketingShell>
  )
}
