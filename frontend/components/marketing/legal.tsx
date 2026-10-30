import type { ReactNode } from "react"
import Link from "next/link"
import { CONTACT_EMAIL } from "@/lib/marketing-content"
import { Container, Eyebrow } from "./primitives"

export interface LegalSection {
  id: string
  title: string
  body: ReactNode
}

/** Readable legal page: header, table of contents, numbered sections with anchors. */
export function LegalLayout({
  title, effective, intro, sections,
}: { title: string; effective: string; intro?: string; sections: LegalSection[] }) {
  return (
    <>
      <section className="border-b border-border bg-muted/50 py-16 sm:py-20">
        <Container>
          <Eyebrow>Legal</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          <p className="mt-4 text-muted-foreground">Effective {effective}</p>
          {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
        </Container>
      </section>
      <Container className="grid gap-12 py-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16 lg:py-20">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">On this page</p>
          <ol className="mt-4 space-y-1 border-l border-border">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-[#ff6b6b] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="max-w-3xl">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-border py-9 first:pt-0 last:border-0">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{i + 1}. {s.title}</h2>
              <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-muted-foreground [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{s.body}</div>
            </section>
          ))}
          <p className="mt-10 rounded-2xl bg-muted/60 p-6 text-sm leading-relaxed text-muted-foreground">
            Questions about these terms? Write to <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-foreground underline underline-offset-4">{CONTACT_EMAIL}</a>. See also our{" "}
            <Link href="/legal/privacy" className="font-semibold text-foreground underline underline-offset-4">Privacy policy</Link> and{" "}
            <Link href="/legal/cookies" className="font-semibold text-foreground underline underline-offset-4">Cookie policy</Link>.
          </p>
        </article>
      </Container>
    </>
  )
}
