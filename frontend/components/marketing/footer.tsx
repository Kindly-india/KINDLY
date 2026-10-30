import Image from "next/image"
import Link from "next/link"
import { Mail } from "lucide-react"
import { CONTACT_EMAIL, FOOTER_LINKS } from "@/lib/marketing-content"
import { Container } from "./primitives"

export function MarketingFooter() {
  return (
    <footer className="bg-neutral-950 text-white">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Image src="/logowhite.png" alt="KINDLY" width={1882} height={440} className="h-6 w-auto" />
            <p className="mt-5 max-w-xs text-lg font-semibold leading-snug text-white">Volunteering, with an <span className="text-[#ff8a80]">identity.</span></p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">Verified identity for organisations. Authentic proof for volunteers. A reason to keep showing up.</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white">
              <Mail className="h-4 w-4" aria-hidden />
              {CONTACT_EMAIL}
            </a>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(FOOTER_LINKS).map(([group, links]) => (
              <div key={group}>
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">{group}</h2>
                <ul className="mt-4 space-y-3">
                  {links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-white/75 transition-colors hover:text-white">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 KINDLY. All rights reserved.</p>
          <p>Illustrative screens on this site use fictional sample data.</p>
        </div>
      </Container>
    </footer>
  )
}
