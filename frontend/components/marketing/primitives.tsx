import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>
}

const TONES = {
  default: "bg-background text-foreground",
  muted: "bg-muted/50 text-foreground dark:bg-white/[0.03]",
  cream: "bg-[#faf5ee] text-foreground dark:bg-neutral-900/70",
  dark: "bg-neutral-950 text-white",
} as const
export type Tone = keyof typeof TONES

export function Section({
  id, tone = "default", className, children,
}: { id?: string; tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("relative scroll-mt-20 py-20 sm:py-24", TONES[tone], className)}>
      {children}
    </section>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#7b2529] dark:text-[#f4a6a0]", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b6b]" aria-hidden />
      {children}
    </p>
  )
}

export function SectionHeading({
  eyebrow, title, lead, align = "left", tone = "default", className,
}: { eyebrow?: string; title: ReactNode; lead?: ReactNode; align?: "left" | "center"; tone?: Tone; className?: string }) {
  const dark = tone === "dark"
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow className={cn(align === "center" && "justify-center", dark && "text-[#f4c9c2] dark:text-[#f4c9c2]")}>{eyebrow}</Eyebrow>}
      <h2 className={cn("mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-[1.1]", dark ? "text-white" : "text-foreground")}>{title}</h2>
      {lead && <p className={cn("mt-5 text-lg leading-relaxed", dark ? "text-white/75" : "text-muted-foreground")}>{lead}</p>}
    </div>
  )
}

export function GradientText({ children }: { children: ReactNode }) {
  return <span className="bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] bg-clip-text text-transparent">{children}</span>
}

export function SampleNote({ className }: { className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>Illustrative sample data</p>
}

const CTA_BASE = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
export const ctaPrimary = `${CTA_BASE} bg-gradient-to-r from-[#ff6b6b] to-[#f59e0b] text-white shadow-sm hover:opacity-90 focus-visible:ring-[#ff6b6b]`
export const ctaSecondary = `${CTA_BASE} border border-border bg-card text-foreground hover:bg-muted focus-visible:ring-foreground/40`
export const ctaOnDark = `${CTA_BASE} border border-white/25 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/70 focus-visible:ring-offset-transparent`
export const ctaLight = `${CTA_BASE} bg-white text-[#7b2529] shadow-sm hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-transparent`
