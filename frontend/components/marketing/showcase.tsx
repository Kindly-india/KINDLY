import type { ReactNode } from "react"
import { Info, type LucideIcon } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { cn } from "@/lib/utils"
import { Container, Eyebrow, Section, type Tone } from "./primitives"

export interface Bullet {
  icon: LucideIcon
  title: string
  text: string
}

/** Text + checklist on one side, a real product visual on the other. */
export function FeatureShowcase({
  id, tone = "default", eyebrow, title, lead, bullets, visual, caption, note, reverse,
}: {
  id?: string
  tone?: Tone
  eyebrow: string
  title: ReactNode
  lead: ReactNode
  bullets: Bullet[]
  visual: ReactNode
  caption?: string
  note?: string
  reverse?: boolean
}) {
  return (
    <Section id={id} tone={tone}>
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <ScrollReveal className={cn("lg:col-span-5", reverse && "lg:order-2")}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:leading-[1.1]">{title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{lead}</p>
            <ul className="mt-8 space-y-5">
              {bullets.map((b) => (
                <li key={b.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fde8e5] text-[#7b2529] dark:bg-[#ff6b6b]/15 dark:text-[#ffb4ae]">
                    <b.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{b.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{b.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            {note && (
              <p className="mt-7 flex gap-2.5 rounded-xl bg-muted/70 p-4 text-sm leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#7b2529] dark:text-[#f4a6a0]" aria-hidden />
                <span>{note}</span>
              </p>
            )}
          </ScrollReveal>
          <ScrollReveal delay={0.08} className={cn("lg:col-span-7", reverse && "lg:order-1")}>
            {visual}
            {caption && <p className="mt-5 text-center text-xs text-muted-foreground">{caption}</p>}
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  )
}
