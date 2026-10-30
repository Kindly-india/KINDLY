import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { Container, ctaLight, ctaOnDark } from "./primitives"

/** Closing call-to-action band. */
export function CtaBand({
  title, lead, primary, secondary,
}: {
  title: string
  lead: string
  primary: { href: string; label: string }
  secondary?: { href: string; label: string }
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#7b2529] to-[#3a1114] py-20 text-white sm:py-24">
      <Image src="/logobeige.png" alt="" width={600} height={600} aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-[26rem] w-[26rem] opacity-[0.1]" />
      <Container className="relative">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-[1.1]">{title}</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/80">{lead}</p>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href={primary.href} className={ctaLight}>{primary.label}</Link>
            {secondary && <Link href={secondary.href} className={ctaOnDark}>{secondary.label}</Link>}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  )
}
