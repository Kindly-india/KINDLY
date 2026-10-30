"use client"

import { useId, useState, type KeyboardEvent, type ReactNode } from "react"
import {
  Award, Building2, CalendarCheck, Camera, ClipboardCheck, Heart, IdCard, ListChecks, Lock, Megaphone, Search, Sparkles, Ticket, UserPlus,
  type LucideIcon,
} from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { cn } from "@/lib/utils"
import { DeviceDuo, PhoneTrio } from "./device"
import { Container, Section } from "./primitives"

interface Step {
  icon: LucideIcon
  title: string
  text: string
  points?: string[]
  visual: ReactNode
}

function WhoCanApply() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-7 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Who can apply</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {["Registered NGOs and trusts", "Institution-backed groups", "Informal community groups", "Individual organisers"].map((t) => (
          <li key={t} className="rounded-full bg-[#fde8e5] px-3.5 py-1.5 text-sm font-medium text-[#7b2529] dark:bg-[#ff6b6b]/15 dark:text-[#ffb4ae]">{t}</li>
        ))}
      </ul>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Optional documents</p>
      <ul className="mt-3 space-y-2 text-[15px] text-foreground">
        {["Registration certificate", "PAN card", "Proof of organisation"].map((t) => (
          <li key={t} className="flex items-center gap-2.5"><Lock className="h-4 w-4 text-muted-foreground" aria-hidden />{t}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">Documents are kept in private storage.</p>
    </div>
  )
}

const VOLUNTEER_STEPS: Step[] = [
  {
    icon: UserPlus, title: "Create your volunteer profile",
    text: "Sign in with an email one-time code, Google or a passkey. It takes moments, and there is no password to remember. Tell us which causes you care about, then add your skills and a short bio.",
    points: ["Your profile becomes your volunteer identity", "The causes you pick personalise the events you see"],
    visual: <PhoneTrio shots={["settings-interests-privacy"]} />,
  },
  {
    icon: Search, title: "Discover opportunities",
    text: "Browse upcoming events and filter by cause, date, time of day and duration, or search by title or place. Every listing shows the organisation, the exact location and what you will be doing.",
    points: ["Every organisation and event is reviewed first"],
    visual: <DeviceDuo desktop="events-feed" mobile="events-filters" />,
  },
  {
    icon: Ticket, title: "Register for an event",
    text: "Tap Book My Slot and confirm. You get a ticket with the date, time, location, point of contact and what to bring. Paid events use a secure online payment. You can cancel any time before the event starts.",
    visual: <PhoneTrio shots={["event-detail", "paid-checkout", "registered-ticket"]} />,
  },
  {
    icon: ListChecks, title: "Check in at the venue",
    text: "On the day, open your ticket and tap Check In. Check-in opens when the event starts, and our geo-lock verifies you are within 200 metres of the venue. If it can’t, Kindly tells you how far away you are.",
    points: ["Your hours are credited automatically from check-in"],
    visual: <PhoneTrio shots={["checkin-too-far", "checkin-success"]} />,
  },
  {
    icon: Camera, title: "Volunteer, then share the day",
    text: "Show up, do the work and make a difference. Afterwards, share photos and a few words from events you attended, and follow the fellow volunteers you met.",
    points: ["Posts are open only to volunteers who attended", "Up to five photos a post, three posts per event"],
    visual: <PhoneTrio shots={["create-post", "post-detail", "community"]} />,
  },
  {
    icon: Award, title: "Get your certificate",
    text: "Once the event is over, the organisation issues certificates to everyone who attended. Each carries your name, the event details and your hours, is signed by the organisation and has a unique verification ID.",
    points: ["Download it as a PDF for your resume, LinkedIn or college portfolio"],
    visual: <DeviceDuo desktop="showcase-certificate" mobile="history-certificates" />,
  },
  {
    icon: IdCard, title: "Build your impact profile",
    text: "Every event adds to your profile: total hours, causes supported, organisations you have worked with and skills you have applied. Organisations can endorse your skills, and you decide who sees it.",
    points: ["Make your account private and approve who follows you"],
    visual: <DeviceDuo desktop="profile-own" mobile="profile-own" />,
  },
]

const ORG_STEPS: Step[] = [
  {
    icon: Building2, title: "Register your organisation",
    text: "Sign up as an organisation and complete your profile with your mission, logo, website and contact details. Our team reviews every application before your events go live and emails you when you are approved.",
    points: ["Approved organisations can carry a verified badge"],
    visual: <WhoCanApply />,
  },
  {
    icon: CalendarCheck, title: "Create and submit events",
    text: "A guided flow takes you through the details, the schedule and the logistics, with a live preview. Pin the location on the map, set your volunteer limit and submit. After a quick review by our team, your event goes live.",
    points: ["Free by default, with optional ticketing"],
    visual: <DeviceDuo desktop="wizard-details" mobile="wizard-schedule" />,
  },
  {
    icon: Megaphone, title: "Manage registrations",
    text: "Watch registrations come in on your dashboard and open any volunteer’s profile to see their skills, past events and endorsements. Message everyone who has registered with a broadcast.",
    visual: <DeviceDuo desktop="dashboard" mobile="events-list" />,
  },
  {
    icon: ClipboardCheck, title: "Track attendance in real time",
    text: "Your roster shows who has arrived and who hasn’t. Volunteers check themselves in at the venue, and you can check people in or undo a check-in yourself.",
    points: ["When you complete the event, volunteers who never checked in are marked as missed"],
    visual: <DeviceDuo desktop="manage-checkin" mobile="manage-roster" />,
  },
  {
    icon: Award, title: "Complete the event and recognise volunteers",
    text: "Close out the event: review the report, add photos to the gallery and issue certificates to everyone who attended, signed with your organisation’s signature.",
    visual: <DeviceDuo desktop="report" mobile="report" />,
  },
  {
    icon: Sparkles, title: "See your impact",
    text: "Your analytics track volunteer hours, active volunteers, events hosted and your repeat-volunteer rate, with an event-by-event table. Export a report to share with donors or supporters.",
    visual: <DeviceDuo desktop="org-analytics" mobile="org-analytics" />,
  },
]

const TABS = [
  { id: "volunteers", label: "For volunteers", icon: Heart, steps: VOLUNTEER_STEPS, tone: "default" as const },
  { id: "organisations", label: "For organisations", icon: Building2, steps: ORG_STEPS, tone: "default" as const },
]

export function HowTabs() {
  const [active, setActive] = useState(0)
  const base = useId()

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    e.preventDefault()
    const next = (active + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length
    setActive(next)
    document.getElementById(`${base}-tab-${next}`)?.focus()
  }

  const tab = TABS[active]
  return (
    <Section className="pt-6 sm:pt-6">
      <Container>
        <div className="flex justify-center">
          <div role="tablist" aria-label="Choose your journey" className="inline-flex rounded-full border border-border bg-card p-1.5 shadow-sm">
            {TABS.map((t, i) => {
              const on = i === active
              return (
                <button
                  key={t.id}
                  id={`${base}-tab-${i}`}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  aria-controls={`${base}-panel`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={onKey}
                  className={cn("flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:px-7", on ? "bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  <t.icon className="h-4 w-4" aria-hidden />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} className="mt-16 space-y-24 sm:space-y-28" key={tab.id}>
          {tab.steps.map((s, i) => (
            <div key={s.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <ScrollReveal className={cn(i % 2 === 1 && "lg:order-2")}>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7b2529] text-white"><s.icon className="h-6 w-6" aria-hidden /></span>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b2529] dark:text-[#f4a6a0]">Step {i + 1}</span>
                </div>
                <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{s.title}</h3>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{s.text}</p>
                {s.points && (
                  <ul className="mt-5 space-y-2.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[15px] text-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b6b]" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollReveal>
              <ScrollReveal delay={0.08} className={cn(i % 2 === 1 && "lg:order-1")}>{s.visual}</ScrollReveal>
            </div>
          ))}
        </div>
        <p className="mt-16 text-center text-xs text-muted-foreground">Screens shown use illustrative sample data.</p>
      </Container>
    </Section>
  )
}
