import Image from "next/image"
import { Award, MapPinned, Megaphone, Repeat, Search, Sparkles, Ticket, Users } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { cn } from "@/lib/utils"
import { Container, GradientText, Section } from "./primitives"

const STEPS = [
  { icon: Search, title: "Discover", volunteer: "Events matched to the causes they care about", org: "Your event in front of people who already care" },
  { icon: Ticket, title: "Commit", volunteer: "A confirmed spot and a ticket on their phone", org: "A reliable headcount before the day" },
  { icon: MapPinned, title: "Show up", volunteer: "Location-verified check-in, no paperwork", org: "Attendance you can trust" },
  { icon: Award, title: "Earn proof", volunteer: "A certificate with verified hours", org: "Certificates you can issue to everyone who attended" },
  { icon: Sparkles, title: "Be seen", volunteer: "A profile, journey and posts that show who they are", org: "Your name carried with every post and badge" },
  { icon: Repeat, title: "Come back", volunteer: "Follows, updates and new events pull them back", org: "Repeat volunteers and a growing community" },
]

const OUTCOMES = [
  { icon: Users, title: "Turn intent into attendance", text: "A confirmed spot and organiser updates turn “maybe” into “I’ll be there”." },
  { icon: Repeat, title: "Turn first-timers into regulars", text: "Proof, recognition and a growing profile give volunteers a reason for the second and third visit." },
  { icon: Megaphone, title: "Let your work speak for itself", text: "Photos, posts and reviews from real, verified events build a reputation that travels beyond your own network." },
]

/** The motivation loop: why verified service plus identity makes people come back. */
export function LoopSection({ id = "motivation" }: { id?: string }) {
  return (
    <Section id={id} tone="dark" className="overflow-hidden">
      <Image src="/logored.png" alt="" width={600} height={600} aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] opacity-[0.12]" />
      <Container className="relative">
        <ScrollReveal className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f4c9c2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b6b]" aria-hidden />
              The idea behind the product
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.08]">
              Intent is common.<br />Motivation can be <GradientText>designed.</GradientText>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-white/75">
            People rarely skip volunteering because they don’t care. They skip it because the effort is invisible and nothing rewards the second visit. Kindly places verified service inside the social mechanics people already respond to (identity, recognition, belonging), so showing up once makes showing up again more likely.
          </p>
        </ScrollReveal>

        <ol className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative list-none">
              <ScrollReveal delay={i * 0.05}>
                <span className={cn("flex h-14 w-14 items-center justify-center rounded-full text-white", i === STEPS.length - 1 ? "bg-[#ff6b6b]" : "bg-[#7b2529]")}>
                  <s.icon className="h-6 w-6" aria-hidden />
                </span>
                <p className="mt-5 text-[11px] font-bold tracking-[0.14em] text-[#e9b4aa]">0{i + 1}</p>
                <h3 className="mt-1 text-xl font-bold text-white">{s.title}</h3>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3c4bb]">Volunteer</p>
                <p className="mt-1 text-sm leading-relaxed text-white/85">{s.volunteer}</p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3c4bb]">Your organisation</p>
                <p className="mt-1 text-sm leading-relaxed text-white/85">{s.org}</p>
              </ScrollReveal>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="pointer-events-none absolute left-16 top-7 hidden w-[calc(100%-4rem+2rem)] border-t border-dashed border-white/25 lg:block" />
              )}
            </li>
          ))}
        </ol>

        <div aria-hidden className="mx-7 mt-10 hidden h-8 rounded-b-3xl border-x border-b border-dashed border-white/25 lg:block" />
        <p className="mt-4 text-center text-sm text-white/85 lg:-mt-3">
          <span className="font-bold text-[#ff8a80]">…and the loop repeats.</span> Every turn deepens the volunteer’s identity <strong className="text-white">and</strong> your organisation’s reputation.
        </p>

        <div className="mt-14 border-t border-white/15 pt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f3c4bb]">What the loop is designed to do for your organisation</p>
          <ul className="mt-5 grid gap-6 md:grid-cols-3">
            {OUTCOMES.map((o) => (
              <li key={o.title} className="flex gap-3">
                <o.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#ff6b6b]" aria-hidden />
                <div>
                  <h3 className="font-semibold text-white">{o.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{o.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  )
}
